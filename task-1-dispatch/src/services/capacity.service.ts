import type { Branch, Order } from '../types.ts';
import { getAlmatyDate } from './timezone.service.ts';

export type ExistingAssignment = {
    branchId: string;
    createdAt: string;
};

export function isBranchFull(
    branch: Branch,
    order: Order,
    assignments: ExistingAssignment[],
): boolean {
    const orderDate = getAlmatyDate(order.createdAt);

    const count = assignments.filter(
        (assignment) =>
            assignment.branchId === branch.id &&
            getAlmatyDate(assignment.createdAt) === orderDate,
    ).length;

    return count >= branch.dailyLimit;
}