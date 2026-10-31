import type { ServerResponse } from 'node:http';
import { branches, orders } from '../store.ts';
import { assignments } from '../assignment.store.ts';
import { getAlmatyDate } from '../services/timezone.service.ts';
import { send } from '../utils/http.ts';

export function getBranchLoad(
    branchId: string,
    date: string | null,
    res: ServerResponse,
): void {
    if (!date || !isValidDate(date)) {
        send(res, 400, { error: 'invalid_date' });
        return;
    }

    const branch = branches.find((b) => b.id === branchId);

    if (!branch) {
        send(res, 404, { error: 'branch_not_found' });
        return;
    }

    const assigned = assignments.filter((assignment) => {
        if (assignment.branchId !== branchId) return false;

        const order = orders.find((o) => o.id === assignment.orderId);

        return order && getAlmatyDate(order.createdAt) === date;
    }).length;

    send(res, 200, {
        branchId: branch.id,
        date,
        assigned,
        limit: branch.dailyLimit,
    });
}

function isValidDate(date: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

    const parsed = new Date(`${date}T00:00:00.000Z`);

    return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === date
    );
}