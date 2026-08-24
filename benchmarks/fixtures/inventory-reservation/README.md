# Inventory Reservation

상품 재고를 예약하고 예약을 취소하거나 완료하는 작은 TypeScript 프로젝트다.

## 설치

```bash
npm ci
```

## 검증

```bash
npm test
npm run typecheck
```

## 구조

- `src/inventory.ts`: 상품별 가용 재고와 예약·반환 처리
- `src/reservation.ts`: 예약 데이터와 상태 타입
- `src/reservation-repository.ts`: 메모리 예약 저장소
- `src/reservation-service.ts`: 예약 생성·취소·완료 상태 전이
- `test/reservation-service.test.ts`: 공개 동작 테스트

## 사용 예

```ts
import { Inventory } from "./src/inventory.js";
import { InMemoryReservationRepository } from "./src/reservation-repository.js";
import { ReservationService } from "./src/reservation-service.js";

const inventory = new Inventory({ "sku-a": 10 });
const repository = new InMemoryReservationRepository();
const service = new ReservationService(repository, inventory);

service.create({ id: "reservation-1", sku: "sku-a", quantity: 4 });
service.cancel("reservation-1");
```
