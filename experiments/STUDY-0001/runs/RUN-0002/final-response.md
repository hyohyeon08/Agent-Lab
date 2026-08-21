예약 중복 판정 버그를 수정했습니다.

- `TimeRange.overlaps`를 반열린 구간 `[시작, 종료)` 기준으로 변경
- 기존 예약 종료 시각과 신규 예약 시작 시각이 같으면 허용
- 실제 시간이 겹치는 예약은 계속 거부
- 경계 시각 회귀 테스트 추가

변경 파일:

- [src/time-range.ts](/Users/hyohyeon/Desktop/Agent-Lab/.worktrees/task-001-observation/runs/workspaces/STUDY-0001/RUN-0002/booking-scheduler/src/time-range.ts)
- [test/booking-service.test.ts](/Users/hyohyeon/Desktop/Agent-Lab/.worktrees/task-001-observation/runs/workspaces/STUDY-0001/RUN-0002/booking-scheduler/test/booking-service.test.ts)

검증 결과: `npm test` 7개 통과, `npm run typecheck` 통과.
