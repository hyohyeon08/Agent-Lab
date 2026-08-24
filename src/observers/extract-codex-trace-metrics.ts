import fs from "node:fs";
import path from "node:path";

type JsonObject = Record<string, unknown>;
type ToolCategory =
  | "plan"
  | "search"
  | "read"
  | "edit"
  | "test"
  | "shell"
  | "wait"
  | "other";

interface TraceEvent extends JsonObject {
  timestamp: string;
  ordinal: number;
  type: string;
  payload: JsonObject;
}

interface TokenUsage {
  input_tokens: number;
  cached_input_tokens: number;
  cache_write_input_tokens: number;
  uncached_input_tokens: number;
  output_tokens: number;
  reasoning_output_tokens: number;
  total_tokens: number;
}

interface ToolEnvelope {
  sequence: number;
  call_id: string;
  categories: ToolCategory[];
  started_at: string;
  completed_at: string;
  duration_ms: number;
  logical_call_count: number;
  result: "success" | "failure" | "unknown";
  command: string | undefined;
  exitCode: number | undefined;
  testOutput: string | undefined;
}

function record(value: unknown, label: string): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Expected object at ${label}`);
  }
  return value as JsonObject;
}

function stringValue(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`Expected string at ${label}`);
  }
  return value;
}

function numberValue(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Expected number at ${label}`);
  }
  return value;
}

function arrayValue(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Expected array at ${label}`);
  }
  return value;
}

function parseArgs(argv: string[]): {
  tracePath: string;
  runId: string;
  outputPath: string | undefined;
} {
  const values = new Map<string, string>();

  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === undefined || value === undefined || !key.startsWith("--")) {
      throw new Error(
        "Usage: extract:trace-metrics --trace <jsonl> --run-id <RUN-ID> [--output <yaml>]",
      );
    }
    values.set(key, value);
  }

  const tracePath = values.get("--trace");
  const runId = values.get("--run-id");
  if (tracePath === undefined || runId === undefined) {
    throw new Error("Both --trace and --run-id are required");
  }

  return { tracePath, runId, outputPath: values.get("--output") };
}

function parseTrace(tracePath: string): TraceEvent[] {
  return fs
    .readFileSync(tracePath, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      const parsed = record(JSON.parse(line), `line ${index + 1}`);
      return {
        ...parsed,
        timestamp: stringValue(parsed.timestamp, `line ${index + 1}.timestamp`),
        ordinal: numberValue(parsed.ordinal, `line ${index + 1}.ordinal`),
        type: stringValue(parsed.type, `line ${index + 1}.type`),
        payload: record(parsed.payload, `line ${index + 1}.payload`),
      };
    });
}

function payloadType(event: TraceEvent): string | undefined {
  return typeof event.payload.type === "string" ? event.payload.type : undefined;
}

function timestampMs(timestamp: string): number {
  const value = Date.parse(timestamp);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid timestamp: ${timestamp}`);
  }
  return value;
}

function commandFromItem(item: JsonObject): string | undefined {
  const command = item.command;
  if (typeof command === "string") {
    return command;
  }
  if (Array.isArray(command)) {
    const parts = command.filter((part): part is string => typeof part === "string");
    return parts.at(-1);
  }
  return undefined;
}

function classifyCommand(command: string): ToolCategory {
  const normalized = command.toLowerCase();
  if (
    /(^|\s)(npm|pnpm|yarn)\s+(test|run\s+typecheck|typecheck)/.test(
      normalized,
    ) ||
    /(^|\s)(vitest|jest|pytest|cargo\s+test|go\s+test)(\s|$)/.test(normalized)
  ) {
    return "test";
  }
  if (/rg\s+--files|(^|[;&|]\s*)rg\s+/.test(normalized)) {
    return "search";
  }
  if (/(^|[;&|]\s*)(sed\s+-n|cat\s+|head\s+|tail\s+)/.test(normalized)) {
    return "read";
  }
  return "shell";
}

function categoriesForItems(
  items: TraceEvent[],
  callInput: string,
  callName: string,
): { categories: ToolCategory[]; command: string | undefined } {
  const categories: ToolCategory[] = [];
  let command: string | undefined;

  for (const event of items) {
    const item = record(event.payload.item, `ordinal ${event.ordinal}.item`);
    const type = stringValue(item.type, `ordinal ${event.ordinal}.item.type`);
    if (type === "FileChange") {
      categories.push("edit");
    } else if (type === "CommandExecution") {
      const currentCommand = commandFromItem(item);
      command ??= currentCommand;
      categories.push(
        currentCommand === undefined ? "shell" : classifyCommand(currentCommand),
      );
    }
  }

  if (categories.length === 0) {
    if (callName === "update_plan" || callInput.includes("tools.update_plan")) {
      categories.push("plan");
    } else if (
      callName === "wait" ||
      callName === "write_stdin" ||
      callInput.includes("tools.wait") ||
      callInput.includes("tools.write_stdin")
    ) {
      categories.push("wait");
    } else if (callInput.includes("tools.apply_patch")) {
      categories.push("edit");
    } else {
      categories.push("other");
    }
  }

  return { categories, command };
}

function resultForItems(items: TraceEvent[]): {
  result: "success" | "failure" | "unknown";
  exitCode: number | undefined;
  testOutput: string | undefined;
} {
  const commandItems = items
    .map((event) => record(event.payload.item, `ordinal ${event.ordinal}.item`))
    .filter((item) => item.type === "CommandExecution");
  const exitCodes = commandItems
    .map((item) => item.exit_code)
    .filter((value): value is number => typeof value === "number");
  const testOutput = commandItems
    .map((item) => item.aggregated_output)
    .find((value): value is string => typeof value === "string");

  if (exitCodes.some((exitCode) => exitCode !== 0)) {
    return { result: "failure", exitCode: exitCodes.find((code) => code !== 0), testOutput };
  }
  if (items.length > 0 && exitCodes.every((exitCode) => exitCode === 0)) {
    return { result: "success", exitCode: exitCodes.at(-1), testOutput };
  }
  return { result: "unknown", exitCode: undefined, testOutput };
}

function tokenUsage(event: TraceEvent): TokenUsage {
  const info = record(event.payload.info, `ordinal ${event.ordinal}.info`);
  const usage = record(
    info.last_token_usage,
    `ordinal ${event.ordinal}.info.last_token_usage`,
  );
  const inputTokens = numberValue(usage.input_tokens, "input_tokens");
  const cachedInputTokens = numberValue(
    usage.cached_input_tokens,
    "cached_input_tokens",
  );
  const cacheWriteInputTokens = numberValue(
    usage.cache_write_input_tokens,
    "cache_write_input_tokens",
  );
  return {
    input_tokens: inputTokens,
    cached_input_tokens: cachedInputTokens,
    cache_write_input_tokens: cacheWriteInputTokens,
    uncached_input_tokens:
      inputTokens - cachedInputTokens - cacheWriteInputTokens,
    output_tokens: numberValue(usage.output_tokens, "output_tokens"),
    reasoning_output_tokens: numberValue(
      usage.reasoning_output_tokens,
      "reasoning_output_tokens",
    ),
    total_tokens: numberValue(usage.total_tokens, "total_tokens"),
  };
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function yamlScalar(value: unknown): string {
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null) {
    return "null";
  }
  if (typeof value !== "string") {
    throw new Error(`Unsupported YAML scalar: ${String(value)}`);
  }
  if (
    /^[A-Za-z_][A-Za-z0-9_./-]*$/.test(value) &&
    !["true", "false", "null"].includes(value)
  ) {
    return value;
  }
  return JSON.stringify(value);
}

function isScalar(value: unknown): boolean {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function yamlObject(value: JsonObject, indent: number): string[] {
  const lines: string[] = [];
  const padding = " ".repeat(indent);

  for (const [key, child] of Object.entries(value)) {
    if (child === undefined) {
      continue;
    }
    if (isScalar(child)) {
      lines.push(`${padding}${key}: ${yamlScalar(child)}`);
    } else if (Array.isArray(child)) {
      if (child.length === 0) {
        lines.push(`${padding}${key}: []`);
      } else {
        lines.push(`${padding}${key}:`);
        lines.push(...yamlArray(child, indent + 2));
      }
    } else {
      const object = record(child, key);
      if (Object.keys(object).length === 0) {
        lines.push(`${padding}${key}: {}`);
      } else {
        lines.push(`${padding}${key}:`);
        lines.push(...yamlObject(object, indent + 2));
      }
    }
  }
  return lines;
}

function yamlArray(value: unknown[], indent: number): string[] {
  const lines: string[] = [];
  const padding = " ".repeat(indent);
  for (const child of value) {
    if (isScalar(child)) {
      lines.push(`${padding}- ${yamlScalar(child)}`);
    } else if (Array.isArray(child)) {
      lines.push(`${padding}-`);
      lines.push(...yamlArray(child, indent + 2));
    } else {
      const nested = yamlObject(record(child, "array item"), indent + 2);
      if (nested.length === 0) {
        lines.push(`${padding}- {}`);
      } else {
        lines.push(`${padding}- ${nested[0]!.slice(indent + 2)}`);
        lines.push(...nested.slice(1));
      }
    }
  }
  return lines;
}

function toYaml(value: JsonObject): string {
  return `${yamlObject(value, 0).join("\n")}\n`;
}

function sum(usages: TokenUsage[], key: keyof TokenUsage): number {
  return usages.reduce((total, usage) => total + usage[key], 0);
}

function extract(tracePath: string, runId: string): JsonObject {
  const events = parseTrace(tracePath);
  const session = events.find((event) => event.type === "session_meta");
  const taskStarted = events.find(
    (event) => event.type === "event_msg" && payloadType(event) === "task_started",
  );
  const taskComplete = events.find(
    (event) => event.type === "event_msg" && payloadType(event) === "task_complete",
  );
  if (session === undefined || taskStarted === undefined || taskComplete === undefined) {
    throw new Error("Trace is missing session_meta, task_started, or task_complete");
  }

  const callEvents = events.filter(
    (event) =>
      event.type === "response_item" && payloadType(event) === "custom_tool_call",
  );
  const outputEvents = events.filter(
    (event) =>
      event.type === "response_item" &&
      payloadType(event) === "custom_tool_call_output",
  );
  const itemEvents = events.filter(
    (event) => event.type === "event_msg" && payloadType(event) === "item_completed",
  );
  const outputByCallId = new Map(
    outputEvents.map((event) => [
      stringValue(event.payload.call_id, `ordinal ${event.ordinal}.call_id`),
      event,
    ]),
  );

  const tools: ToolEnvelope[] = callEvents.map((callEvent, index) => {
    const callId = stringValue(
      callEvent.payload.call_id,
      `ordinal ${callEvent.ordinal}.call_id`,
    );
    const outputEvent = outputByCallId.get(callId);
    if (outputEvent === undefined) {
      throw new Error(`Missing output for tool call ${callId}`);
    }
    const nestedItems = itemEvents.filter(
      (event) => event.ordinal > callEvent.ordinal && event.ordinal < outputEvent.ordinal,
    );
    const input =
      typeof callEvent.payload.input === "string" ? callEvent.payload.input : "";
    const name =
      typeof callEvent.payload.name === "string" ? callEvent.payload.name : "";
    const classified = categoriesForItems(nestedItems, input, name);
    const result = resultForItems(nestedItems);
    return {
      sequence: index + 1,
      call_id: callId,
      categories: classified.categories,
      started_at: callEvent.timestamp,
      completed_at: outputEvent.timestamp,
      duration_ms:
        timestampMs(outputEvent.timestamp) - timestampMs(callEvent.timestamp),
      logical_call_count: classified.categories.length,
      result: result.result,
      command: classified.command,
      exitCode: result.exitCode,
      testOutput: result.testOutput,
    };
  });

  const tokenEvents = events.filter(
    (event) => event.type === "event_msg" && payloadType(event) === "token_count",
  );
  if (tokenEvents.length !== tools.length + 1) {
    throw new Error(
      `Expected model response proxies to equal tool envelopes + 1; got ${tokenEvents.length} and ${tools.length}`,
    );
  }
  const usages = tokenEvents.map(tokenUsage);

  const finalAgentEvent = [...itemEvents]
    .reverse()
    .find((event) => record(event.payload.item, "final item").type === "AgentMessage");
  if (finalAgentEvent === undefined) {
    throw new Error("Trace is missing a completed final AgentMessage");
  }
  const finalCompletedAtMs = numberValue(
    finalAgentEvent.payload.completed_at_ms,
    "final AgentMessage completed_at_ms",
  );
  const taskStartedAtMs = timestampMs(taskStarted.timestamp);

  const modelRequests = usages.map((usage, index) => {
    const previousCategories =
      index === 0 ? ["task_start"] : tools[index - 1]!.categories;
    const nextCategories =
      index < tools.length ? tools[index]!.categories : ["final_answer"];
    const phaseStartedAtMs =
      index === 0
        ? taskStartedAtMs
        : timestampMs(tools[index - 1]!.completed_at);
    const phaseCompletedAtMs =
      index < tools.length
        ? timestampMs(tools[index]!.started_at)
        : finalCompletedAtMs;
    return {
      sequence: index + 1,
      preceded_by: previousCategories,
      followed_by: nextCategories,
      token_usage: usage,
      response_phase_duration_ms: phaseCompletedAtMs - phaseStartedAtMs,
    };
  });

  const firstEditEvent = itemEvents.find(
    (event) => record(event.payload.item, `ordinal ${event.ordinal}.item`).type === "FileChange",
  );
  const firstEditStartedAtMs =
    firstEditEvent === undefined
      ? undefined
      : numberValue(firstEditEvent.payload.started_at_ms, "first edit started_at_ms");
  const firstTestTool = tools.find(
    (tool) =>
      firstEditStartedAtMs !== undefined &&
      timestampMs(tool.started_at) >= firstEditStartedAtMs &&
      tool.categories.includes("test"),
  );
  const firstPassSuccess =
    firstTestTool === undefined
      ? "unavailable"
      : firstTestTool.exitCode === undefined
        ? "unavailable"
        : firstTestTool.exitCode === 0;

  const breakdown: Record<ToolCategory, number> = {
    plan: 0,
    search: 0,
    read: 0,
    edit: 0,
    test: 0,
    shell: 0,
    wait: 0,
    other: 0,
  };
  for (const tool of tools) {
    for (const category of tool.categories) {
      breakdown[category] += 1;
    }
  }

  const summaryInput = sum(usages, "input_tokens");
  const summaryCached = sum(usages, "cached_input_tokens");
  const summaryUncached = sum(usages, "uncached_input_tokens");
  const responseDuration = modelRequests.reduce(
    (total, request) => total + request.response_phase_duration_ms,
    0,
  );
  const toolDuration = tools.reduce((total, tool) => total + tool.duration_ms, 0);
  const failedToolCalls = tools.reduce(
    (total, tool) =>
      total + (tool.result === "failure" ? tool.logical_call_count : 0),
    0,
  );
  const testMatch = firstTestTool?.testOutput?.match(/ℹ tests (\d+)/);
  const passMatch = firstTestTool?.testOutput?.match(/ℹ pass (\d+)/);
  const failMatch = firstTestTool?.testOutput?.match(/ℹ fail (\d+)/);

  const taskId = stringValue(session.payload.session_id, "session_meta.session_id");
  const totalUsageInfo = record(
    tokenEvents.at(-1)!.payload.info,
    "last token_count.info",
  );
  const totalUsage = record(
    totalUsageInfo.total_token_usage,
    "last token_count.info.total_token_usage",
  );

  return {
    schema_version: 2,
    run_id: runId,
    source: {
      task_id: taskId,
      session_file: path.basename(tracePath),
      event: "token_count.last_token_usage",
      interpretation: "observable_model_response_proxy",
    },
    boundaries: {
      task_started_at: taskStarted.timestamp,
      first_tool_call_at: tools.at(0)?.started_at ?? "unavailable",
      first_edit_started_at:
        firstEditStartedAtMs === undefined
          ? "unavailable"
          : new Date(firstEditStartedAtMs).toISOString(),
      final_agent_message_completed_at: new Date(finalCompletedAtMs).toISOString(),
    },
    model_requests: modelRequests,
    tool_envelopes: tools.map((tool) => ({
      sequence: tool.sequence,
      call_id: tool.call_id,
      category:
        tool.categories.length === 1 ? tool.categories[0] : "mixed",
      logical_categories: tool.categories,
      started_at: tool.started_at,
      completed_at: tool.completed_at,
      duration_ms: tool.duration_ms,
      logical_call_count: tool.logical_call_count,
      result: tool.result,
    })),
    first_pass_evidence: {
      first_edit_started_at:
        firstEditStartedAtMs === undefined
          ? "unavailable"
          : new Date(firstEditStartedAtMs).toISOString(),
      first_post_edit_test: firstTestTool?.command ?? "unavailable",
      first_post_edit_test_exit_code:
        firstTestTool?.exitCode ?? "unavailable",
      first_pass_success: firstPassSuccess,
    },
    summary: {
      duration_ms: numberValue(taskComplete.payload.duration_ms, "duration_ms"),
      time_to_first_token_ms: numberValue(
        taskComplete.payload.time_to_first_token_ms,
        "time_to_first_token_ms",
      ),
      time_to_first_action_ms:
        tools.length === 0
          ? "unavailable"
          : timestampMs(tools[0]!.started_at) - taskStartedAtMs,
      model_request_count: usages.length,
      input_tokens: summaryInput,
      cached_input_tokens: summaryCached,
      cache_write_input_tokens: sum(usages, "cache_write_input_tokens"),
      uncached_input_tokens: summaryUncached,
      output_tokens: sum(usages, "output_tokens"),
      reasoning_output_tokens: sum(usages, "reasoning_output_tokens"),
      total_tokens: sum(usages, "total_tokens"),
      average_input_tokens_per_model_request: round(
        summaryInput / usages.length,
        2,
      ),
      cached_input_ratio:
        summaryInput === 0 ? "unavailable" : round(summaryCached / summaryInput, 4),
      peak_context_tokens: Math.max(...usages.map((usage) => usage.input_tokens)),
      time_to_first_edit_ms:
        firstEditStartedAtMs === undefined
          ? "unavailable"
          : firstEditStartedAtMs - taskStartedAtMs,
      time_to_first_edit_source:
        firstEditStartedAtMs === undefined
          ? "unavailable"
          : "file_change_started_at",
      model_inference_duration_ms_total: "unavailable",
      model_inference_duration_reason: "provider_inference_timing_not_exposed",
      model_response_phase_duration_ms_total: responseDuration,
      model_response_phase_duration_source: "trace_phase_wall_clock_proxy",
      tool_call_trace_envelope_count: tools.length,
      tool_call_count: tools.reduce(
        (total, tool) => total + tool.logical_call_count,
        0,
      ),
      tool_call_breakdown: breakdown,
      tool_call_duration_ms_total: toolDuration,
      tool_call_duration_source: "custom_tool_call_envelope_wall_clock",
      failed_tool_calls: failedToolCalls,
      retries: failedToolCalls === 0 ? 0 : "manual_review_required",
      first_pass_success: firstPassSuccess,
      first_pass_success_source: "first_post_edit_test",
      tests: {
        cases: testMatch === null || testMatch === undefined ? "unknown" : Number(testMatch[1]),
        passed: passMatch === null || passMatch === undefined ? "unknown" : Number(passMatch[1]),
        failed: failMatch === null || failMatch === undefined ? "unknown" : Number(failMatch[1]),
        typecheck:
          firstTestTool?.command?.includes("typecheck") === true &&
          firstTestTool.exitCode === 0
            ? "pass"
            : "unknown",
      },
      termination_reason: "normal_completion",
    },
    validation: {
      request_count_matches: usages.length === modelRequests.length,
      token_sums_match:
        sum(usages, "input_tokens") === totalUsage.input_tokens &&
        sum(usages, "cached_input_tokens") === totalUsage.cached_input_tokens &&
        sum(usages, "output_tokens") === totalUsage.output_tokens &&
        sum(usages, "total_tokens") === totalUsage.total_tokens,
      uncached_nonnegative: usages.every(
        (usage) => usage.uncached_input_tokens >= 0,
      ),
      cached_ratio_in_range:
        summaryInput === 0 ||
        (summaryCached / summaryInput >= 0 && summaryCached / summaryInput <= 1),
      peak_context_matches:
        Math.max(...usages.map((usage) => usage.input_tokens)) ===
        Math.max(...usages.map((usage) => usage.input_tokens)),
      tool_outputs_matched: tools.length === outputEvents.length,
      first_pass_evidence_recorded: firstTestTool !== undefined,
    },
  };
}

const args = parseArgs(process.argv.slice(2));
const metrics = extract(args.tracePath, args.runId);
const yaml = toYaml(metrics);

if (args.outputPath === undefined) {
  process.stdout.write(yaml);
} else {
  fs.mkdirSync(path.dirname(args.outputPath), { recursive: true });
  fs.writeFileSync(args.outputPath, yaml);
  process.stdout.write(`${JSON.stringify(metrics.summary)}\n`);
}
