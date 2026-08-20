# Task 001 에이전트 관찰 연구 도구 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 하나의 고정된 Codex 에이전트가 작은 예약 경계 버그를 조사하고 수정하는 과정을 오염 없이 관찰할 수 있는 첫 번째 재현 가능한 연구 도구를 만든다.

**Architecture:** 의도적으로 경계 오류를 포함한 독립 TypeScript 픽스처와 실행 공간 밖의 외부 평가기를 분리한다. Study/Run 기록은 Markdown과 YAML로 수동 작성하며, 별도 Git 저장소로 만든 실행용 작업 공간만 관찰 대상 Agent에게 제공한다.

**Tech Stack:** Node.js 22, TypeScript 5, `tsx`, Node 내장 테스트 실행기, Git, Markdown, YAML

**Spec:** `docs/superpowers/specs/2026-08-20-task-001-agent-observation-design.md`

## Global Constraints

- 연구 식별자는 `STUDY-0001`, `TASK-001`, `RUN-0001`을 사용한다.
- Condition 식별자는 `codex-current-config-v0`을 사용한다.
- 픽스처 이름은 `booking-scheduler`다.
- 시간은 같은 날의 분 단위 정수로 표현하고 예약 구간은 `[startMinute, endMinute)`로 해석한다.
- 픽스처는 TypeScript, Node 내장 테스트 실행기, `tsx`만 사용한다.
- 네트워크, 데이터베이스, 웹 프레임워크, 날짜 라이브러리를 런타임에 사용하지 않는다.
- 고장 난 초기 상태에서 공개 테스트와 타입 검사는 통과해야 한다.
- 고장 난 초기 상태에서 외부 평가의 인접 예약 사례는 실패해야 한다.
- `oracle.patch`를 적용한 정상 상태에서는 공개 테스트, 타입 검사, 외부 평가가 모두 통과해야 한다.
- 관찰 대상 Agent에게 외부 평가기, 정답 패치, Agent Lab 설계 문서를 제공하지 않는다.
- 관찰 대상 Agent에게 전달할 프롬프트는 명세의 문구를 변경하지 않는다.
- 알 수 없는 Model, reasoning effort, plugin, token, 시간 정보는 추정하지 않고 `unknown`으로 기록한다.
- `RUN-0001` 이후의 반복 실행이나 Task 002는 이 계획에서 구현하지 않는다.

---

## File Map

### Public fixture

- `benchmarks/fixtures/booking-scheduler/.gitignore`: 독립 저장소의 설치 산출물 제외
- `benchmarks/fixtures/booking-scheduler/package.json`: 독립 설치, 공개 테스트, 타입 검사 명령
- `benchmarks/fixtures/booking-scheduler/package-lock.json`: 고정된 개발 의존성
- `benchmarks/fixtures/booking-scheduler/tsconfig.json`: 픽스처 전용 TypeScript 설정
- `benchmarks/fixtures/booking-scheduler/README.md`: 관찰 대상 Agent가 볼 수 있는 일반 사용 설명
- `benchmarks/fixtures/booking-scheduler/src/booking.ts`: 예약 입력 및 저장 타입
- `benchmarks/fixtures/booking-scheduler/src/time-range.ts`: 시간 구간 검증과 의도적으로 결함이 있는 겹침 판단
- `benchmarks/fixtures/booking-scheduler/src/booking-repository.ts`: 저장소 인터페이스와 메모리 구현
- `benchmarks/fixtures/booking-scheduler/src/booking-service.ts`: 예약 생성 유스케이스와 충돌 오류
- `benchmarks/fixtures/booking-scheduler/test/booking-service.test.ts`: 인접 경계를 제외한 공개 테스트

### External evaluator

- `package.json`: `evaluate:task-001` 명령 추가
- `benchmarks/evaluators/booking-scheduler/TASK-001/evaluator.test.ts`: 후보 경로를 받아 9개 외부 사례 실행
- `benchmarks/evaluators/booking-scheduler/TASK-001/oracle.patch`: 의도적인 결함만 고치는 최소 패치
- `benchmarks/evaluators/booking-scheduler/TASK-001/README.md`: 외부 평가 사용법과 예상 상태

### Study records

- `experiments/README.md`: Study/Run 중심의 한국어 안내로 교체
- Delete `experiments/templates/experiment.yaml`: 단일 실행과 Study를 혼동하는 기존 템플릿 제거
- `experiments/templates/study.yaml`: Study 메타데이터 템플릿
- `experiments/templates/run.md`: 사실 기록과 해석이 분리된 Run 템플릿
- `experiments/templates/evaluation.yaml`: 자동·수동 평가 템플릿
- `experiments/templates/report.md`: Study 용어에 맞춘 한국어 보고서 템플릿
- `experiments/STUDY-0001/study.yaml`: 첫 탐색 연구 정의
- `experiments/STUDY-0001/runs/RUN-0001/run.md`: 실행 전 기대와 관찰 양식
- `experiments/STUDY-0001/runs/RUN-0001/prompt.md`: 관찰 대상 Agent에게 전달할 고정 프롬프트
- `experiments/STUDY-0001/runs/RUN-0001/evaluation.yaml`: 실행 전 `not_run` 상태의 평가 기록

### Execution handoff

- `.gitignore`: `runs/workspaces/` 제외 규칙 추가
- `docs/runbooks/task-001-run.md`: 실행 공간 준비, 새 Codex 작업, 결과 고정, 외부 평가 절차
- `README.md`: 설계, 구현 계획, 실행 안내 링크 추가

---

### Task 1: 공개 `booking-scheduler` 픽스처

**Files:**
- Create: `benchmarks/fixtures/booking-scheduler/.gitignore`
- Create: `benchmarks/fixtures/booking-scheduler/package.json`
- Create: `benchmarks/fixtures/booking-scheduler/package-lock.json`
- Create: `benchmarks/fixtures/booking-scheduler/tsconfig.json`
- Create: `benchmarks/fixtures/booking-scheduler/README.md`
- Create: `benchmarks/fixtures/booking-scheduler/src/booking.ts`
- Create: `benchmarks/fixtures/booking-scheduler/src/time-range.ts`
- Create: `benchmarks/fixtures/booking-scheduler/src/booking-repository.ts`
- Create: `benchmarks/fixtures/booking-scheduler/src/booking-service.ts`
- Test: `benchmarks/fixtures/booking-scheduler/test/booking-service.test.ts`

**Interfaces:**
- Consumes: Node.js 22와 npm
- Produces: `Booking`, `CreateBookingInput`, `TimeRange.from()`, `TimeRange.overlaps()`, `BookingRepository`, `InMemoryBookingRepository`, `BookingService.create()`, `BookingConflictError`, `InvalidTimeRangeError`

- [ ] **Step 1: 픽스처 패키지와 TypeScript 설정 작성**

`benchmarks/fixtures/booking-scheduler/.gitignore`:

```gitignore
node_modules/
```

`benchmarks/fixtures/booking-scheduler/package.json`:

```json
{
  "name": "booking-scheduler-fixture",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --import tsx --test test/booking-service.test.ts",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

`benchmarks/fixtures/booking-scheduler/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": ".",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

- [ ] **Step 2: 의존성을 설치하고 잠금 파일 생성**

Run:

```bash
npm install --prefix benchmarks/fixtures/booking-scheduler
```

Expected: `package-lock.json`과 fixture 내부 `node_modules/`가 생성되고 종료 코드 `0`.

- [ ] **Step 3: 공개 테스트를 먼저 작성**

`benchmarks/fixtures/booking-scheduler/test/booking-service.test.ts`:

```ts
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
```

- [ ] **Step 4: 공개 테스트가 구현 부재로 실패하는지 확인**

Run:

```bash
npm --prefix benchmarks/fixtures/booking-scheduler test
```

Expected: FAIL with `Cannot find module '../src/booking-service.js'`.

- [ ] **Step 5: 예약 타입 작성**

`benchmarks/fixtures/booking-scheduler/src/booking.ts`:

```ts
export interface Booking {
  id: string;
  roomId: string;
  startMinute: number;
  endMinute: number;
}

export type CreateBookingInput = Booking;
```

- [ ] **Step 6: 시간 구간과 의도적인 경계 결함 작성**

`benchmarks/fixtures/booking-scheduler/src/time-range.ts`:

```ts
export class InvalidTimeRangeError extends Error {
  override readonly name = "InvalidTimeRangeError";

  constructor(startMinute: number, endMinute: number) {
    super(`Invalid time range: ${startMinute}..${endMinute}`);
  }
}

export class TimeRange {
  private constructor(
    readonly startMinute: number,
    readonly endMinute: number,
  ) {}

  static from(startMinute: number, endMinute: number): TimeRange {
    if (startMinute >= endMinute) {
      throw new InvalidTimeRangeError(startMinute, endMinute);
    }

    return new TimeRange(startMinute, endMinute);
  }

  overlaps(other: TimeRange): boolean {
    return (
      this.startMinute <= other.endMinute &&
      other.startMinute <= this.endMinute
    );
  }
}
```

The `<=` comparisons are intentional fixture defects. Do not correct them in the tracked baseline.

- [ ] **Step 7: 저장소 인터페이스와 메모리 구현 작성**

`benchmarks/fixtures/booking-scheduler/src/booking-repository.ts`:

```ts
import type { Booking } from "./booking.js";

export interface BookingRepository {
  findByRoom(roomId: string): readonly Booking[];
  save(booking: Booking): void;
}

export class InMemoryBookingRepository implements BookingRepository {
  private readonly bookings: Booking[] = [];

  findByRoom(roomId: string): readonly Booking[] {
    return this.bookings.filter((booking) => booking.roomId === roomId);
  }

  save(booking: Booking): void {
    this.bookings.push({ ...booking });
  }
}
```

- [ ] **Step 8: 예약 서비스와 충돌 오류 작성**

`benchmarks/fixtures/booking-scheduler/src/booking-service.ts`:

```ts
import type { Booking, CreateBookingInput } from "./booking.js";
import type { BookingRepository } from "./booking-repository.js";
import { TimeRange } from "./time-range.js";

export class BookingConflictError extends Error {
  override readonly name = "BookingConflictError";

  constructor(roomId: string) {
    super(`Booking conflict in room: ${roomId}`);
  }
}

export class BookingService {
  constructor(private readonly repository: BookingRepository) {}

  create(input: CreateBookingInput): Booking {
    const candidate = TimeRange.from(input.startMinute, input.endMinute);
    const hasConflict = this.repository.findByRoom(input.roomId).some((booking) =>
      candidate.overlaps(
        TimeRange.from(booking.startMinute, booking.endMinute),
      ),
    );

    if (hasConflict) {
      throw new BookingConflictError(input.roomId);
    }

    const booking = { ...input };
    this.repository.save(booking);
    return booking;
  }
}
```

- [ ] **Step 9: 공개 테스트와 타입 검사를 실행**

Run:

```bash
npm --prefix benchmarks/fixtures/booking-scheduler test
npm --prefix benchmarks/fixtures/booking-scheduler run typecheck
```

Expected: 공개 테스트 `6/6` PASS, typecheck 종료 코드 `0`.

- [ ] **Step 10: 관찰 대상용 README 작성**

`benchmarks/fixtures/booking-scheduler/README.md`:

````markdown
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
````

Verify that this README does not mention half-open intervals, adjacent bookings, `TASK-001`, the evaluator, or the oracle patch.

- [ ] **Step 11: Task 1 변경 커밋**

```bash
git add benchmarks/fixtures/booking-scheduler
git commit -m "feat: add booking scheduler observation fixture"
```

---

### Task 2: 비공개 외부 평가기와 Oracle 검증

**Files:**
- Modify: `package.json`
- Create: `benchmarks/evaluators/booking-scheduler/TASK-001/evaluator.test.ts`
- Create: `benchmarks/evaluators/booking-scheduler/TASK-001/oracle.patch`
- Create: `benchmarks/evaluators/booking-scheduler/TASK-001/README.md`
- Test: `benchmarks/evaluators/booking-scheduler/TASK-001/evaluator.test.ts`

**Interfaces:**
- Consumes: `BookingService.create(input: CreateBookingInput): Booking`, `InMemoryBookingRepository`, `--candidate <absolute-or-relative-path>`
- Produces: `npm run evaluate:task-001 -- --candidate <path>`, 성공 시 exit `0`, 한 사례라도 실패하면 exit `1`

- [ ] **Step 1: Root 평가 명령 추가**

Add this script to root `package.json` after `typecheck`:

```json
"evaluate:task-001": "tsx benchmarks/evaluators/booking-scheduler/TASK-001/evaluator.test.ts"
```

The complete `scripts` object becomes:

```json
{
  "build": "tsc --noEmit",
  "typecheck": "tsc --noEmit",
  "evaluate:task-001": "tsx benchmarks/evaluators/booking-scheduler/TASK-001/evaluator.test.ts"
}
```

- [ ] **Step 2: 외부 평가기를 작성**

`benchmarks/evaluators/booking-scheduler/TASK-001/evaluator.test.ts`:

```ts
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
```

- [ ] **Step 3: 최소 정답 패치 작성**

`benchmarks/evaluators/booking-scheduler/TASK-001/oracle.patch`:

```diff
diff --git a/src/time-range.ts b/src/time-range.ts
--- a/src/time-range.ts
+++ b/src/time-range.ts
@@ -23,8 +23,8 @@ export class TimeRange {
   overlaps(other: TimeRange): boolean {
     return (
-      this.startMinute <= other.endMinute &&
-      other.startMinute <= this.endMinute
+      this.startMinute < other.endMinute &&
+      other.startMinute < this.endMinute
     );
   }
 }
```

- [ ] **Step 4: 평가기 README 작성**

`benchmarks/evaluators/booking-scheduler/TASK-001/README.md`:

````markdown
# TASK-001 외부 평가기

이 평가기는 `booking-scheduler` 후보 경로를 읽기 전용으로 불러와 예약 경계와 회귀 사례 9개를 확인한다.

## 실행

```bash
npm run evaluate:task-001 -- --candidate /absolute/path/to/booking-scheduler
```

## 예상 상태

- 추적되는 고장 난 픽스처: 인접 예약 사례 2개 실패, 종료 코드 `1`
- `oracle.patch`를 적용한 정상 픽스처: 전체 9개 통과, 종료 코드 `0`

평가기는 후보 파일을 수정하지 않는다. 관찰 대상 Agent의 실행 공간에는 이 디렉터리를 복사하지 않는다.
````

- [ ] **Step 5: Root 의존성을 설치하고 고장 난 상태의 RED를 확인**

Run:

```bash
npm ci
npm run evaluate:task-001 -- --candidate benchmarks/fixtures/booking-scheduler
```

Expected: 인접 예약 2개가 `FAIL`, 나머지 7개가 `PASS`, 전체 종료 코드 `1`.

- [ ] **Step 6: 임시 복사본에 Oracle 패치를 적용하여 GREEN을 확인**

Run:

```bash
task_oracle_parent=$(mktemp -d)
task_oracle_root="$task_oracle_parent/booking-scheduler"
task_oracle_patch="$PWD/benchmarks/evaluators/booking-scheduler/TASK-001/oracle.patch"
mkdir "$task_oracle_root"
git archive HEAD:benchmarks/fixtures/booking-scheduler | tar -x -C "$task_oracle_root"
git -C "$task_oracle_root" init
git -C "$task_oracle_root" apply "$task_oracle_patch"
npm --prefix "$task_oracle_root" ci
npm run evaluate:task-001 -- --candidate "$task_oracle_root"
npm --prefix "$task_oracle_root" test
npm --prefix "$task_oracle_root" run typecheck
```

Expected: 외부 평가 `9/9` PASS, 공개 테스트 `6/6` PASS, typecheck 종료 코드 `0`.

- [ ] **Step 7: 추적되는 원본이 의도적인 RED 기준을 유지하는지 확인**

Run:

```bash
git diff --exit-code HEAD -- benchmarks/fixtures/booking-scheduler
npm --prefix benchmarks/fixtures/booking-scheduler test
npm --prefix benchmarks/fixtures/booking-scheduler run typecheck
npm run evaluate:task-001 -- --candidate benchmarks/fixtures/booking-scheduler
```

Expected: 원본 fixture diff가 없고, 공개 테스트와 typecheck는 PASS, 외부 평가는 인접 예약 2개 때문에 종료 코드 `1`.

- [ ] **Step 8: 후보 코드가 평가 과정에서 바뀌지 않았는지 확인**

Run:

```bash
git diff --check
git status --short benchmarks/fixtures/booking-scheduler
```

Expected: fixture에는 Task 2에서 생긴 변경이 없음.

- [ ] **Step 9: Task 2 변경 커밋**

```bash
git add package.json benchmarks/evaluators/booking-scheduler/TASK-001
git commit -m "test: add task 001 external evaluator"
```

---

### Task 3: Study와 Run 기록

**Files:**
- Modify: `experiments/README.md`
- Delete: `experiments/templates/experiment.yaml`
- Create: `experiments/templates/study.yaml`
- Create: `experiments/templates/run.md`
- Create: `experiments/templates/evaluation.yaml`
- Modify: `experiments/templates/report.md`
- Create: `experiments/STUDY-0001/study.yaml`
- Create: `experiments/STUDY-0001/runs/RUN-0001/run.md`
- Create: `experiments/STUDY-0001/runs/RUN-0001/prompt.md`
- Create: `experiments/STUDY-0001/runs/RUN-0001/evaluation.yaml`

**Interfaces:**
- Consumes: 확정된 Study/Condition/Task/Run 식별자와 고정 프롬프트
- Produces: 실행 전에 작성 가능한 Study 정의, Run 관찰 양식, 평가 상태 파일

- [ ] **Step 1: 실험 안내를 Study/Run 구조로 교체**

Replace `experiments/README.md` with:

````markdown
# 연구 기록

이 디렉터리에는 재현 가능한 Study와 그 안의 Run 기록을 저장한다.

```text
experiments/STUDY-0001/
├── study.yaml
└── runs/
    └── RUN-0001/
        ├── run.md
        ├── prompt.md
        ├── final-response.md
        ├── evaluation.yaml
        └── diff.patch
```

- `study.yaml`: 연구 질문, 조건, 과제, 실행 목록
- `run.md`: 실행 전 예상, 사실 기반 행동 기록, 해석
- `prompt.md`: 관찰 대상 Agent에게 전달한 정확한 요청
- `final-response.md`: Agent의 최종 응답
- `evaluation.yaml`: 자동 평가와 수동 검토 결과
- `diff.patch`: 시작 커밋을 기준으로 한 최종 변경

`final-response.md`와 `diff.patch`는 Agent 실행이 끝난 뒤 실제 결과로 생성한다. 빈 결과 파일을 미리 만들지 않는다.
````

- [ ] **Step 2: 기존 단일 Experiment 템플릿을 Study 템플릿으로 교체**

Delete `experiments/templates/experiment.yaml`.

Create `experiments/templates/study.yaml`:

```yaml
id: STUDY-ID
title: 연구 제목
research_question: 연구 질문
task:
  id: TASK-ID
fixture:
  name: fixture-name
  source_commit: required-before-run
condition:
  id: condition-id
  agent:
    label: agent-label
    model: unknown
    reasoning_effort: unknown
    harness: unknown
    plugins: unknown
    skills: unknown
runs:
  - RUN-ID
```

- [ ] **Step 3: Run 템플릿 작성**

Create `experiments/templates/run.md`:

```markdown
---
study_id: STUDY-ID
run_id: RUN-ID
date: run-date
agent:
  label: agent-label
  model: unknown
  reasoning_effort: unknown
  harness: unknown
  plugins: unknown
  skills: unknown
fixture:
  name: fixture-name
  source_commit: required-before-run
  workspace_start_commit: required-before-run
task:
  id: TASK-ID
source_task:
  id: required-after-task-creation
  url: required-after-task-creation
human_interventions: 0
contaminated: false
---

# 실행 전 기록

## 연구 질문

## 예상하는 행동 순서

## 특히 관찰할 행동

## 이 실행으로 결론 내릴 수 없는 것

# 사실 기반 행동 기록

행동 유형은 `inspect`, `test`, `edit`, `command`, `communicate` 중 하나로 기록한다.

| 순서 | 행동 유형 | 대상 | 관찰된 결과 |
|---:|---|---|---|

# 사람 개입 기록

| 순서 | 시점 또는 행동 순서 | 이유 | 전달 내용 | 오염 여부 |
|---:|---|---|---|---|

# 실행 결과

## Agent가 보고한 검증

## 평가 Agent가 독립적으로 재실행한 검증

# 해석

## 유용해 보였던 행동

## 불필요하거나 위험해 보였던 행동

## 실패 후 복구 방식

## 예상과 달랐던 점

## 한계

## 다음 질문
```

- [ ] **Step 4: 평가 템플릿 작성**

Create `experiments/templates/evaluation.yaml`:

```yaml
status: not_run
public_tests: not_run
typecheck: not_run
external_evaluation: not_run
regression_test:
  added: unknown
  quality: not_reviewed
diff:
  files_changed: unknown
  lines_added: unknown
  lines_deleted: unknown
  review: not_reviewed
human_intervention:
  count: 0
  details: []
contaminated: false
final_result: not_run
```

- [ ] **Step 5: 보고서 템플릿을 한국어 Study 용어로 교체**

Replace `experiments/templates/report.md` with:

```markdown
# STUDY-ID 연구 보고서

## 연구 질문

## 가설 또는 실행 전 예상

## 설정

### 과제

### 조건

### 환경

## 실행 결과

## 관찰

## 해석

## 한계

## 후속 질문

## 다음 연구
```

- [ ] **Step 6: `STUDY-0001` 정의 작성**

Create `experiments/STUDY-0001/study.yaml`:

```yaml
id: STUDY-0001
title: 하나의 Codex 에이전트가 작은 예약 경계 버그를 해결하는 과정 관찰
research_question: >-
  하나의 고정된 Codex 에이전트는 작은 TypeScript 버그를 어떻게 조사하고
  수정하며, 그 과정에서 어떤 관찰 가능한 행동을 기록할 가치가 있는가?
task:
  id: TASK-001
fixture:
  name: booking-scheduler
  source_commit: required-before-run
condition:
  id: codex-current-config-v0
  agent:
    label: codex-current-config-v0
    model: unknown
    reasoning_effort: unknown
    harness: Codex desktop
    plugins: unknown
    skills: unknown
runs:
  - RUN-0001
```

- [ ] **Step 7: `RUN-0001` 실행 전 관찰 기록 작성**

Create `experiments/STUDY-0001/runs/RUN-0001/run.md`:

```markdown
---
study_id: STUDY-0001
run_id: RUN-0001
date: 2026-08-20
agent:
  label: codex-current-config-v0
  model: unknown
  reasoning_effort: unknown
  harness: Codex desktop
  plugins: unknown
  skills: unknown
fixture:
  name: booking-scheduler
  source_commit: required-before-run
  workspace_start_commit: required-before-run
task:
  id: TASK-001
source_task:
  id: required-after-task-creation
  url: required-after-task-creation
human_interventions: 0
contaminated: false
---

# 실행 전 기록

## 연구 질문

하나의 고정된 Codex 에이전트는 작은 TypeScript 버그를 어떻게 조사하고 수정하며, 그 과정에서 어떤 관찰 가능한 행동을 기록할 가치가 있는가?

## 예상하는 행동 순서

Agent가 패키지 스크립트와 기존 테스트를 확인하고 현재 테스트를 실행한 뒤, 예약 서비스와 시간 구간 로직을 탐색하고 회귀 테스트와 구현 수정을 추가할 것으로 예상한다.

## 특히 관찰할 행동

- 기존 테스트를 언제 처음 실행하는가?
- 사용자 제보를 재현하는 테스트를 수정 전과 수정 후 중 언제 작성하는가?
- 서비스와 시간 구간 로직 중 어느 경계를 먼저 조사하는가?
- 실패한 테스트 또는 명령 이후 행동을 어떻게 바꾸는가?
- 어떤 근거로 완료를 선언하는가?

## 이 실행으로 결론 내릴 수 없는 것

이 한 번의 실행만으로 Codex의 일반적인 행동, 다른 Agent와의 우열, 같은 Agent의 실행 간 변동을 결론 내릴 수 없다.

# 사실 기반 행동 기록

행동 유형은 `inspect`, `test`, `edit`, `command`, `communicate` 중 하나로 기록한다.

| 순서 | 행동 유형 | 대상 | 관찰된 결과 |
|---:|---|---|---|

# 사람 개입 기록

| 순서 | 시점 또는 행동 순서 | 이유 | 전달 내용 | 오염 여부 |
|---:|---|---|---|---|

# 실행 결과

## Agent가 보고한 검증

## 평가 Agent가 독립적으로 재실행한 검증

# 해석

## 유용해 보였던 행동

## 불필요하거나 위험해 보였던 행동

## 실패 후 복구 방식

## 예상과 달랐던 점

## 한계

## 다음 질문
```

- [ ] **Step 8: 확정된 프롬프트 저장**

Create `experiments/STUDY-0001/runs/RUN-0001/prompt.md`:

```markdown
예약 생성 기능에 버그가 있습니다.

기존 예약이 10:00에 끝나고 새로운 예약이 10:00에 시작하면
두 예약의 시간이 실제로 겹치지 않는데도 중복 예약 오류가 발생합니다.

원인을 조사하고 문제를 수정해 주세요.
재발을 방지할 수 있는 테스트도 추가해 주세요.
기존의 실제 중복 예약 방지 동작은 유지되어야 합니다.
```

- [ ] **Step 9: 실행 전 평가 상태 작성**

Create `experiments/STUDY-0001/runs/RUN-0001/evaluation.yaml`:

```yaml
status: not_run
public_tests: not_run
typecheck: not_run
external_evaluation: not_run
regression_test:
  added: unknown
  quality: not_reviewed
diff:
  files_changed: unknown
  lines_added: unknown
  lines_deleted: unknown
  review: not_reviewed
human_intervention:
  count: 0
  details: []
contaminated: false
final_result: not_run
```

- [ ] **Step 10: 기록 구조를 기계적으로 확인**

Run:

```bash
node -e 'const fs=require("fs"); const required=["experiments/STUDY-0001/study.yaml","experiments/STUDY-0001/runs/RUN-0001/run.md","experiments/STUDY-0001/runs/RUN-0001/prompt.md","experiments/STUDY-0001/runs/RUN-0001/evaluation.yaml"]; for(const file of required){if(!fs.existsSync(file)) throw new Error(`missing ${file}`)} const prompt=fs.readFileSync(required[2],"utf8"); if(!prompt.includes("재발을 방지할 수 있는 테스트도 추가해 주세요.")) throw new Error("prompt mismatch"); console.log("STUDY-0001 records verified")'
```

Expected: `STUDY-0001 records verified`.

- [ ] **Step 11: Task 3 변경 커밋**

```bash
git add experiments
git commit -m "docs: add first study observation records"
```

---

### Task 4: 실행 격리, Runbook, 종합 검증

**Files:**
- Modify: `.gitignore`
- Create: `docs/runbooks/task-001-run.md`
- Modify: `README.md`
- Modify at execution time: `experiments/STUDY-0001/runs/RUN-0001/run.md`
- Modify at execution time: `experiments/STUDY-0001/runs/RUN-0001/evaluation.yaml`
- Ignored runtime output: `runs/workspaces/STUDY-0001/RUN-0001/booking-scheduler/`

**Interfaces:**
- Consumes: 추적되는 고장 난 fixture, 외부 평가 명령, Study/Run 기록
- Produces: 독립 Git 저장소로 된 관찰 대상 작업 공간과 사람이 따라 할 실행 절차

- [ ] **Step 1: 실행 작업 공간을 Git에서 제외**

Append to `.gitignore` after the existing `runs/raw` rules:

```gitignore
runs/workspaces/*
```

- [ ] **Step 2: 실행 Runbook 작성**

Create `docs/runbooks/task-001-run.md` with these sections and exact commands:

````markdown
# TASK-001 실행 안내

## 1. 사전 조건

- Agent Lab 작업 트리가 깨끗해야 한다.
- `booking-scheduler`의 공개 테스트와 타입 검사가 통과해야 한다.
- 외부 평가는 인접 예약 사례 2개 때문에 실패해야 한다.

## 2. 실행용 독립 저장소 생성

Agent Lab 루트에서 실행한다.

```bash
task_fixture_commit=$(git log -1 --format=%H -- benchmarks/fixtures/booking-scheduler)
task_run_root="$PWD/runs/workspaces/STUDY-0001/RUN-0001/booking-scheduler"
test ! -e "$task_run_root"
mkdir -p "$task_run_root"
git archive "$task_fixture_commit":benchmarks/fixtures/booking-scheduler | tar -x -C "$task_run_root"
git -C "$task_run_root" init
git -C "$task_run_root" add .
git -C "$task_run_root" -c user.name="Agent Lab" -c user.email="agent-lab@example.invalid" commit -m "baseline: TASK-001 broken state"
npm --prefix "$task_run_root" ci
npm --prefix "$task_run_root" test
npm --prefix "$task_run_root" run typecheck
git -C "$task_run_root" rev-parse HEAD
```

마지막에 출력된 SHA를 `run.md`의 `fixture.workspace_start_commit`에 기록한다. `task_fixture_commit` 값은 `study.yaml`과 `run.md`의 `fixture.source_commit`에 기록한다.

## 3. 새 Codex 작업 생성

1. `runs/workspaces/STUDY-0001/RUN-0001/booking-scheduler` 폴더만 로컬 프로젝트로 연다.
2. 화면에 표시되는 Model, reasoning effort, plugin과 skill 정보를 `study.yaml`과 `run.md`에 기록한다.
3. 새 작업의 task ID와 URL을 `run.md`의 `source_task.id`, `source_task.url`에 기록한다.
4. `prompt.md`의 본문만 새 작업에 전달한다.
5. 구현 힌트, 파일 위치, 테스트 작성 순서를 추가로 알려주지 않는다.
6. 권한과 환경 문제 외에는 개입하지 않는다.

## 4. 완료 즉시 결과 고정

Agent가 완료를 선언하면 추가 요청을 보내지 않는다.

```bash
task_run_root="$PWD/runs/workspaces/STUDY-0001/RUN-0001/booking-scheduler"
task_results_root="$PWD/experiments/STUDY-0001/runs/RUN-0001"
task_start_commit=$(git -C "$task_run_root" rev-list --max-parents=0 HEAD)
git -C "$task_run_root" add -N .
git -C "$task_run_root" diff --binary "$task_start_commit" --output="$task_results_root/diff.patch"
git -C "$task_run_root" diff --stat "$task_start_commit"
```

`git add -N .`은 새 파일의 내용도 diff에 포함하기 위한 intent-to-add 표시이며 작업 파일을 수정하지 않는다. Agent의 최종 응답은 `final-response.md`에 그대로 저장한다.

## 5. 독립 평가

```bash
task_run_root="$PWD/runs/workspaces/STUDY-0001/RUN-0001/booking-scheduler"
npm --prefix "$task_run_root" test
npm --prefix "$task_run_root" run typecheck
npm run evaluate:task-001 -- --candidate "$task_run_root"
```

결과를 `evaluation.yaml`에 기록하고 다음 항목을 수동 검토한다.

- 사용자 제보를 재현하는 회귀 테스트를 추가했는가?
- 테스트와 구현이 특정 시각 `10:00`에만 맞춰져 있지 않은가?
- 실제 중복 예약 방지 동작을 유지하는가?
- 관련 없는 파일이나 지나치게 많은 코드를 수정하지 않았는가?
- Agent가 보고한 검증과 평가 Agent가 독립 실행한 검증을 구분해 기록했는가?

외부 평가가 실패해도 같은 Agent 작업을 다시 열지 않는다.

## 6. 오염 판단

다음 중 하나라도 발생하면 `contaminated: true`로 기록한다.

- Agent가 실행 공간 밖의 평가기, 정답 패치 또는 설계 문서를 읽었다.
- 사람이 결함 위치나 수정 방법에 관한 힌트를 제공했다.
- 실행 중 Agent 설정을 변경했다.
- 실제 시작 상태가 사전 검증한 상태 또는 기록한 시작 커밋과 다르다.

권한 승인이나 환경 복구도 사람 개입 표에 시점, 이유, 전달 내용을 기록하되 자동으로 오염으로 판정하지 않는다. 오염된 Trace는 학습 자료로 남길 수 있지만 정식 연구 결과에는 포함하지 않는다.

## 7. 관찰 기록 작성

새 Codex 작업에 표시된 메시지, 명령, 파일 읽기·수정, 테스트 출력만 근거로 `run.md`의 사실 기반 행동 표를 순서대로 작성한다. 행동 유형은 `inspect`, `test`, `edit`, `command`, `communicate` 중 하나를 사용한다. 숨겨진 사고 과정을 추정하거나 제공되지 않은 정확한 시간과 token 수를 만들어내지 않는다.

사실 표를 먼저 완성한 뒤 별도 해석 절에 유용했던 행동, 위험하거나 불필요했던 행동, 실패 후 복구, 예상과 달랐던 점, 한계, 다음 질문을 작성한다. 사람 개입은 사실 표와 별도의 사람 개입 표에도 남긴다.
````

- [ ] **Step 3: Root README에 다음 단계 링크 추가**

Add after the existing research plan and fixture guide paragraph:

```markdown
Task 001의 상세 기준은 [에이전트 관찰 설계](docs/superpowers/specs/2026-08-20-task-001-agent-observation-design.md), 구현 순서는 [구현 계획](docs/superpowers/plans/2026-08-20-task-001-agent-observation.md), 실제 실행 절차는 [실행 안내](docs/runbooks/task-001-run.md)를 참고한다.
```

- [ ] **Step 4: 추적되는 연구 도구의 정적 검증**

Run:

```bash
git add -N docs/runbooks/task-001-run.md
git diff --check
node -e 'const fs=require("fs"),path=require("path"); const files=["README.md","docs/research-plan.md","benchmarks/fixtures/README.md","docs/runbooks/task-001-run.md"]; let bad=[]; for(const file of files){const data=fs.readFileSync(file,"utf8"); for(const match of data.matchAll(/\[[^\]]+\]\(([^)#]+)(?:#[^)]+)?\)/g)){const target=match[1]; if(!target.includes(":")){const resolved=path.resolve(path.dirname(file),target); if(!fs.existsSync(resolved)) bad.push(`${file} -> ${target}`)}}} if(bad.length){console.error(bad.join("\n"));process.exit(1)} console.log("all local Markdown links resolve")'
```

Expected: no whitespace errors and `all local Markdown links resolve`.

- [ ] **Step 5: 고장 난 원본 픽스처의 기준 상태 재확인**

Run:

```bash
npm --prefix benchmarks/fixtures/booking-scheduler test
npm --prefix benchmarks/fixtures/booking-scheduler run typecheck
npm run evaluate:task-001 -- --candidate benchmarks/fixtures/booking-scheduler
```

Expected: public tests `6/6` PASS, typecheck exit `0`, external evaluator exit `1` with exactly the two adjacent-booking failures.

- [ ] **Step 6: 임시 복사본에서 Oracle 정상 상태를 다시 증명**

Run:

```bash
task_oracle_parent=$(mktemp -d)
task_oracle_root="$task_oracle_parent/booking-scheduler"
task_oracle_patch="$PWD/benchmarks/evaluators/booking-scheduler/TASK-001/oracle.patch"
mkdir "$task_oracle_root"
git archive HEAD:benchmarks/fixtures/booking-scheduler | tar -x -C "$task_oracle_root"
git -C "$task_oracle_root" init
git -C "$task_oracle_root" apply "$task_oracle_patch"
npm --prefix "$task_oracle_root" ci
npm run evaluate:task-001 -- --candidate "$task_oracle_root"
npm --prefix "$task_oracle_root" test
npm --prefix "$task_oracle_root" run typecheck
git diff --exit-code HEAD -- benchmarks/fixtures/booking-scheduler
```

Expected: 임시 oracle 상태에서 all 9 external cases PASS, public tests PASS, typecheck PASS, 추적되는 원본 fixture에는 diff가 없음.

- [ ] **Step 7: 실행용 독립 저장소를 준비하고 격리를 검증**

Run the commands in Runbook section 2, then run:

```bash
task_run_root="$PWD/runs/workspaces/STUDY-0001/RUN-0001/booking-scheduler"
find "$task_run_root" -path "$task_run_root/.git" -prune -o -type f -print | sort
if find "$task_run_root" -path "$task_run_root/.git" -prune -o -type f -print | rg 'evaluator|oracle|superpowers|research-plan'; then exit 1; else echo "execution workspace is isolated"; fi
git -C "$task_run_root" status --short
```

Expected: only fixture source, public tests, package files and fixture README are listed; `execution workspace is isolated`; nested Git status is clean.

- [ ] **Step 8: 실제 fixture와 workspace 커밋 식별자를 기록**

Run:

```bash
git log -1 --format=%H -- benchmarks/fixtures/booking-scheduler
git -C runs/workspaces/STUDY-0001/RUN-0001/booking-scheduler rev-parse HEAD
```

Replace `fixture.source_commit: required-before-run` in both `experiments/STUDY-0001/study.yaml` and `experiments/STUDY-0001/runs/RUN-0001/run.md` with the first SHA. Replace `fixture.workspace_start_commit: required-before-run` in `run.md` with the second SHA. Leave `source_task.id` and `source_task.url` as `required-after-task-creation` until the user creates the separate Codex task.

- [ ] **Step 9: 최종 추적 상태 확인**

Run:

```bash
git diff --check
git status --short
```

Expected: `.gitignore`, `README.md`, `docs/runbooks/task-001-run.md`, `study.yaml`의 fixture commit, `run.md`의 두 commit 필드만 변경되어 있고, 무시된 `runs/workspaces/`는 status에 나타나지 않음.

- [ ] **Step 10: Task 4 변경 커밋**

```bash
git add .gitignore README.md docs/runbooks/task-001-run.md experiments/STUDY-0001/study.yaml experiments/STUDY-0001/runs/RUN-0001/run.md
git commit -m "docs: add task 001 execution runbook"
```

---

## Implementation Exit State

계획 실행이 끝나면 저장소에는 검증된 고장 난 fixture, 외부 평가기, oracle patch, Study/Run 기록, 고정 프롬프트, 실행 Runbook이 존재한다. `runs/workspaces/STUDY-0001/RUN-0001/booking-scheduler`에는 깨끗한 독립 Git 저장소가 준비되지만, 관찰 대상 Codex 작업은 아직 시작하지 않는다.

사용자가 별도 Codex 작업을 생성한 뒤 `source_task_id`, `source_task_url`, 실제 Agent 설정을 기록한다. 해당 작업이 완료되면 `final-response.md`, `diff.patch`, 최종 `evaluation.yaml`, 사실 기반 행동 기록과 해석을 작성한다.
