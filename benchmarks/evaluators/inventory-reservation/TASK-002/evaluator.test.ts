import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

interface Reservation {
  id: string;
  sku: string;
  quantity: number;
  status: "active" | "cancelled" | "fulfilled";
}

interface InventoryInstance {
  available(sku: string): number;
}

interface RepositoryInstance {
  findById(id: string): Reservation | undefined;
}

interface ServiceInstance {
  create(input: {
    id: string;
    sku: string;
    quantity: number;
  }): Reservation;
  cancel(id: string): Reservation;
  fulfill(id: string): Reservation;
}

const args = process.argv.slice(2);
const candidateIndex = args.indexOf("--candidate");
const candidateValue = args[candidateIndex + 1];

if (candidateIndex === -1 || candidateValue === undefined) {
  throw new Error("Usage: npm run evaluate:task-002 -- --candidate <path>");
}

const candidateRoot = path.resolve(candidateValue);
const inventoryUrl = pathToFileURL(
  path.join(candidateRoot, "src/inventory.ts"),
).href;
const repositoryUrl = pathToFileURL(
  path.join(candidateRoot, "src/reservation-repository.ts"),
).href;
const serviceUrl = pathToFileURL(
  path.join(candidateRoot, "src/reservation-service.ts"),
).href;

const inventoryModule = await import(inventoryUrl);
const repositoryModule = await import(repositoryUrl);
const serviceModule = await import(serviceUrl);

const Inventory = inventoryModule.Inventory as new (
  initialStock: Readonly<Record<string, number>>,
) => InventoryInstance;
const InMemoryReservationRepository =
  repositoryModule.InMemoryReservationRepository as new () => RepositoryInstance;
const ReservationService = serviceModule.ReservationService as new (
  repository: RepositoryInstance,
  inventory: InventoryInstance,
) => ServiceInstance;

function createFixture(initialStock = 10): {
  inventory: InventoryInstance;
  repository: RepositoryInstance;
  service: ServiceInstance;
} {
  const inventory = new Inventory({ "sku-a": initialStock });
  const repository = new InMemoryReservationRepository();
  const service = new ReservationService(repository, inventory);
  return { inventory, repository, service };
}

function reserve(
  service: ServiceInstance,
  id: string,
  quantity: number,
): Reservation {
  return service.create({ id, sku: "sku-a", quantity });
}

function expectErrorName(action: () => void, name: string): void {
  assert.throws(
    action,
    (error: unknown) => error instanceof Error && error.name === name,
  );
}

let failures = 0;

function check(name: string, action: () => void): void {
  try {
    action();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}

check("예약 생성이 가용 재고를 감소시킨다", () => {
  const { inventory, service } = createFixture();
  reserve(service, "reservation-1", 4);
  assert.equal(inventory.available("sku-a"), 6);
});

check("활성 예약의 첫 취소가 재고를 한 번 반환한다", () => {
  const { inventory, service } = createFixture();
  reserve(service, "reservation-1", 4);
  const cancelled = service.cancel("reservation-1");
  assert.equal(cancelled.status, "cancelled");
  assert.equal(inventory.available("sku-a"), 10);
});

check("이미 취소된 예약의 재취소가 재고를 다시 반환하지 않는다", () => {
  const { inventory, service } = createFixture();
  reserve(service, "reservation-1", 4);
  reserve(service, "reservation-2", 3);
  service.cancel("reservation-1");
  assert.equal(inventory.available("sku-a"), 7);
  service.cancel("reservation-1");
  assert.equal(inventory.available("sku-a"), 7);
});

check("재취소는 취소된 예약 상태를 그대로 반환한다", () => {
  const { service } = createFixture();
  reserve(service, "reservation-1", 4);
  service.cancel("reservation-1");
  const repeated = service.cancel("reservation-1");
  assert.equal(repeated.status, "cancelled");
});

check("완료된 예약의 취소를 거부한다", () => {
  const { service } = createFixture();
  reserve(service, "reservation-1", 4);
  service.fulfill("reservation-1");
  expectErrorName(
    () => service.cancel("reservation-1"),
    "InvalidReservationTransitionError",
  );
});

check("완료 및 실패한 취소가 재고를 반환하지 않는다", () => {
  const { inventory, service } = createFixture();
  reserve(service, "reservation-1", 4);
  service.fulfill("reservation-1");
  assert.equal(inventory.available("sku-a"), 6);
  assert.throws(() => service.cancel("reservation-1"));
  assert.equal(inventory.available("sku-a"), 6);
});

check("한 예약의 취소가 다른 예약 상태를 바꾸지 않는다", () => {
  const { repository, service } = createFixture();
  reserve(service, "reservation-1", 4);
  reserve(service, "reservation-2", 3);
  service.cancel("reservation-1");
  assert.equal(repository.findById("reservation-2")?.status, "active");
});

check("수량 부족 예약을 거부하고 재고를 유지한다", () => {
  const { inventory, service } = createFixture(3);
  expectErrorName(
    () => reserve(service, "reservation-1", 4),
    "InsufficientStockError",
  );
  assert.equal(inventory.available("sku-a"), 3);
});

check("존재하지 않는 예약의 취소를 거부한다", () => {
  const { service } = createFixture();
  expectErrorName(
    () => service.cancel("missing-reservation"),
    "ReservationNotFoundError",
  );
});

if (failures > 0) {
  console.error(`${failures} external evaluation case(s) failed`);
  process.exitCode = 1;
} else {
  console.log("All 9 external evaluation cases passed");
}
