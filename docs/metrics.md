# 실행 정량 지표 정의

이 문서는 Agent Lab의 각 실행에 기록하는 정량 지표와 계산 규칙을 정의한다.
지표는 세션 Trace에서 직접 관찰되는 값, 관찰 가능한 프록시, 독립 평가 결과를
구분한다. 제공자 내부 상태나 실제 청구 내역처럼 Trace에 없는 값은 추정 사실로
표현하지 않는다.

현재 frontmatter 스키마 버전은 `metrics_schema_version: 1`이다. 계산 규칙을
호환되지 않게 바꿀 때만 버전을 올린다.

## 시간

### `time_to_first_action_ms`

세션의 `task_started` 이벤트 시각부터 첫 `custom_tool_call` 이벤트 시각까지의
밀리초다. 첫 호출이 계획 도구이면 그것도 action으로 계산한다.

`time_to_first_token_ms`와 다르다. 전자는 첫 도구 행동까지의 시간이고 후자는
첫 모델 토큰까지의 시간이다.

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
