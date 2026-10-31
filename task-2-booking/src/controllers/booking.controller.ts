import {createBooking, cancelBooking} from '../services/booking.service.ts';

export async function createBookingController(body: unknown) {
    return createBooking(body);
}

export async function cancelBookingController(id: string) {
    return cancelBooking(id);
}