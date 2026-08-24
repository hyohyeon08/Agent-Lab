import assert from "node:assert/strict";
import test from "node:test";

import { InsufficientStockError, Inventory } from "../src/inventory.js";
import { InMemoryReservationRepository } from "../src/reservation-repository.js";
import {
  InvalidReservationTransitionError,
  ReservationNotFoundError,
  ReservationService,
} from "../src/reservation-service.js";

function createFixture(initialStock = 10): {
  inventory: Inventory;
  repository: InMemoryReservationRepository;
  service: ReservationService;
} {
  const inventory = new Inventory({ "sku-a": initialStock });
  const repository = new InMemoryReservationRepository();
  const service = new ReservationService(repository, inventory);
  return { inventory, repository, service };
}

test("재고를 예약하면 가용 수량이 감소한다", () => {
  const { inventory, service } = createFixture();

  const reservation = service.create({
    id: "reservation-1",
    sku: "sku-a",
    quantity: 4,
  });

  assert.deepEqual(reservation, {
    id: "reservation-1",
    sku: "sku-a",
    quantity: 4,
    status: "active",
  });
  assert.equal(inventory.available("sku-a"), 6);
});

test("가용 수량보다 많은 재고 예약을 거부한다", () => {
  const { inventory, service } = createFixture(3);

  assert.throws(
    () =>
      service.create({
        id: "reservation-1",
        sku: "sku-a",
        quantity: 4,
      }),
    InsufficientStockError,
  );
  assert.equal(inventory.available("sku-a"), 3);
});

test("활성 예약을 취소하면 재고를 반환한다", () => {
  const { inventory, service } = createFixture();
  service.create({
    id: "reservation-1",
    sku: "sku-a",
    quantity: 4,
  });

  const cancelled = service.cancel("reservation-1");

  assert.equal(cancelled.status, "cancelled");
  assert.equal(inventory.available("sku-a"), 10);
});

test("활성 예약을 완료하면 재고를 반환하지 않는다", () => {
  const { inventory, service } = createFixture();
  service.create({
    id: "reservation-1",
    sku: "sku-a",
    quantity: 4,
  });

  const fulfilled = service.fulfill("reservation-1");

  assert.equal(fulfilled.status, "fulfilled");
  assert.equal(inventory.available("sku-a"), 6);
});

test("완료된 예약의 취소를 거부한다", () => {
  const { inventory, service } = createFixture();
  service.create({
    id: "reservation-1",
    sku: "sku-a",
    quantity: 4,
  });
  service.fulfill("reservation-1");

  assert.throws(
    () => service.cancel("reservation-1"),
    InvalidReservationTransitionError,
  );
  assert.equal(inventory.available("sku-a"), 6);
});

test("존재하지 않는 예약의 취소를 거부한다", () => {
  const { service } = createFixture();

  assert.throws(
    () => service.cancel("missing-reservation"),
    ReservationNotFoundError,
  );
});
