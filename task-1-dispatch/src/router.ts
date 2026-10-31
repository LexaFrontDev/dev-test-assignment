import type { Assignment, Branch, Order } from './types.ts';
import { distanceKm } from './geo.ts';

export function assignBranch(
    order: Order,
    branches: Branch[],
): Assignment {
  const own = branches.filter(
      (b) => b.storeId === order.storeId && b.active
  );

  if (order.manualBranchId) {
    const manual = own.find((b) => b.id === order.manualBranchId);
    if (manual) {
      return { orderId: order.id, branchId: manual.id, rule: 'manual' };
    }
  }

  if (own.length === 1) {
    return { orderId: order.id, branchId: own[0].id, rule: 'single' };
  }

  const pickup = findByPickupPoint(order, own);
  if (pickup) {
    return { orderId: order.id, branchId: pickup.id, rule: 'pickup_point' };
  }

  const city = findByCity(order, own);
  if (city) {
    return { orderId: order.id, branchId: city.id, rule: 'city' };
  }

  const nearest = findNearest(order, own);
  if (nearest) {
    return { orderId: order.id, branchId: nearest.id, rule: 'geo' };
  }

  return { orderId: order.id, branchId: null, rule: 'unassigned' };
}


function findByPickupPoint(
    order: Order,
    branches: Branch[],
): Branch | null {
  if (!order.pickupPointId) return null;

  return branches.find((b) =>
      b.pickupPointIds.includes(order.pickupPointId!)
  ) ?? null;
}

function findByCity(
    order: Order,
    branches: Branch[],
): Branch | null {
  const matches = branches.filter(
      (branch) =>
          normalizeCity(branch.city) === normalizeCity(order.city)
  );

  return matches.length === 1 ? matches[0] : null;
}

function normalizeCity(city: string): string {
  return city.trim().toLowerCase();
}

function findNearest(order: Order, branches: Branch[]): Branch | null {
  if (order.lat === null || order.lon === null) return null;

  const cityBranches = branches.filter(
      (b) => normalizeCity(b.city) === normalizeCity(order.city)
  );

  const candidates = cityBranches.length > 1
      ? cityBranches
      : branches;

  let best: Branch | null = null;
  let bestDist = Infinity;

  for (const b of candidates) {
    const d = distanceKm(order.lat, order.lon, b.lat, b.lon);

    if (d < bestDist) {
      best = b;
      bestDist = d;
    }
  }

  return best;
}