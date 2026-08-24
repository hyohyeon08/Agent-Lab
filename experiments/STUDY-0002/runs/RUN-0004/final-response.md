수정 완료했습니다.

- `cancel`에서 이미 `cancelled` 상태인 예약은 즉시 반환하도록 변경
- 재취소 시 재고를 다시 `release`하지 않도록 보장
- 재취소 결과와 재고 불변을 검증하는 회귀 테스트 추가

검증 결과:

- `npm test` — 7개 테스트 통과
- `npm run typecheck` — 통과
- `git diff --check` — 통과
