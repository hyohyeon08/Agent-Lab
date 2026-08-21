수정 완료했습니다.

- 원인: 중복 판정이 종료 시각을 포함하는 `<=` 비교를 사용하고 있었습니다.
- 수정: 예약 구간을 `[시작, 종료)`로 처리하도록 `<` 비교로 변경했습니다.
- 테스트 추가: 기존 예약 종료 시각에 시작하는 예약을 허용하는 회귀 테스트를 추가했습니다.
- 기존 실제 중복 예약 거부 테스트는 유지되며 통과합니다.

변경 파일:

- [src/time-range.ts](/Users/hyohyeon/Desktop/Agent-Lab/.worktrees/task-001-observation/runs/workspaces/STUDY-0001/RUN-0001/booking-scheduler/src/time-range.ts:25)
- [test/booking-service.test.ts](/Users/hyohyeon/Desktop/Agent-Lab/.worktrees/task-001-observation/runs/workspaces/STUDY-0001/RUN-0001/booking-scheduler/test/booking-service.test.ts:73)

검증 결과:

- `npm test` — 7개 통과
- `npm run typecheck` — 통과
