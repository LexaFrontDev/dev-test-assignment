import type { ServerResponse } from 'node:http';
import { orders, branches } from '../store.ts';
import { assignments } from '../assignment.store.ts';
import { assignBranch } from '../router.ts';
import type { Assignment } from '../types.ts';
import type { ExistingAssignment } from '../services/capacity.service.ts';
import { send } from '../utils/http.ts';

export function assignOrder(orderId: string): Assignment | null {
    const order = orders.find((o) => o.id === orderId);

    if (!order) return null;

    const existing = assignments.find(
        (assignment) => assignment.orderId === orderId,
    );

    if (existing) return existing;

    const capacityAssignments: ExistingAssignment[] = assignments
        .filter((assignment) => assignment.branchId !== null)
        .map((assignment) => {
            const assignedOrder = orders.find(
                (o) => o.id === assignment.orderId,
            )!;

            return {
                branchId: assignment.branchId!,
                createdAt: assignedOrder.createdAt,
            };
        });

    const result = assignBranch(order, branches, capacityAssignments);

    assignments.push(result);

    return result;
}

export function assignOrderController(
    orderId: string,
    res: ServerResponse,
): void {
    const result = assignOrder(orderId);

    if (!result) {
        send(res, 404, { error: 'order_not_found' });
        return;
    }

    send(res, 200, result);
}