수정 완료했습니다.

- 원인: `overlaps`가 종료 시각을 포함하는 `<=` 비교를 사용함.
- 수정: 예약 구간을 `[시작, 종료)`로 처리하도록 `<` 비교로 변경.
- 회귀 테스트 추가: 기존 예약이 10:00에 끝나고 새 예약이 10:00에 시작하는 경우 허용.
- 기존 실제 중복 예약 차단 테스트는 유지되며 통과합니다.

변경 파일:

- [src/time-range.ts](/Users/hyohyeon/Desktop/Agent-Lab/.worktrees/task-001-observation/runs/workspaces/STUDY-0001/RUN-0003/booking-scheduler/src/time-range.ts)
- [test/booking-service.test.ts](/Users/hyohyeon/Desktop/Agent-Lab/.worktrees/task-001-observation/runs/workspaces/STUDY-0001/RUN-0003/booking-scheduler/test/booking-service.test.ts)

검증 결과: `npm test` 7개 통과, `npm run typecheck` 통과.
