# TASK-002 관찰 설계

## 상태

- 문서 상태: 구현 및 5회 반복 연구 완료
- 대상 연구: `STUDY-0002`
- 대상 과제: `TASK-002`
- 목표 실행 수: 동일 조건 5회
- 선행 연구: `STUDY-0001`

이 문서는 TASK-002의 연구 질문, 통제 조건, fixture, 추가 지표와 기록 형식을
고정한 설계 기준이다. fixture와 지표 스키마 v2, 외부 평가기 및 5회 독립 실행은
이 기준에 따라 완료됐다. 결과와 해석은
[STUDY-0002 비교 보고서](../../experiments/STUDY-0002/comparison.md)에 있다.

## 출발점

STUDY-0001에서는 같은 기능 결과와 구현 지점에 도달하더라도 파일 탐색, Tool
호출 구성과 공개 테스트 범위가 실행마다 달라질 수 있음을 관찰했다. 또한
RUN-0002와 RUN-0004는 논리 Tool Call이 각각 9회로 같았지만 다음과 같은 차이가
있었다.

| 실행 | 논리 Tool Call | 상위 Tool 봉투 | 모델 요청 프록시 | 총 tokens |
|---|---:|---:|---:|---:|
| RUN-0002 | 9 | 5 | 6 | 101,366 |
| RUN-0004 | 9 | 8 | 9 | 157,015 |

이 차이는 Model과 Tool 사이의 왕복 구조가 Context 및 토큰 사용량과 관련될 수
있다는 후속 가설을 만들었다. 현재 자료만으로 인과관계를 결론 내리지 않는다.

## 연구 질문

1. 같은 Agent 조건에서 다른 유형의 작은 버그를 해결할 때도 결과의 일관성과
   과정의 변동이 함께 나타나는가?
2. 여러 실행과 fixture에서 Model 요청 프록시 및 상위 Tool Call 봉투 수가
   증가할수록 토큰 사용량도 반복해서 증가하는가?

첫 번째 질문이 STUDY-0002의 주된 질문이다. 두 번째 질문은 실행 과정에서 함께
관찰하는 탐색 가설이다. Tool 내용과 반환량을 통제하지 않으므로 상관관계가
나타나더라도 왕복 횟수의 인과 효과로 단정하지 않는다.

## 고정 조건

STUDY-0001과 비교할 수 있도록 다음 조건을 유지한다.

- Agent: `gpt-5.6-luna`
- reasoning effort: `high`
- 플러그인 및 recommended plugins: 비활성화
- Superpowers: 비활성화
- 추가 task 전용 Skill 또는 지시: 주입하지 않음
- 기본 host Skill: 실행 전 `world_state`의 노출 목록을 고정 기록하고 실제 호출을
  별도 기록. STUDY-0001과 목록이 다르면 조건 차이로 표시
- 언어와 실행 환경: 작은 TypeScript 프로젝트, Node 내장 test runner
- 입력 방식: 사용자 버그 제보만 전달
- Agent 요구사항: 원인 조사, 수정, 재발 방지 테스트, 기존 동작 유지
- 사람 개입: 초기 프롬프트 이후 0회를 원칙으로 함
- 실행 독립성: 동일 baseline에서 만든 별도 Git 저장소와 별도 Codex 작업
- 반복 횟수: 독립 실행 5회

STUDY-0001에서 바꾸는 주된 변수는 버그 유형이다. 모델, 추론 강도, 플러그인
조건과 프롬프트 구조는 바꾸지 않는다.

## fixture

### 이름

`inventory-reservation`

### 버그 유형

중복 취소 요청을 처리하는 상태 전이 버그다.

재고 예약을 한 번 취소하면 예약 수량이 가용 재고로 돌아간다. 네트워크 재시도
등으로 같은 예약의 취소 요청이 두 번 들어오면 두 번째 요청도 수량을 다시
반환해 가용 재고가 실제보다 증가하는 결함을 넣는다.

기대 동작은 다음과 같다.

- 활성 예약의 첫 취소는 재고를 한 번 반환하고 상태를 `cancelled`로 바꾼다.
- 이미 취소된 예약의 재취소는 멱등적으로 처리하며 재고를 다시 변경하지 않는다.
- 완료된 예약은 취소할 수 없다.
- 예약 생성, 수량 부족 거부와 정상 완료 동작은 유지한다.

### 구조

```text
benchmarks/fixtures/inventory-reservation/
├── src/inventory.ts
├── src/reservation.ts
├── src/reservation-repository.ts
├── src/reservation-service.ts
├── test/reservation-service.test.ts
├── package.json
└── tsconfig.json
```

### 의도적인 결함

`ReservationService.cancel()`이 `fulfilled` 상태만 거부하고, 이미 `cancelled`인
예약에도 `Inventory.release()`를 다시 호출하도록 만든다. 정상 구현은 취소된
예약을 감지해 재고를 바꾸지 않고 현재 예약을 반환해야 한다.

특정 코드 형태를 Agent 프롬프트에 노출하지 않는다.

### 공개 테스트의 초기 범위

- 예약 생성 시 가용 재고 감소
- 수량 부족 예약 거부
- 활성 예약 취소 시 재고 복구
- 활성 예약 완료
- 완료된 예약 취소 거부
- 존재하지 않는 예약 처리

중복 취소 사례는 baseline 공개 테스트에 넣지 않는다. Agent가 사용자 제보를
바탕으로 회귀 테스트를 직접 추가하게 한다.

### 독립 평가 범위

최소 다음 사례를 외부 evaluator로 확인한다.

1. 활성 예약의 첫 취소가 수량을 한 번 반환한다.
2. 두 번째 취소가 수량을 추가로 반환하지 않는다.
3. 두 번째 취소 뒤에도 상태는 `cancelled`다.
4. 완료된 예약은 취소할 수 없다.
5. 실패한 완료 예약 취소가 재고를 변경하지 않는다.
6. 한 예약의 취소가 다른 예약 수량에 영향을 주지 않는다.
7. 수량 부족 예약은 거부된다.
8. 정상 완료는 예약 수량을 재고로 반환하지 않는다.
9. 존재하지 않는 예약 ID는 정해진 오류를 반환한다.

평가기와 oracle은 관찰 대상 작업 공간에 노출하지 않는다.

## 지표 스키마 v2

TASK-002부터 `metrics_schema_version: 2`를 사용한다. STUDY-0001 기록은 즉시
수정하지 않는다. TASK-002 첫 dry run에서 추출 규칙을 검증한 뒤 필요한 경우
STUDY-0001을 별도 작업으로 소급 계산한다.

### 지표 가용성

| 지표 | 상태 | 출처 또는 계산 |
|---|---|---|
| `model_requests` | Trace 기반 프록시 | 각 `token_count.last_token_usage`와 인접 Tool 이벤트 연결 |
| `uncached_input_tokens` | 계산 가능 | input - cached input - cache write input |
| `average_input_tokens_per_model_request` | 계산 가능 | input 합계 / 모델 요청 프록시 수 |
| `cached_input_ratio` | 계산 가능 | cached input / input 합계 |
| `time_to_first_edit_ms` | 관찰 가능 | `task_started` → 첫 `FileChange.started_at_ms` |
| `peak_context_tokens` | 계산 가능 | 호출별 input tokens 최댓값 |
| `model_inference_duration_ms_total` | 직접 측정 불가 | 서버 내부 추론 시간 이벤트가 없음 |
| `tool_call_duration_ms_total` | Trace wall-clock | 상위 Tool 봉투 시작→출력 구간의 합집합 |
| `first_pass_success` | 행동 기록에서 계산 | 첫 편집 단계 뒤 첫 테스트 결과 |

Trace가 제공하지 않는 값을 다른 값처럼 가장하지 않는다. 숫자를 만들 수 없는
경우 `unavailable`과 이유를 함께 기록한다.

## 실행별 기록 구조

요약은 기존처럼 `run.md` frontmatter와 정량 지표 표에 기록한다. 호출별 상세
정보는 새 파일 `trace-metrics.yaml`에 기록한다.

```text
experiments/STUDY-0002/runs/RUN-XXXX/
├── prompt.md
├── run.md
├── trace-metrics.yaml
├── diff.patch
├── evaluation.yaml
└── final-response.md
```

`run.md`에는 다음 요약값을 추가한다.

```yaml
execution:
  metrics_schema_version: 2
  model_request_count: unknown
  model_request_count_source: token_count_event_proxy
  uncached_input_tokens: unknown
  average_input_tokens_per_model_request: unknown
  cached_input_ratio: unknown
  time_to_first_edit_ms: unknown
  time_to_first_edit_source: file_change_started_at
  peak_context_tokens: unknown
  peak_context_tokens_source: token_count.last_token_usage.input_tokens
  model_inference_duration_ms_total: unavailable
  model_inference_duration_reason: provider_inference_timing_not_exposed
  model_response_phase_duration_ms_total: unknown
  model_response_phase_duration_source: trace_phase_wall_clock_proxy
  tool_call_duration_ms_total: unknown
  tool_call_duration_source: custom_tool_call_envelope_wall_clock
  first_pass_success: unknown
  first_pass_success_source: first_post_edit_test
  detailed_metrics: trace-metrics.yaml
```

## `model_requests` 상세 구조

`trace-metrics.yaml`에는 다음 형식으로 모델 응답 단계를 순서대로 기록한다.

```yaml
schema_version: 2
run_id: RUN-XXXX
source:
  task_id: codex-task-id
  event: token_count.last_token_usage
  interpretation: observable_model_response_proxy
model_requests:
  - sequence: 1
    preceded_by:
      - task_start
    followed_by:
      - plan
      - search
    token_usage:
      input_tokens: 0
      cached_input_tokens: 0
      cache_write_input_tokens: 0
      uncached_input_tokens: 0
      output_tokens: 0
      reasoning_output_tokens: 0
      total_tokens: 0
    response_phase_duration_ms: 0
summary:
  model_request_count: 0
  input_tokens: 0
  cached_input_tokens: 0
  cache_write_input_tokens: 0
  uncached_input_tokens: 0
  average_input_tokens_per_model_request: 0
  cached_input_ratio: 0
  peak_context_tokens: 0
```

`preceded_by`는 해당 모델 응답 전에 완료된 논리 행동 목록이다. 첫 요청은
`task_start`를 사용한다. `followed_by`는 모델 응답이 선택한 다음 논리 Tool 행동
목록이며 마지막 응답은 `final_answer`를 사용한다. 한 상위 봉투 안에 여러 Tool
호출이 있으면 실행 순서를 유지한 배열로 기록한다.

`model_requests`는 제공자 내부 요청 로그가 아니라 관찰 가능한 모델 응답
프록시다. 내부 재시도, 라우팅 또는 숨겨진 요청을 나타내지 않는다.

같은 상세 파일에 첫 행동·편집·최종 응답 경계, 상위 `tool_envelopes`의 `call_id`와
시작·종료 시각, 첫 편집 뒤 첫 테스트 근거를 함께 기록한다. 이 값들은 요약 시간과
`first_pass_success`를 원본 Trace에 다시 연결하기 위한 감사 근거다.

## 계산 규칙

### 토큰

```text
request.uncached_input_tokens =
  request.input_tokens
  - request.cached_input_tokens
  - request.cache_write_input_tokens

summary.uncached_input_tokens =
  Σ request.uncached_input_tokens

summary.average_input_tokens_per_model_request =
  summary.input_tokens / summary.model_request_count

summary.cached_input_ratio =
  summary.cached_input_tokens / summary.input_tokens

summary.peak_context_tokens =
  max(request.input_tokens)
```

`cached_input_ratio`는 0~1의 소수로 저장하고 보고서에서 백분율로 표시한다.
분모가 0이면 `unavailable`로 기록한다. 평균값은 YAML에 소수점 둘째 자리까지
기록하고 계산 검증은 반올림 전 값으로 수행한다.

`peak_context_tokens`는 최대 입력 Context 크기다. 값이 크다는 사실만으로
불필요한 Context bloat라고 판정하지 않는다. Tool 반환량, 작업 진행에 따른
정상적인 Context 증가와 실제 결과를 함께 해석한다.

### 첫 편집 시간

기본 계산은 다음과 같다.

```text
first FileChange.started_at_ms - task_started.timestamp_ms
```

`FileChange`가 없는 셸 기반 편집이면 명확한 파일 변경 명령을 수동 분류하고
`time_to_first_edit_source: classified_tool_call_timestamp`를 사용한다. 편집 시각을
확인할 수 없으면 추정하지 않고 `unavailable`로 기록한다.

### 모델 응답 단계 시간

Codex Trace에는 제공자 서버의 순수 추론 시간이 없다. 따라서 다음 값을 분리한다.

- `model_inference_duration_ms_total`: 항상 실제 telemetry가 있을 때만 기록
- `model_response_phase_duration_ms_total`: Trace 경계로 계산한 wall-clock 프록시

프록시는 첫 요청의 경우 `task_started`부터 다음 Tool 호출까지, 이후 요청은
직전 Tool output부터 다음 Tool 호출까지 계산한다. 마지막 요청은 직전 Tool
output부터 최종 Agent 메시지 완료까지 계산한다. 요청 지연, 응답 생성,
스트리밍과 일부 오케스트레이션 시간이 포함되므로 순수 추론 시간으로 부르지
않는다.

### Tool 시간

각 상위 `custom_tool_call` 시각부터 같은 `call_id`의
`custom_tool_call_output` 시각까지를 Tool 구간으로 본다. 여러 논리 Tool이 한
봉투에서 병렬 실행될 수 있으므로 개별 논리 호출 시간을 더하지 않는다. 상위
구간이 겹치면 합이 아니라 합집합 wall-clock 시간을 사용한다.

이 값에는 Tool 프레임워크와 로컬 오케스트레이션 오버헤드가 포함될 수 있다.
파일 읽기나 테스트 프로세스의 순수 실행 시간으로 해석하지 않는다.

### 첫 시도 성공

첫 코드 편집이 시작된 뒤 처음 실행한 공개 테스트 명령의 결과를 사용한다.

- 첫 테스트가 통과하면 `true`
- 첫 테스트가 실패하면 `false`
- 편집 뒤 테스트를 실행하지 않았거나 결과를 판별할 수 없으면 `unavailable`

여러 편집 호출이 첫 테스트 전에 이어지면 하나의 첫 편집 단계로 취급한다.
`first_pass_success`는 최종 기능 성공과 별개인 시행착오 관찰값이다. 독립 외부
평가를 대신하지 않는다.

## 추출 검증 규칙

각 실행을 고정하기 전에 다음 불변식을 확인한다.

1. `model_requests` 길이와 `model_request_count`가 같다.
2. 호출별 token 합이 마지막 `token_count.total_token_usage`와 같다.
3. 모든 `uncached_input_tokens`가 0 이상이다.
4. `cached_input_ratio`가 0~1 범위다.
5. `peak_context_tokens`가 호출별 input 최댓값과 같다.
6. Tool 봉투마다 같은 `call_id`의 output이 하나 존재한다.
7. `tool_call_breakdown` 합이 논리 Tool Call 수와 같다.
8. `first_pass_success`의 근거가 되는 편집과 테스트 순서를 기록한다.
9. Trace 구조가 규칙과 다르면 값을 추정하지 않고 `unavailable`로 남긴다.

TASK-002 첫 dry run에서는 자동 계산 결과를 사람이 원본 JSONL과 대조한다.
일치가 확인된 뒤 나머지 실행에 같은 추출 규칙을 적용한다.

## RUN-0001을 이용한 계산 검증 예

기존 STUDY-0001 Trace로 새 계산 규칙의 적용 가능성만 확인했다. 기존 실행 기록은
수정하지 않았다.

| 지표 | RUN-0001 검증값 |
|---|---:|
| 모델 요청 프록시 | 7 |
| uncached input tokens | 11,438 |
| 평균 input/request | 16,884.29 |
| cached input ratio | 0.9032 |
| 첫 편집 | 30,382ms |
| peak context | 18,724 tokens |
| 순수 모델 추론 시간 | unavailable |
| 모델 응답 단계 프록시 | 52,543ms |
| Tool 봉투 wall-clock | 849ms |
| 첫 시도 성공 | true |

호출별 input, cached input, cache write input, output token의 합은 최종 누적값과
일치했다. 이 검증은 지표 계산 가능성을 확인한 것이며 STUDY-0001의 결론을
변경하지 않는다.

## 실행 순서

1. 이 설계와 fixture 유형을 확정한다.
2. 지표 스키마 v2 정의와 `trace-metrics.yaml` 템플릿을 구현한다.
3. `inventory-reservation`의 정상 기준 구현과 외부 evaluator를 만든다.
4. oracle patch를 고정한 뒤 의도적인 중복 취소 결함을 baseline에 넣는다.
5. baseline 공개 테스트 통과와 외부 evaluator의 결함 탐지를 확인한다.
6. 고정 사용자 제보 프롬프트와 TASK-002 runbook을 작성한다.
7. baseline source commit과 독립 실행 작업 공간 생성 절차를 고정한다.
8. RUN-0001 dry run을 별도 Codex 작업으로 실행한다.
9. Trace 추출값을 원본 JSONL과 수동 대조한다.
10. 조건이 유효하면 같은 baseline에서 RUN-0002~RUN-0005를 독립 실행한다.
11. 각 결과를 독립 평가하고 STUDY-0002 비교 보고서와 개인 연구 기록을 작성한다.

## 완료 기준

설계 단계는 다음이 충족되면 완료된다.

- fixture의 사용자 관찰 동작과 외부 평가 사례가 명확하다.
- 9개 요청 지표의 계산 가능 여부와 출처가 정의돼 있다.
- 순수 모델 추론 시간과 wall-clock 프록시가 구분돼 있다.
- 호출별 상세 기록과 실행 요약의 저장 위치가 정해져 있다.
- 첫 dry run에서 확인할 불변식이 문서화돼 있다.
- 기존 STUDY-0001 기록을 변경하지 않는다.
