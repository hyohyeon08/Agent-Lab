import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

interface BookingInput {
  id: string;
  roomId: string;
  startMinute: number;
  endMinute: number;
}

interface Repository {
  findByRoom(roomId: string): readonly BookingInput[];
  save(booking: BookingInput): void;
}

interface Service {
  create(input: BookingInput): BookingInput;
}

const args = process.argv.slice(2);
const candidateIndex = args.indexOf("--candidate");
const candidateValue = args[candidateIndex + 1];

if (candidateIndex === -1 || candidateValue === undefined) {
  throw new Error("Usage: npm run evaluate:task-001 -- --candidate <path>");
}

const candidateRoot = path.resolve(candidateValue);
const serviceUrl = pathToFileURL(
  path.join(candidateRoot, "src/booking-service.ts"),
).href;
const repositoryUrl = pathToFileURL(
  path.join(candidateRoot, "src/booking-repository.ts"),
).href;

const serviceModule = await import(serviceUrl);
const repositoryModule = await import(repositoryUrl);

const BookingService = serviceModule.BookingService as new (
  repository: Repository,
) => Service;
const InMemoryBookingRepository =
  repositoryModule.InMemoryBookingRepository as new () => Repository;

function createService(): Service {
  return new BookingService(new InMemoryBookingRepository());
}

function booking(
  id: string,
  roomId: string,
  startMinute: number,
  endMinute: number,
): BookingInput {
  return { id, roomId, startMinute, endMinute };
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

check("기존 종료와 새 시작이 같은 인접 예약을 허용한다", () => {
  const service = createService();
  service.create(booking("existing", "room-a", 540, 600));
  assert.doesNotThrow(() =>
    service.create(booking("candidate", "room-a", 600, 660)),
  );
});

check("새 종료와 기존 시작이 같은 인접 예약을 허용한다", () => {
  const service = createService();
  service.create(booking("existing", "room-a", 600, 660));
  assert.doesNotThrow(() =>
    service.create(booking("candidate", "room-a", 540, 600)),
  );
});

check("일부 시간이 겹치는 예약을 거부한다", () => {
  const service = createService();
  service.create(booking("existing", "room-a", 540, 600));
  expectErrorName(
    () => service.create(booking("candidate", "room-a", 570, 630)),
    "BookingConflictError",
  );
});

check("새 예약이 기존 예약을 포함하면 거부한다", () => {
  const service = createService();
  service.create(booking("existing", "room-a", 570, 600));
  expectErrorName(
    () => service.create(booking("candidate", "room-a", 540, 630)),
    "BookingConflictError",
  );
});

check("기존 예약이 새 예약을 포함하면 거부한다", () => {
  const service = createService();
  service.create(booking("existing", "room-a", 540, 630));
  expectErrorName(
    () => service.create(booking("candidate", "room-a", 570, 600)),
    "BookingConflictError",
  );
});

check("시간이 완전히 같은 예약을 거부한다", () => {
  const service = createService();
  service.create(booking("existing", "room-a", 540, 600));
  expectErrorName(
    () => service.create(booking("candidate", "room-a", 540, 600)),
    "BookingConflictError",
  );
});

check("다른 회의실의 같은 시간 예약을 허용한다", () => {
  const service = createService();
  service.create(booking("existing", "room-a", 540, 600));
  assert.doesNotThrow(() =>
    service.create(booking("candidate", "room-b", 540, 600)),
  );
});

check("시작과 종료가 같은 구간을 거부한다", () => {
  const service = createService();
  expectErrorName(
    () => service.create(booking("candidate", "room-a", 600, 600)),
    "InvalidTimeRangeError",
  );
});

check("종료가 시작보다 빠른 구간을 거부한다", () => {
  const service = createService();
  expectErrorName(
    () => service.create(booking("candidate", "room-a", 660, 600)),
    "InvalidTimeRangeError",
  );
});

if (failures > 0) {
  console.error(`${failures} external evaluation case(s) failed`);
  process.exitCode = 1;
} else {
  console.log("All 9 external evaluation cases passed");
}
