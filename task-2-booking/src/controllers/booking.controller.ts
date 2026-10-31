import { createBooking } from '../services/booking.service.ts';

export async function createBookingController(body: unknown) {
    return createBooking(body);
}