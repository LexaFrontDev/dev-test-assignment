import { randomUUID } from 'node:crypto';
import { masters, services, bookingRepo } from '../store.ts';
import { getSlots } from './slots.service.ts';
import { normalizeKzPhone } from './phone.service.ts';
import { TZ_OFFSET } from '../time.ts';
import { isValidDate } from '../utils/date.ts';
import type { Booking } from '../types.ts';

type Result = { status: number; body: unknown; };
type CreateBookingInput = {
    masterId: string;
    serviceId: string;
    start: string;
    clientPhone: string;
};

function isValidStart(value: string): boolean {
    const isoWithTimezone =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;

    return (
        isoWithTimezone.test(value) &&
        isValidDate(value.slice(0, 10)) &&
        Number.isFinite(Date.parse(value))
    );
}

export async function createBooking(input: unknown): Promise<Result> {
    if (
        !input ||
        typeof input !== 'object' ||
        Array.isArray(input)
    ) {
        return { status: 400, body: { error: 'invalid_body' } };
    }

    const data = input as Partial<CreateBookingInput>;

    if (
        typeof data.masterId !== 'string' ||
        typeof data.serviceId !== 'string' ||
        typeof data.start !== 'string' ||
        typeof data.clientPhone !== 'string'
    ) {
        return { status: 400, body: { error: 'invalid_parameters' } };
    }

    if (!isValidStart(data.start)) {
        return { status: 400, body: { error: 'invalid_start' } };
    }

    const clientPhone = normalizeKzPhone(data.clientPhone);

    if (!clientPhone) return { status: 400, body: { error: 'invalid_phone' } };
    const master = masters.find((item) => item.id === data.masterId);
    if (!master) return { status: 404, body: { error: 'master_not_found' } };
    const service = services.find((item) => item.id === data.serviceId);
    if (!service) return { status: 404, body: { error: 'service_not_found' } };
    if (!service.masterIds.includes(master.id)) return {status: 400, body: { error: 'master_does_not_provide_service' },};

    const startTimestamp = Date.parse(data.start);

    const [offsetHours, offsetMinutes] = TZ_OFFSET.slice(1).split(':').map(Number);
    const offsetSign = TZ_OFFSET.startsWith('-') ? -1 : 1;
    const offsetMs = offsetSign * (offsetHours * 60 + offsetMinutes) * 60_000;

    const localDateTime = new Date(startTimestamp + offsetMs);

    if (
        localDateTime.getUTCSeconds() !== 0 ||
        localDateTime.getUTCMilliseconds() !== 0
    ) {
        return { status: 409, body: { error: 'slot_unavailable' } };
    }

    const localDate = localDateTime.toISOString().slice(0, 10);
    const localTime = localDateTime.toISOString().slice(11, 16);

    return bookingRepo.withMasterLock(master.id, async () => {
        const bookings = await bookingRepo.listByMaster(master.id);
        const availableSlots = getSlots(master, service, localDate, bookings);
        if (!availableSlots.includes(localTime)) return {status: 409, body: { error: 'slot_unavailable' },};
        const endTimestamp = startTimestamp + service.durationMin * 60_000;

        const booking: Booking = {
            id: randomUUID(),
            masterId: master.id,
            serviceId: service.id,
            start: new Date(startTimestamp).toISOString(),
            end: new Date(endTimestamp).toISOString(),
            clientPhone,
            status: 'active',
        };

        await bookingRepo.insert(booking);
        return { status: 201, body: booking };
    });
}