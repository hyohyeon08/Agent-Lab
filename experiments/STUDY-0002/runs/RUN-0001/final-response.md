수정 완료했습니다.

- 원인: `cancel`이 `cancelled` 상태를 별도로 처리하지 않아 매번 재고를 반환했습니다.
- 수정: 이미 취소된 예약은 그대로 반환하고 재고를 변경하지 않도록 멱등 처리했습니다.
- 테스트: 중복 취소 시 반환값과 재고가 변하지 않는 회귀 테스트를 추가했습니다.

변경 파일:
- [src/reservation-service.ts](<.../src/reservation-service.ts>)
- [test/reservation-service.test.ts](<.../test/reservation-service.test.ts>)

검증 결과:

- `npm test`: 7개 통과
- `npm run typecheck`: 통과
