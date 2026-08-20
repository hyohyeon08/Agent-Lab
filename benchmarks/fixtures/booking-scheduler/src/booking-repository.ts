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
