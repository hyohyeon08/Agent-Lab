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
human_interventions: 0
contaminated: false
---

# 실행 전 기록

## 연구 질문

## 예상하는 행동 순서

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

## Agent가 보고한 검증

## 평가 Agent가 독립적으로 재실행한 검증

# 해석

## 유용해 보였던 행동

## 불필요하거나 위험해 보였던 행동

## 실패 후 복구 방식

## 예상과 달랐던 점

## 한계

## 다음 질문
