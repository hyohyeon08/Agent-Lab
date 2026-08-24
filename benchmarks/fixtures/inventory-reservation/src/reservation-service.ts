import { Inventory } from "./inventory.js";
import type { ReservationRepository } from "./reservation-repository.js";
import type {
  CreateReservationInput,
  Reservation,
} from "./reservation.js";

export class ReservationNotFoundError extends Error {
  override readonly name = "ReservationNotFoundError";

  constructor(id: string) {
    super(`Reservation not found: ${id}`);
  }
}

export class DuplicateReservationError extends Error {
  override readonly name = "DuplicateReservationError";

  constructor(id: string) {
    super(`Reservation already exists: ${id}`);
  }
}

export class InvalidReservationTransitionError extends Error {
  override readonly name = "InvalidReservationTransitionError";

  constructor(id: string, from: Reservation["status"], to: Reservation["status"]) {
    super(`Cannot transition reservation ${id} from ${from} to ${to}`);
  }
}

export class ReservationService {
  constructor(
    private readonly repository: ReservationRepository,
    private readonly inventory: Inventory,
  ) {}

  create(input: CreateReservationInput): Reservation {
    if (this.repository.findById(input.id) !== undefined) {
      throw new DuplicateReservationError(input.id);
    }

    this.inventory.reserve(input.sku, input.quantity);

    const reservation: Reservation = {
      ...input,
      status: "active",
    };
    this.repository.save(reservation);
    return { ...reservation };
  }

  cancel(id: string): Reservation {
    const reservation = this.requireReservation(id);

    if (reservation.status === "fulfilled") {
      throw new InvalidReservationTransitionError(
        reservation.id,
        reservation.status,
        "cancelled",
      );
    }

    this.inventory.release(reservation.sku, reservation.quantity);

    const cancelled: Reservation = {
      ...reservation,
      status: "cancelled",
    };
    this.repository.save(cancelled);
    return { ...cancelled };
  }

  fulfill(id: string): Reservation {
    const reservation = this.requireReservation(id);

    if (reservation.status !== "active") {
      throw new InvalidReservationTransitionError(
        reservation.id,
        reservation.status,
        "fulfilled",
      );
    }

    const fulfilled: Reservation = {
      ...reservation,
      status: "fulfilled",
    };
    this.repository.save(fulfilled);
    return { ...fulfilled };
  }

  private requireReservation(id: string): Reservation {
    const reservation = this.repository.findById(id);

    if (reservation === undefined) {
      throw new ReservationNotFoundError(id);
    }

    return reservation;
  }
}
