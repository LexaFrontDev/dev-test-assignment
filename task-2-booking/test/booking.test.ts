import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBooking } from '../src/services/booking.service.ts';

test('два одновременных запроса не создают двойное бронирование', async () => {
    const previousNow = process.env.NOW;

    try {
        process.env.NOW = '2030-11-17T12:00:00+05:00';

        const input = {
            masterId: 'm-1',
            serviceId: 's-cut',
            start: '2030-11-18T15:00:00+05:00',
            clientPhone: '8 (701) 234-56-78',
        };

        const results = await Promise.all([createBooking(input), createBooking(input)]);

        assert.deepEqual(
            results.map((result) => result.status).sort(),
            [201, 409]
        );
    } finally {
        if (previousNow === undefined) delete process.env.NOW;
        else process.env.NOW = previousNow;
    }
});