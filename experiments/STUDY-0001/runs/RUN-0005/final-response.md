수정 완료했습니다.

- 원인: 시간 중복 판정이 종료 시각을 포함해 `10:00–11:00`과 `11:00–12:00`을 겹친 것으로 판단했습니다.
- 수정: 예약 구간을 `[시작, 종료)`로 처리하도록 비교 연산자를 `<`로 변경했습니다.
- 테스트 추가:
  - 기존 예약 종료 시각에 시작하는 예약 허용
  - 기존 예약 시작 시각에 끝나는 예약 허용
  - 실제 부분 중복 예약 거부 동작 유지 확인

변경 파일:

- [src/time-range.ts](/Users/hyohyeon/Desktop/Agent-Lab/.worktrees/task-001-observation/runs/workspaces/STUDY-0001/RUN-0005/booking-scheduler/src/time-range.ts:23)
- [test/booking-service.test.ts](/Users/hyohyeon/Desktop/Agent-Lab/.worktrees/task-001-observation/runs/workspaces/STUDY-0001/RUN-0005/booking-scheduler/test/booking-service.test.ts:73)

검증 결과: 테스트 8개 통과, 타입 검사 통과.
