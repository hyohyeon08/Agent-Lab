# Booking Scheduler

회의실 예약을 생성하고 같은 회의실의 중복 예약을 방지하는 작은 TypeScript 프로젝트다.

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

- `src/booking.ts`: 예약 데이터 타입
- `src/time-range.ts`: 시간 구간 검증과 겹침 판단
- `src/booking-repository.ts`: 메모리 예약 저장소
- `src/booking-service.ts`: 예약 생성과 충돌 방지
- `test/booking-service.test.ts`: 공개 동작 테스트

## 사용 예

```ts
import { BookingService } from "./src/booking-service.js";
import { InMemoryBookingRepository } from "./src/booking-repository.js";

const service = new BookingService(new InMemoryBookingRepository());
const booking = service.create({
  id: "booking-1",
  roomId: "room-a",
  startMinute: 540,
  endMinute: 600,
});
```
