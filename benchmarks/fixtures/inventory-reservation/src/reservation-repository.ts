import type { Reservation } from "./reservation.js";

export interface ReservationRepository {
  findById(id: string): Reservation | undefined;
  save(reservation: Reservation): void;
}

export class InMemoryReservationRepository implements ReservationRepository {
  private readonly reservations = new Map<string, Reservation>();

  findById(id: string): Reservation | undefined {
    const reservation = this.reservations.get(id);
    return reservation === undefined ? undefined : { ...reservation };
  }

  save(reservation: Reservation): void {
    this.reservations.set(reservation.id, { ...reservation });
  }
}
