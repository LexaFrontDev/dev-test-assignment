import type { Assignment, Branch, Order } from './types.ts';
import { distanceKm } from './utils/geo.ts';
import {
  isBranchFull,
  type ExistingAssignment,
} from './services/capacity.service.ts';

export function assignBranch(
    order: Order,
    branches: Branch[],
    assignments: ExistingAssignment[] = [],
): Assignment {
  const own = branches.filter(
      (b) => b.storeId === order.storeId && b.active,
  );

  if (order.manualBranchId) {
    const manual = own.find((b) => b.id === order.manualBranchId);
    if (manual) return {orderId: order.id, branchId: manual.id, rule: 'manual'};
  }

  let selected: Branch | null = null;
  let rule: Assignment['rule'] = 'unassigned';

  if (own.length === 1) {
    selected = own[0];
    rule = 'single';
  }

  if (!selected) {
    selected = findByPickupPoint(order, own);
    if (selected) rule = 'pickup_point';
  }

  if (!selected) {
    selected = findByCity(order, own);
    if (selected) rule = 'city';
  }

  if (!selected) {
    const cityBranches = own.filter(
        (b) => normalizeCity(b.city) === normalizeCity(order.city),
    );

    const candidates = cityBranches.length > 1 ? cityBranches : own;

    selected = findNearest(order, candidates);

    if (selected) rule = 'geo';
  }

  if (!selected) return {orderId: order.id, branchId: null, rule: 'unassigned',};

  if (!isBranchFull(selected, order, assignments)) {
    return {orderId: order.id, branchId: selected.id, rule};
  }

  const available = own.filter(
      (branch) => !isBranchFull(branch, order, assignments),
  );

  const nearest = findNearest(order, available);

  if (!nearest) return {orderId: order.id, branchId: null, rule: 'unassigned'};

  return {orderId: order.id, branchId: nearest.id, rule: 'geo'};
}

function findByPickupPoint(order: Order, branches: Branch[],): Branch | null {
  if (!order.pickupPointId) return null;

  return branches.find((b) =>
      b.pickupPointIds.includes(order.pickupPointId!),
  ) ?? null;
}

function findByCity(order: Order, branches: Branch[]): Branch | null {
  const matches = branches.filter(
      (branch) =>
          normalizeCity(branch.city) === normalizeCity(order.city),
  );

  return matches.length === 1 ? matches[0] : null;
}

function normalizeCity(city: string): string {
  return city.trim().toLowerCase();
}

function findNearest(order: Order, branches: Branch[]): Branch | null {
  if (order.lat === null || order.lon === null) return null;

  let best: Branch | null = null;
  let bestDist = Infinity;

  for (const branch of branches) {
    const distance = distanceKm(order.lat, order.lon, branch.lat, branch.lon);
    if (distance < bestDist) {
      best = branch;
      bestDist = distance;
    }
  }

  return best;
}