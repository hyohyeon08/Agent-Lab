---
study_id: STUDY-0001
run_id: RUN-0001
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
  id: 01a022fc-e013-7c42-89b2-7497e88992d3
  url: unavailable-local-task
execution:
  duration_ms: 53437
  time_to_first_token_ms: 3722
  token_usage:
    input_tokens: 118190
    cached_input_tokens: 106752
    cache_write_input_tokens: 0
    output_tokens: 2326
    reasoning_output_tokens: 422
    total_tokens: 120516
human_interventions: 0
contaminated: false
---

# 실행 전 기록

> **관찰자 편향 교정(2026-08-21):** 아래 예상에는 관찰자가 당시 사용하던
> Superpowers의 TDD 선호가 반영돼 있다. 감사 추적을 위해 원문을 보존하지만,
> 테스트와 구현의 순서는 이 실행의 성공·실패 또는 장단점 판단 기준으로
> 사용하지 않는다.

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

이 한 번의 실행만으로 Codex의 일반적인 행동, 다른 Agent와의 우열, 같은 Agent의 실행 간 변동을 결론 내릴 수 없다.

# 사실 기반 행동 기록

행동 유형은 `inspect`, `test`, `edit`, `command`, `communicate` 중 하나로 기록한다.

| 순서 | 행동 유형 | 대상 | 관찰된 결과 |
|---:|---|---|---|
| 1 | communicate | 초기 작업 계획 | 예약 생성 흐름과 중복 판정 로직을 추적하고, 경계 시각을 허용하는 최소 수정과 회귀 검증을 하겠다고 알렸다. |
| 2 | inspect | 실행 작업 공간과 Git 상태 | `rg --files`로 실행 공간의 파일을 열거하고 `git status --short`로 시작 상태가 깨끗함을 확인했다. |
| 3 | inspect | `src` 전체, 공개 테스트, `package.json`, `README.md` | `TimeRange.overlaps`의 `<=` 비교, 서비스의 충돌 판정 흐름, 기존 테스트 6개와 검증 명령을 확인했다. |
| 4 | communicate | 결함 원인과 수정 방향 | 예약 구간을 반개구간 `[시작, 종료)`로 해석해야 하므로 겹침 조건을 `<` 비교로 바꾸겠다고 설명했다. |
| 5 | edit | `src/time-range.ts`, `test/booking-service.test.ts` | 양쪽 겹침 비교를 `<`로 변경하고, 기존 예약 종료 시각에 새 예약이 시작하는 사례를 허용하는 회귀 테스트 1개를 추가했다. |
| 6 | test | `npm test` | 공개 테스트 7개가 모두 통과했다. |
| 7 | test | `npm run typecheck` | TypeScript 타입 검사가 통과했다. |
| 8 | communicate | 수정 후 검증 상태 | 새 회귀 테스트와 기존 실제 중복 거부 테스트가 통과한다고 알리고 최종 diff를 확인하겠다고 했다. |
| 9 | command | `git diff --check`, 변경 diff, `git status --short` | 공백 오류 없이 `src/time-range.ts`와 `test/booking-service.test.ts` 두 파일만 변경된 것을 확인했다. |
| 10 | communicate | 최종 응답 | 원인, 반개구간 수정, 회귀 테스트, 변경 파일과 Agent가 실행한 검증 결과를 요약했다. |

# 사람 개입 기록

| 순서 | 시점 또는 행동 순서 | 이유 | 전달 내용 | 오염 여부 |
|---:|---|---|---|---|
| - | - | 실행 중 사람 개입 없음 | 관찰 대상 Agent에게 초기 고정 프롬프트 외의 메시지나 구현 힌트를 전달하지 않았다. | 아니요 |

# 실행 결과

## Agent가 보고한 검증

- `npm test`: 공개 테스트 7개 통과
- `npm run typecheck`: 통과
- `git diff --check`: 통과
- 변경 파일은 `src/time-range.ts`, `test/booking-service.test.ts` 두 개라고 보고했다.

## 평가 Agent가 독립적으로 재실행한 검증

- `npm test`: 7/7 통과
- `npm run typecheck`: 통과
- 외부 평가기: 9/9 통과
- 회귀 테스트 결함 탐지 확인: 추가된 테스트만 고장 난 baseline 구현에 적용했을 때 7개 중 해당 테스트 1개가 `BookingConflictError`로 실패했다. 이는 테스트 결과물의 유효성을 보는 사후 평가이며 Agent의 개발 순서를 평가하지 않는다.
- 외부 평가기의 첫 실행은 후보 코드가 아니라 `tsx` IPC 소켓의 샌드박스 `EPERM` 때문에 시작되지 않았다. 동일 명령을 권한 경계 밖에서 재실행해 9/9 통과를 확인했다.
- 수동 diff 검토: 두 파일, +21/-2이며 관련 없는 변경은 없었다. 구현은 특정 시각이 아닌 두 시간 구간의 일반적인 반개구간 겹침 조건이다.

# 해석

## 유용해 보였던 행동

- 작업 공간이 깨끗한지 먼저 확인하고 관련 소스, 공개 테스트, 실행 명령을 한 번에 파악했다.
- 서비스 계층에 특례를 추가하지 않고 시간 구간의 겹침 규칙을 반개구간으로 바로잡아 양방향 인접 예약을 일반적으로 처리했다.
- 수정 후 공개 테스트, 타입 검사, `git diff --check`와 변경 범위를 확인한 뒤 완료를 선언했다.
- 추가한 회귀 테스트는 baseline 구현에서 실제로 실패하고 수정 구현에서 통과한다.

## 불필요하거나 위험해 보였던 행동

- 관찰된 변경은 두 관련 파일에 한정됐고 직접적인 불필요 작업이나 기능 위험은 확인되지 않았다.
- 공개 회귀 테스트는 사용자가 제보한 방향 하나를 고정했다. 반대 방향은 외부 평가기가 검증했으며 구현도 통과했다. 이는 공개 테스트 범위에 관한 관찰이지 TDD 순서나 성공 여부에 대한 감점 기준이 아니다.

## 실패 후 복구 방식

관찰 대상 Agent 실행에서는 실패한 명령이나 테스트가 없었으므로 복구 행동을 관찰하지 못했다. 독립 평가 단계의 첫 외부 평가 실행은 샌드박스의 `tsx` IPC 제한으로 실패했고, 평가 Agent가 동일 명령을 권한 경계 밖에서 재실행했다. 이는 후보 코드 수정이나 관찰 대상 Agent 개입을 수반하지 않았다.

## 예상과 달랐던 점

- Agent는 파일과 테스트를 읽고 원인을 특정한 뒤 구현과 테스트를 함께 수정하고 검증하는 경로를 선택했다.
- 서비스에 조건을 추가하는 대신 `TimeRange.overlaps`의 일반 규칙을 수정했다.
- 실행 전 관찰자의 테스트 우선 예상과 순서는 달랐지만, 그 차이는 행동 경로의 차이일 뿐 품질 우열로 해석하지 않는다.

## 한계

- 하나의 작은 TypeScript 버그에 대한 단일 실행이므로 같은 조건의 실행 간 변동이나 다른 작업에서의 행동을 설명하지 못한다.
- 표시된 행동과 명령만 기록했으며 숨겨진 추론 과정은 해석하지 않았다.
- 플러그인은 비활성화됐지만 Codex 시스템 및 독립 host skill 목록은 모델에 표시됐다. 이 실행에서 skill 호출은 관찰되지 않았다.
- 토큰 사용량에는 긴 공통 실행 컨텍스트와 캐시된 입력이 포함되므로 도메인 작업량만을 나타내지 않는다.
- 실행 전 예상과 최초 해석에는 관찰자의 TDD 선호가 섞여 있었으므로 교정 뒤 결과·변경 범위·검증 근거를 중심으로 해석했다.

## 다음 질문

다른 작은 버그 유형에서도 어떤 탐색 범위와 수정 지점을 선택하는지, 해결책을 얼마나 일반화하는지, 어떤 테스트 범위와 검증 근거를 자발적으로 선택하는지 확인한다.
