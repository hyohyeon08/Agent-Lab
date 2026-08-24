export type ReservationStatus = "active" | "cancelled" | "fulfilled";

export interface Reservation {
  id: string;
  sku: string;
  quantity: number;
  status: ReservationStatus;
}

export interface CreateReservationInput {
  id: string;
  sku: string;
  quantity: number;
}
