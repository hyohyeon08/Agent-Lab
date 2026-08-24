# 실행 정량 지표 정의

이 문서는 Agent Lab의 각 실행에 기록하는 정량 지표와 계산 규칙을 정의한다.
지표는 세션 Trace에서 직접 관찰되는 값, 관찰 가능한 프록시, 독립 평가 결과를
구분한다. 제공자 내부 상태나 실제 청구 내역처럼 Trace에 없는 값은 추정 사실로
표현하지 않는다.

새 실행의 frontmatter 스키마 버전은 `metrics_schema_version: 2`다.
STUDY-0001은 당시 사용한 v1 기록을 그대로 유지한다. 계산 규칙을 호환되지
않게 바꿀 때만 버전을 올린다.

## 시간

### `time_to_first_action_ms`

세션의 `task_started` 이벤트 시각부터 첫 `custom_tool_call` 이벤트 시각까지의
밀리초다. 첫 호출이 계획 도구이면 그것도 action으로 계산한다.

`time_to_first_token_ms`와 다르다. 전자는 첫 도구 행동까지의 시간이고 후자는
첫 모델 토큰까지의 시간이다.

### `time_to_first_edit_ms`

세션의 `task_started` 이벤트 시각부터 첫 `FileChange.started_at_ms`까지의
밀리초다. 첫 수정 대상이 구현, 테스트, 설정 중 무엇인지 상세 Trace에 함께
기록한다.

`FileChange`가 없는 셸 기반 편집은 명확한 파일 변경 명령을 수동 분류하고
`time_to_first_edit_source: classified_tool_call_timestamp`를 사용한다. 시각을
확인할 수 없으면 추정하지 않고 `unavailable`로 기록한다.

## 모델 요청

### `model_request_count`

Codex 세션은 제공자에게 보낸 내부 요청 로그를 직접 노출하지 않는다. 따라서
각 모델 응답 뒤 누적 사용량을 기록하는 `token_count` 이벤트 수를 관찰 가능한
프록시로 사용한다.

항상 다음 출처 필드를 함께 기록한다.

```yaml
model_request_count_source: token_count_event_proxy
```

이 값은 제공자 내부 재시도, 라우팅 또는 숨겨진 요청 수를 증명하지 않는다.

### `model_requests`

실행별 `trace-metrics.yaml`에 각 `token_count.last_token_usage`를 하나의 관찰
가능한 모델 응답 프록시로 기록한다. 각 항목에는 이전 논리 행동, 모델 응답이
선택한 다음 행동과 다음 토큰 사용량을 포함한다.

- `input_tokens`
- `cached_input_tokens`
- `cache_write_input_tokens`
- `uncached_input_tokens`
- `output_tokens`
- `reasoning_output_tokens`
- `total_tokens`

첫 항목의 이전 행동은 `task_start`, 마지막 항목의 다음 행동은
`final_answer`로 기록한다. 하나의 상위 Tool 봉투에 여러 논리 호출이 있으면
순서를 유지한 배열을 사용한다.

`model_requests` 길이는 `model_request_count`와 같아야 한다. 호출별 token 합은
마지막 `token_count.total_token_usage`와 일치해야 한다.

### `uncached_input_tokens`

각 모델 응답과 실행 전체에 대해 다음 식으로 계산한다.

```text
uncached_input_tokens =
  input_tokens - cached_input_tokens - cache_write_input_tokens
```

값이 음수이면 Trace 구조 또는 계산 오류이므로 실행 기록을 고정하지 않는다.

### `average_input_tokens_per_model_request`

실행의 `input_tokens / model_request_count`다. 소수점 둘째 자리까지 표시하되
검증에는 반올림 전 값을 사용한다. 모델 요청 프록시가 0이면 `unavailable`로
기록한다.

### `cached_input_ratio`

실행의 `cached_input_tokens / input_tokens`다. YAML에는 0~1 범위의 소수로
기록하고 보고서에서는 백분율로 표시할 수 있다. input이 0이면 `unavailable`로
기록한다.

### `peak_context_tokens`

호출별 `last_token_usage.input_tokens` 중 최댓값이다. 최대 입력 Context 크기를
나타내지만, 큰 값만으로 불필요한 Context bloat라고 판정하지 않는다. Tool
반환량, 작업 진행과 최종 결과를 함께 해석한다.

## 모델과 Tool 시간

### `model_inference_duration_ms_total`

제공자 서버의 순수 추론 시간 telemetry가 있을 때만 기록한다. 현재 Codex 세션
Trace에는 이 값이 없으므로 다음처럼 기록한다.

```yaml
model_inference_duration_ms_total: unavailable
model_inference_duration_reason: provider_inference_timing_not_exposed
```

### `model_response_phase_duration_ms_total`

순수 추론 시간을 대신하지 않는 Trace wall-clock 프록시다. 첫 모델 응답은
`task_started`부터 다음 Tool 호출까지, 이후 응답은 직전 Tool output부터 다음
Tool 호출까지 계산한다. 마지막 응답은 직전 Tool output부터 최종 Agent 메시지
완료까지 계산한다.

이 값에는 요청 지연, 응답 생성, 스트리밍과 일부 오케스트레이션 시간이 포함될
수 있다. 항상 다음 출처를 함께 기록한다.

```yaml
model_response_phase_duration_source: trace_phase_wall_clock_proxy
```

### `tool_call_duration_ms_total`

각 상위 `custom_tool_call` 시각부터 같은 `call_id`의
`custom_tool_call_output` 시각까지의 wall-clock 구간을 계산한다. 한 봉투 안에서
논리 Tool이 병렬 실행될 수 있으므로 개별 호출 시간을 더하지 않는다. 상위
구간이 겹치면 합집합 시간을 사용한다.

Tool 프레임워크와 로컬 오케스트레이션 오버헤드가 포함될 수 있으므로 파일
읽기나 테스트 프로세스의 순수 실행 시간으로 해석하지 않는다.

## 도구 호출

### `tool_call_trace_envelope_count`

세션 JSONL의 상위 `custom_tool_call` 이벤트 수다. Codex는 하나의 상위
`exec` 호출 안에서 여러 논리 도구를 함께 호출할 수 있다.

### `tool_call_count`

상위 호출 입력에 나타난 `tools.*` 논리 호출 수다. 비교 보고서의 기본 도구
호출 수로 사용한다.

### `tool_call_breakdown`

각 논리 호출을 하나의 주된 목적으로 분류한다.

- `plan`: 계획 상태 갱신
- `search`: 파일 목록 또는 키워드 검색이 주목적인 명령
- `read`: 파일 내용 읽기가 주목적인 명령
- `edit`: patch 등 파일 수정
- `test`: 테스트 또는 타입 검사가 주목적인 명령
- `shell`: Git 상태·diff 등 나머지 셸 명령
- `wait`: 실행 중인 명령이나 세션 대기
- `other`: 위 범주에 속하지 않는 호출

하나의 셸 호출이 여러 명령을 연결해도 논리 호출은 1회이며 주된 목적 하나로
분류한다. breakdown의 합은 `tool_call_count`와 같아야 한다.

## Skill

- `skills.visible_count`: 세션 `world_state.host_skills`에 표시된 Skill 수
- `skills.invoked_count`: Trace에서 실제 instruction load 또는 Skill 호출이
  확인된 수

보이는 것과 사용한 것을 분리한다. 이름이 프롬프트에 있다는 사실만으로 호출로
계산하지 않는다.

## 결과

- `task_success`: 독립 평가의 `final_result`가 `pass`인지 여부
- `tests.cases`: 관찰 대상 Agent가 실행한 공개 테스트 사례 수
- `tests.passed`, `tests.failed`: 해당 실행 결과
- `tests.external_cases`: 관찰 대상 종료 뒤 독립 평가기가 실행한 외부 사례 수
- `files_changed`, `lines_added`, `lines_deleted`: 고정된 시작 커밋 대비 diff
- `failed_tool_calls`: 관찰 대상 Trace에서 실패가 확인된 논리 도구 호출 수
- `retries`: 실패한 작업을 관찰 대상 Agent가 다시 시도한 횟수
- `termination_reason`: `normal_completion`, `timeout`, `error`,
  `human_stop`, `unknown` 중 하나

### `first_pass_success`

첫 코드 편집이 시작된 뒤 처음 실행한 공개 테스트 명령의 결과다.

- 첫 테스트 통과: `true`
- 첫 테스트 실패: `false`
- 편집 뒤 테스트가 없거나 결과 판별 불가: `unavailable`

첫 테스트 전에 이어진 여러 편집 호출은 하나의 첫 편집 단계로 취급한다. 이
값은 시행착오를 관찰하기 위한 과정 지표이며 `task_success`나 독립 외부 평가를
대신하지 않는다.

평가 Agent의 인프라 실패와 재시도는 관찰 대상의
`failed_tool_calls`·`retries`에 포함하지 않고 `evaluation.yaml`에 별도로
기록한다.

## 비용

실제 Codex 제품 청구액이나 구독 크레딧 차감액은 세션 Trace에 없으므로
`actual_usd: unavailable`로 기록한다. 비교용 추정치는 실행 당시
`gpt-5.6-luna` API 정가를 사용한다.

2026-08-21 기준 단가:

- uncached input: $0.20 / 1M tokens
- cached input: $0.02 / 1M tokens
- output: $1.20 / 1M tokens
- cache write: uncached input 단가의 1.25배

계산식:

```text
uncached_input = input_tokens - cached_input_tokens - cache_write_input_tokens

estimated_api_list_price_usd =
  uncached_input × 0.20 / 1,000,000
  + cached_input_tokens × 0.02 / 1,000,000
  + cache_write_input_tokens × 0.25 / 1,000,000
  + output_tokens × 1.20 / 1,000,000
```

`reasoning_output_tokens`는 `output_tokens`와 별도로 다시 더하지 않는다.
이 추정치는 API 정가 비교용이며 실제 Codex 청구액, 구독 요금, 플랫폼 할인,
오케스트레이션 비용을 나타내지 않는다.

가격 출처:
<https://developers.openai.com/api/docs/models/gpt-5.6-luna>

## 상세 Trace 지표 파일

v2 실행은 각 run 디렉터리에 `trace-metrics.yaml`을 둔다. `run.md`에는 요약값을,
이 파일에는 호출별 `model_requests`, 시간 경계와 계산 검증 결과를 기록한다.

Codex 세션 JSONL의 일반적인 `모델 응답 → Tool → Tool output` 구조는 다음 명령으로
추출한다.

```bash
npm run extract:trace-metrics -- \
  --trace /absolute/path/to/rollout.jsonl \
  --run-id RUN-XXXX \
  --output experiments/STUDY-ID/runs/RUN-XXXX/trace-metrics.yaml
```

추출기는 RUN-0001의 수동 계산 15개 핵심 필드와 일치함을 확인했다. 모델 응답
프록시 수가 Tool 봉투 수보다 정확히 1개 많지 않은 등 예상하지 않은 Trace 구조는
임의로 맞추지 않고 오류로 중단한다. 이 경우 원본을 수동 검토해 가용한 값과
`unavailable`을 구분한다.

실행을 고정하기 전에 다음을 확인한다.

1. `model_requests` 길이와 모델 요청 프록시 수가 같다.
2. 호출별 token 합과 최종 누적 token이 같다.
3. cache 비율이 0~1이고 uncached input이 음수가 아니다.
4. peak Context가 호출별 input 최댓값과 같다.
5. 모든 Tool call에 같은 `call_id`의 output이 있다.
6. 첫 편집과 첫 post-edit 테스트 근거가 기록돼 있다.
7. 확인할 수 없는 값은 추정하지 않고 `unavailable`로 남긴다.
