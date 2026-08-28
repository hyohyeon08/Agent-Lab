import assert from "node:assert/strict";
import test from "node:test";

import {
  intervalUnionDurationMs,
  peakInputTokens,
} from "./trace-metric-calculations.js";

test("Tool 구간이 겹치면 중복 시간을 한 번만 계산한다", () => {
  assert.equal(
    intervalUnionDurationMs([
      { startMs: 100, endMs: 180 },
      { startMs: 150, endMs: 240 },
      { startMs: 300, endMs: 330 },
    ]),
    170,
  );
});

test("포함·접촉·순서 역전 구간도 합집합으로 계산하고 입력은 변경하지 않는다", () => {
  const intervals = [
    { startMs: 250, endMs: 280 },
    { startMs: 100, endMs: 200 },
    { startMs: 120, endMs: 140 },
    { startMs: 200, endMs: 250 },
  ];
  const original = structuredClone(intervals);

  assert.equal(intervalUnionDurationMs(intervals), 180);
  assert.deepEqual(intervals, original);
});

test("빈 Tool 구간의 합집합 시간은 0이다", () => {
  assert.equal(intervalUnionDurationMs([]), 0);
});

test("잘못된 Tool 구간은 거부한다", () => {
  assert.throws(
    () => intervalUnionDurationMs([{ startMs: 20, endMs: 10 }]),
    /must not precede/,
  );
});

test("호출별 Input Token 중 최댓값을 peak context로 선택한다", () => {
  assert.equal(
    peakInputTokens([
      { input_tokens: 12_000 },
      { input_tokens: 17_536 },
      { input_tokens: 16_400 },
    ]),
    17_536,
  );
});

test("Token 사용 이벤트가 없으면 peak context를 만들지 않는다", () => {
  assert.throws(() => peakInputTokens([]), /At least one token usage/);
});
