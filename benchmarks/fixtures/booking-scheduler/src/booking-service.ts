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
