export interface TimeInterval {
  startMs: number;
  endMs: number;
}

export function intervalUnionDurationMs(
  intervals: readonly TimeInterval[],
): number {
  if (intervals.length === 0) {
    return 0;
  }

  const sorted = intervals
    .map(({ startMs, endMs }) => {
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
        throw new Error("Interval boundaries must be finite numbers");
      }
      if (endMs < startMs) {
        throw new Error("Interval end must not precede its start");
      }
      return { startMs, endMs };
    })
    .sort((left, right) => left.startMs - right.startMs || left.endMs - right.endMs);

  let total = 0;
  let currentStart = sorted[0]!.startMs;
  let currentEnd = sorted[0]!.endMs;

  for (const interval of sorted.slice(1)) {
    if (interval.startMs <= currentEnd) {
      currentEnd = Math.max(currentEnd, interval.endMs);
      continue;
    }

    total += currentEnd - currentStart;
    currentStart = interval.startMs;
    currentEnd = interval.endMs;
  }

  return total + currentEnd - currentStart;
}

export function peakInputTokens(
  usages: readonly { input_tokens: number }[],
): number {
  if (usages.length === 0) {
    throw new Error("At least one token usage event is required");
  }

  return usages.reduce(
    (peak, usage) => Math.max(peak, usage.input_tokens),
    usages[0]!.input_tokens,
  );
}
