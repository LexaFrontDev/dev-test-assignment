import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cancelBooking } from '../src/services/booking.service.ts';
import { bookingRepo } from '../src/store.ts';
import type { Booking } from '../src/types.ts';
import { randomUUID } from 'node:crypto';

async function createTestBooking(): Promise<Booking> {
    const booking: Booking = {
        id: randomUUID(),
        masterId: 'm-1',
        serviceId: 's-cut',
        start: '2030-11-18T15:00:00.000Z',
        end: '2030-11-18T16:00:00.000Z',
        clientPhone: '+77012345678',
        status: 'active',
    };

    await bookingRepo.insert(booking);

    return booking;
}

test('несуществующее бронирование возвращает 404', async () => {
    const result = await cancelBooking('unknown-id');
    assert.equal(result.status, 404);
});

test('бронирование успешно отменяется', async () => {
    process.env.NOW = '2030-11-17T10:00:00.000Z';
    const booking = await createTestBooking();
    const result = await cancelBooking(booking.id);
    assert.equal(result.status, 200);
    assert.equal((result.body as Booking).status, 'cancelled');
});

test('повторная отмена возвращает 200', async () => {
    process.env.NOW = '2030-11-17T10:00:00.000Z';
    const booking = await createTestBooking();
    await cancelBooking(booking.id);
    const result = await cancelBooking(booking.id);
    assert.equal(result.status, 200);
    assert.equal((result.body as Booking).status, 'cancelled');
});

test('отмена менее чем за два часа запрещена', async () => {
    process.env.NOW = '2030-11-18T13:30:00.000Z';
    const booking = await createTestBooking();
    const result = await cancelBooking(booking.id);
    assert.equal(result.status, 409);
    assert.deepEqual(result.body, { error: 'too_late' });
});