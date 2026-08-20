export interface Booking {
  id: string;
  roomId: string;
  startMinute: number;
  endMinute: number;
}

export type CreateBookingInput = Booking;
