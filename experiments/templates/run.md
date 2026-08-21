---
study_id: STUDY-ID
run_id: RUN-ID
date: run-date
agent:
  label: agent-label
  model: unknown
  reasoning_effort: unknown
  harness: unknown
  plugins: unknown
  skills: unknown
fixture:
  name: fixture-name
  source_commit: required-before-run
  workspace_start_commit: required-before-run
task:
  id: TASK-ID
source_task:
  id: required-after-task-creation
  url: required-after-task-creation
execution:
  metrics_schema_version: 1
  duration_ms: unknown
  time_to_first_token_ms: unknown
  time_to_first_action_ms: unknown
  time_to_first_action_source: trace_timestamp
  model_request_count: unknown
  model_request_count_source: token_count_event_proxy
  tool_call_trace_envelope_count: unknown
  tool_call_count: unknown
  tool_call_breakdown:
    plan: 0
    search: 0
    read: 0
    edit: 0
    test: 0
    shell: 0
    wait: 0
    other: 0
  skills:
    visible_count: unknown
    invoked_count: unknown
  task_success: unknown
  task_success_source: independent_evaluation
  tests:
    cases: unknown
    passed: unknown
    failed: unknown
    status: not_run
    typecheck: not_run
    external_cases: unknown
    external_passed: unknown
    external_status: not_run
  change:
    files_changed: unknown
    lines_added: unknown
    lines_deleted: unknown
  failed_tool_calls: unknown
  retries: unknown
  cost:
    actual_usd: unavailable
    estimated_api_list_price_usd: unknown
    estimate_method: model_api_list_price
    pricing_as_of: run-date
  termination_reason: unknown
  token_usage:
    input_tokens: unknown
    cached_input_tokens: unknown
    cache_write_input_tokens: unknown
    output_tokens: unknown
    reasoning_output_tokens: unknown
    total_tokens: unknown
human_interventions: 0
contaminated: false
---

# 실행 전 기록

## 연구 질문

## 예상하는 행동 순서

가능한 행동 경로를 중립적으로 적는다. 특정 개발 방법론이나 테스트·구현
순서를 성공 기준처럼 규정하지 않는다.

## 특히 관찰할 행동

## 이 실행으로 결론 내릴 수 없는 것

# 사실 기반 행동 기록

행동 유형은 `inspect`, `test`, `edit`, `command`, `communicate` 중 하나로 기록한다.

| 순서 | 행동 유형 | 대상 | 관찰된 결과 |
|---:|---|---|---|

# 사람 개입 기록

| 순서 | 시점 또는 행동 순서 | 이유 | 전달 내용 | 오염 여부 |
|---:|---|---|---|---|

# 실행 결과

## 정량 지표

계산 규칙과 한계는 [실행 정량 지표 정의](../../../../docs/metrics.md)를 따른다.

| 지표 | 값 | 측정 근거 |
|---|---:|---|
| 첫 tool call | unknown | Trace timestamp |
| 모델 요청 | unknown | `token_count` 이벤트 기반 프록시 |
| 도구 호출 | unknown | 논리 호출 / 상위 봉투 |
| 도구 분류 | unknown | 논리 호출의 주된 목적 |
| Skill | unknown | visible / invoked |
| 작업 성공 | unknown | 독립 평가 |
| 테스트 | unknown | Agent / 외부 평가 / 타입 검사 |
| 변경 범위 | unknown | 시작 커밋 대비 diff |
| 실패·재시도 | unknown | 관찰 대상 Trace |
| 비용 | actual unavailable / estimate unknown | 실행일 모델 API 정가 |
| 종료 이유 | unknown | 세션 종료 이벤트 |

## Agent가 보고한 검증

## 평가 Agent가 독립적으로 재실행한 검증

# 해석

## 유용해 보였던 행동

## 불필요하거나 위험해 보였던 행동

관찰 가능한 근거가 있는 경우만 적는다. 관찰자의 플러그인, skill 또는 개발
방법론 선호와 다르다는 이유만으로 위험이나 약점으로 판정하지 않는다.

## 실패 후 복구 방식

## 예상과 달랐던 점

## 한계

## 다음 질문
