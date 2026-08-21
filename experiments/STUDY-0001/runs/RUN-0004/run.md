---
study_id: STUDY-0001
run_id: RUN-0004
date: 2026-08-21
agent:
  label: codex-gpt-5.6-luna-high-no-plugins-v1
  model: gpt-5.6-luna
  reasoning_effort: high
  harness: Codex Desktop originator / Codex CLI exec source
  plugins:
    feature: disabled
    model_visible: []
    superpowers: disabled
  skills:
    model_visible:
      - imagegen
      - openai-docs
      - plugin-creator
      - skill-creator
      - skill-installer
      - developing-with-yjs
    invoked: []
fixture:
  name: booking-scheduler
  source_commit: 4e6fe8c38ac4b9ed8c29deb67b314cd6b166ca6e
  workspace_start_commit: bd932cab3f9a5fae3d5836b4173888bcb46aade3
task:
  id: TASK-001
source_task:
  id: 01a0231e-99b7-7ba0-82bf-82cf1297210b
  url: unavailable-local-task
execution:
  duration_ms: 48333
  time_to_first_token_ms: 3050
  token_usage:
    input_tokens: 155110
    cached_input_tokens: 122880
    cache_write_input_tokens: 0
    output_tokens: 1905
    reasoning_output_tokens: 289
    total_tokens: 157015
human_interventions: 0
contaminated: false
---

# 실행 전 기록

## 연구 질문

하나의 고정된 Codex 에이전트는 작은 TypeScript 버그를 어떻게 조사하고 수정하며, 그 과정에서 어떤 관찰 가능한 행동을 기록할 가치가 있는가?

## 예상하는 행동 순서

Agent가 패키지 스크립트와 기존 테스트를 확인하고 현재 테스트를 실행한 뒤, 예약 서비스와 시간 구간 로직을 탐색하고 회귀 테스트와 구현 수정을 추가할 것으로 예상한다.

## 특히 관찰할 행동

- 기존 테스트를 언제 처음 실행하는가?
- 사용자 제보를 재현하는 테스트를 수정 전과 수정 후 중 언제 작성하는가?
- 서비스와 시간 구간 로직 중 어느 경계를 먼저 조사하는가?
- 실패한 테스트 또는 명령 이후 행동을 어떻게 바꾸는가?
- 어떤 근거로 완료를 선언하는가?

## 이 실행으로 결론 내릴 수 없는 것

개별 실행 하나만으로 Codex의 일반적인 행동이나 다른 Agent와의 우열을 결론 내릴 수 없다. 다섯 번의 반복도 탐색적 관찰이며 통계적 벤치마크가 아니다.

# 사실 기반 행동 기록

행동 유형은 `inspect`, `test`, `edit`, `command`, `communicate` 중 하나로 기록한다.

| 순서 | 행동 유형 | 대상 | 관찰된 결과 |
|---:|---|---|---|
| 1 | communicate | 초기 작업 계획 | 겹침 판정 로직을 추적하고 경계 조건만 허용한 뒤 실제 겹침 차단을 검증하겠다고 알렸다. |
| 2 | inspect | 파일 목록과 키워드 검색 | 예약·충돌·시작/종료 관련 위치를 검색했다. |
| 3 | inspect | 시간 구간·서비스·테스트·설정 | `overlaps`의 `<=` 비교와 공개 테스트 6개를 확인했다. |
| 4 | communicate | 결함 원인과 수정 방향 | 예약을 `[시작, 종료)`로 해석해 `<` 비교로 바꾸겠다고 설명했다. |
| 5 | command | 수정 전 `git status`와 diff | 변경이 없는 시작 상태를 한 번 더 확인했다. |
| 6 | edit | `src/time-range.ts`, `test/booking-service.test.ts` | 구현 수정과 제보 방향 회귀 테스트 1개를 같은 편집 동작에서 추가했다. |
| 7 | test | `npm test && npm run typecheck` | 수정 후 테스트 7개와 타입 검사가 통과했다. |
| 8 | communicate | 수정 후 검증 상태 | 기존 부분 중복 거부 동작이 유지된다고 알렸다. |
| 9 | command | `git diff --check`, 전체 diff, Git 상태 | 공백 오류와 두 파일 변경만 확인했다. |
| 10 | communicate | 최종 응답 | 원인, 수정, 테스트와 검증 결과를 요약했다. |

# 사람 개입 기록

| 순서 | 시점 또는 행동 순서 | 이유 | 전달 내용 | 오염 여부 |
|---:|---|---|---|---|
| - | - | 실행 중 사람 개입 없음 | 관찰 대상 Agent에게 초기 고정 프롬프트 외 메시지나 구현 힌트를 전달하지 않았다. | 아니요 |

# 실행 결과

## Agent가 보고한 검증

- `npm test`: 공개 테스트 7개 통과
- `npm run typecheck`: 통과
- 변경 파일은 `src/time-range.ts`, `test/booking-service.test.ts` 두 개다.
- `git diff --check` 통과를 최종 응답에 보고했다.

## 평가 Agent가 독립적으로 재실행한 검증

- `npm test`: 7/7 통과
- `npm run typecheck`: 통과
- 외부 평가기: 9/9 통과
- 회귀 테스트 red-check: 추가된 테스트만 고장 난 baseline 구현에 적용했을 때 7개 중 해당 테스트 1개가 `BookingConflictError`로 실패했다.
- 수동 diff 검토: 두 파일, +21/-2이며 관련 없는 변경은 없었다. 구현은 특정 시각이 아닌 두 시간 구간의 일반적인 반개구간 겹침 조건이다.
- red-check 자동화의 첫 두 시도는 각각 patch 출력 옵션 위치와 테스트 실행 디렉터리 오류로 테스트 시작 전에 중단됐다. 명령을 바로잡은 세 번째 시도에서 위 결과를 확인했으며 후보 코드는 바꾸지 않았다.

# 해석

## 유용해 보였던 행동

키워드 검색으로 원인 후보를 빠르게 좁히고, 편집 전 깨끗한 상태와 편집 후 diff를 모두 확인했다. 구현은 일반적인 반개구간 규칙이다.

## 불필요하거나 위험해 보였던 행동

수정 전 Git 상태는 재확인했지만 테스트는 실행하지 않았다. 실패하는 재현 테스트도 수정 전에 실행하지 않았고 공개 테스트는 한 방향만 추가했다. 구현과 테스트를 한 번의 편집 동작으로 함께 변경해 Trace 자체에는 red-green 순서가 없다.

## 실패 후 복구 방식

관찰 대상 Agent 실행에서는 실패한 명령이나 테스트가 없어 복구 행동을 관찰하지 못했다. 독립 평가의 red-check harness 오류 두 건은 평가 Agent가 명령만 수정해 복구했으며 관찰 대상 코드나 작업에는 개입하지 않았다.

## 예상과 달랐던 점

실행 전에는 기존 테스트와 실패하는 재현 테스트를 먼저 실행할 것으로 예상했지만, 실제로는 소스와 테스트를 읽고 구현과 회귀 테스트를 함께 수정한 뒤 처음 테스트했다. 공개 회귀 테스트 범위는 사용자가 제보한 방향 1개였다.

## 한계

- 표시된 행동과 명령만 기록했으며 숨겨진 추론 과정은 해석하지 않았다.
- 다섯 번의 반복은 동일 조건의 실행 간 변동을 탐색하기 위한 것이며 통계적 대표성을 주장하지 않는다.
- 플러그인 지시는 비활성화됐지만 Codex 시스템 및 독립 host skill 목록은 모델에 표시됐다. 이 실행에서 skill 호출은 관찰되지 않았다.
- 토큰 사용량에는 공통 실행 컨텍스트와 캐시된 입력이 포함되므로 도메인 작업량만을 나타내지 않는다.

## 다음 질문

같은 조건에서 작업 유형을 바꾸었을 때도 수정 전 테스트와 red-green 순서를 생략하는지, 공개 회귀 테스트 범위가 어떻게 달라지는지 관찰한다.
