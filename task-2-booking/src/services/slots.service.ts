
import type { Booking, Master, Service } from '../types.ts';
import { fromMinutes, overlaps, toMinutes, TZ_OFFSET, weekday } from '../time.ts';
import { now } from '../clock.ts';

export const SLOT_STEP_MIN = 15;

export function getSlots(master: Master, service: Service, date: string, bookings: Booking[]): string[] {
  const day = master.schedule[weekday(date)];
  if (!day) return [];

  const result: string[] = [];
  const end = toMinutes(day.to);

  const activeBookings = bookings.filter(
      (booking) =>
          booking.masterId === master.id &&
          booking.status === 'active'
  );

  const currentTime = now().getTime();

  for (
      let t = toMinutes(day.from);
      t + service.durationMin <= end;
      t += SLOT_STEP_MIN
  ) {
    const slot = {start: t, end: t + service.durationMin};

    const slotStart = new Date(
        `${date}T${fromMinutes(t)}${TZ_OFFSET}`
    ).getTime();

    const slotEnd = slotStart + service.durationMin * 60_000;

    const hasBreakConflict = day.breaks.some((breakTime) =>
        overlaps(slot, {
          start: toMinutes(breakTime.from),
          end: toMinutes(breakTime.to),
        })
    );

    const hasBookingConflict = activeBookings.some((booking) =>
        overlaps(
            { start: slotStart, end: slotEnd },
            {
              start: Date.parse(booking.start),
              end: Date.parse(booking.end),
            }
        )
    );

    const isFuture = slotStart > currentTime;

    if (!hasBreakConflict && !hasBookingConflict && isFuture) {
      result.push(fromMinutes(t));
    }
  }

  return result;
}
