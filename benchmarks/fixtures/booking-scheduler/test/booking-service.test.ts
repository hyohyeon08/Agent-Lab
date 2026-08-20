import assert from "node:assert/strict";
import test from "node:test";

import {
  BookingConflictError,
  BookingService,
} from "../src/booking-service.js";
import { InMemoryBookingRepository } from "../src/booking-repository.js";
import { InvalidTimeRangeError } from "../src/time-range.js";

function createService(): BookingService {
  return new BookingService(new InMemoryBookingRepository());
}

test("첫 예약을 생성한다", () => {
  const service = createService();

  const booking = service.create({
    id: "booking-1",
    roomId: "room-a",
    startMinute: 540,
    endMinute: 600,
  });

  assert.deepEqual(booking, {
    id: "booking-1",
    roomId: "room-a",
    startMinute: 540,
    endMinute: 600,
  });
});

test("같은 회의실에서 일부 시간이 겹치는 예약을 거부한다", () => {
  const service = createService();
  service.create({
    id: "booking-1",
    roomId: "room-a",
    startMinute: 540,
    endMinute: 600,
  });

  assert.throws(
    () =>
      service.create({
        id: "booking-2",
        roomId: "room-a",
        startMinute: 570,
        endMinute: 630,
      }),
    BookingConflictError,
  );
});

test("같은 회의실에서 충분한 간격이 있는 예약을 허용한다", () => {
  const service = createService();
  service.create({
    id: "booking-1",
    roomId: "room-a",
    startMinute: 540,
    endMinute: 600,
  });

  assert.doesNotThrow(() =>
    service.create({
      id: "booking-2",
      roomId: "room-a",
      startMinute: 660,
      endMinute: 720,
    }),
  );
});

test("다른 회의실에서 같은 시간의 예약을 허용한다", () => {
  const service = createService();
  service.create({
    id: "booking-1",
    roomId: "room-a",
    startMinute: 540,
    endMinute: 600,
  });

  assert.doesNotThrow(() =>
    service.create({
      id: "booking-2",
      roomId: "room-b",
      startMinute: 540,
      endMinute: 600,
    }),
  );
});

test("시작과 종료가 같으면 거부한다", () => {
  const service = createService();

  assert.throws(
    () =>
      service.create({
        id: "booking-1",
        roomId: "room-a",
        startMinute: 600,
        endMinute: 600,
      }),
    InvalidTimeRangeError,
  );
});

test("종료가 시작보다 빠르면 거부한다", () => {
  const service = createService();

  assert.throws(
    () =>
      service.create({
        id: "booking-1",
        roomId: "room-a",
        startMinute: 660,
        endMinute: 600,
      }),
    InvalidTimeRangeError,
  );
});
