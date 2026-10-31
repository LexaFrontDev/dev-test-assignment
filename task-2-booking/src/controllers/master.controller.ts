
import { masters, services, bookingRepo } from '../store.ts';
import { getSlots } from '../services/slots.service.ts';
import { isValidDate } from '../utils/date.ts';

type ControllerResponse = {
    status: number;
    body: unknown;
};

export async function getMasterSlots(
    masterId: string,
    params: URLSearchParams
): Promise<ControllerResponse> {
    const serviceId = params.get('serviceId');
    const date = params.get('date');
    if (!serviceId) return {status: 400, body: { error: 'service_id_required' }};
    if (!date) return {status: 400, body: { error: 'date_required' }};
    if (!isValidDate(date)) return {status: 400, body: { error: 'invalid_date' }};
    const master = masters.find((item) => item.id === masterId);
    if (!master) return {status: 404, body: { error: 'master_not_found' }};
    const service = services.find((item) => item.id === serviceId);
    if (!service) return {status: 404, body: { error: 'service_not_found'}};
    if (!service.masterIds.includes(master.id)) return {status: 400, body: { error: 'master_does_not_provide_service' }};

    const bookings = await bookingRepo.listByMaster(master.id);
    const slots = getSlots(master, service, date, bookings);

    return {
        status: 200,
        body: {
            masterId: master.id,
            serviceId: service.id,
            date,
            slots,
        },
    };
}
