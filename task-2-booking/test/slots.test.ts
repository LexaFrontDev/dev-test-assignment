import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSlots } from '../src/services/slots.service.ts';
import { overlaps, toMinutes } from '../src/time.ts';
import type { Booking, Master, Service } from '../src/types.ts';

const day = {
  from: '10:00',
  to: '13:00',
  breaks: [],
};

const master: Master = {
  id: 'm-1',
  name: 'Тест',
  schedule: {
    mon: day,
    tue: day,
    wed: day,
    thu: day,
    fri: day,
    sat: null,
    sun: null,
  },
};

const cut: Service = {
  id: 's-cut',
  name: 'Стрижка',
  durationMin: 60,
  masterIds: ['m-1'],
};

const range = (from: string, to: string) => ({
  start: toMinutes(from),
  end: toMinutes(to),
});

function createBooking(
    start: string,
    end: string,
    status: 'active' | 'cancelled' = 'active'
): Booking {
  return {
    id: 'b-1',
    masterId: 'm-1',
    serviceId: 's-cut',
    start: `2030-11-18T${start}:00+05:00`,
    end: `2030-11-18T${end}:00+05:00`,
    clientPhone: '+77012345678',
    status,
  };
}

process.env.NOW = '2030-11-17T12:00:00+05:00';

test('overlaps: пересекающиеся интервалы', () => {
  assert.equal(
      overlaps(range('10:00', '11:00'), range('10:30', '11:30')),
      true
  );
});

test('overlaps: запись сразу после другой не пересекается', () => {
  assert.equal(
      overlaps(range('10:00', '11:00'), range('11:00', '12:00')),
      false
  );
});

test('getSlots: свободный день', () => {
  const slots = getSlots(master, cut, '2030-11-18', []);

  assert.deepEqual(slots, [
    '10:00', '10:15', '10:30', '10:45',
    '11:00', '11:15', '11:30', '11:45',
    '12:00',
  ]);
});

test('getSlots: выходной', () => {
  assert.deepEqual(
      getSlots(master, cut, '2030-11-23', []),
      []
  );
});

test('getSlots: слот не пересекает перерыв', () => {
  const masterWithBreak: Master = {
    ...master,
    schedule: {
      ...master.schedule,
      mon: {
        ...day,
        breaks: [{ from: '11:00', to: '11:30' }],
      },
    },
  };

  const slots = getSlots(masterWithBreak, cut, '2030-11-18', []);

  assert.deepEqual(slots, ['10:00', '11:30', '11:45', '12:00']);
});

test('getSlots: занятое время не выдаётся', () => {
  const bookings = [createBooking('11:00', '12:00')];
  const slots = getSlots(master, cut, '2030-11-18', bookings);

  assert.deepEqual(slots, ['10:00', '12:00',]);
});

test('getSlots: отменённые записи не мешают', () => {
  const bookings = [
    createBooking('11:00', '12:00', 'cancelled'),
  ];
  const slots = getSlots(master, cut, '2030-11-18', []);
  const slotsWithCancelledBooking = getSlots(master, cut, '2030-11-18', bookings);
  assert.deepEqual(slotsWithCancelledBooking, slots);
});

test('getSlots: прошедшее время не выдаётся', () => {
  const previousNow = process.env.NOW;

  try {
    process.env.NOW = '2030-11-18T10:30:00+05:00';
    const slots = getSlots(master, cut, '2030-11-18', []);
    assert.deepEqual(slots, ['10:45', '11:00', '11:15', '11:30', '11:45', '12:00',]);
  } finally {
    if (previousNow === undefined) {
      delete process.env.NOW;
    } else {
      process.env.NOW = previousNow;
    }
  }
});