수정 완료했습니다.

- 원인: `cancel()`이 이미 `cancelled`인 예약에도 재고 반환을 수행함.
- 수정: 이미 취소된 예약은 상태와 재고를 변경하지 않고 그대로 반환하도록 처리했습니다.  
  [reservation-service.ts:53](/Users/hyohyeon/Desktop/Agent-Lab/.worktrees/task-002-observation/runs/workspaces/STUDY-0002/RUN-0003/inventory-reservation/src/reservation-service.ts:53)
- 회귀 테스트 추가: 동일 예약의 중복 취소 시 반환값은 동일하고 재고는 한 번만 복구되는지 검증했습니다.  
  [reservation-service.test.ts:70](/Users/hyohyeon/Desktop/Agent-Lab/.worktrees/task-002-observation/runs/workspaces/STUDY-0002/RUN-0003/inventory-reservation/test/reservation-service.test.ts:70)

검증 결과:

- `npm test`: 7개 모두 통과
- `npm run typecheck`: 통과
