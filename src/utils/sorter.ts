import { Carpark } from '../types/index.ts';

export function assignBadgesAndSort(carparks: Carpark[]): Carpark[] {
  if (carparks.length === 0) return [];

  // Car parks with available rates
  const withRates = carparks.filter(c => c.estimatedCost !== null);

  // Identify cheapest
  let minCost = Infinity;
  let cheapestId: string | null = null;
  for (const c of withRates) {
    if (c.estimatedCost !== null && c.estimatedCost < minCost) {
      minCost = c.estimatedCost;
      cheapestId = c.id;
    }
  }

  // Identify nearest (can be any car park, even if rate unavailable)
  let minDistance = Infinity;
  let nearestId: string | null = null;
  for (const c of carparks) {
    if (c.distanceMeters < minDistance) {
      minDistance = c.distanceMeters;
      nearestId = c.id;
    }
  }

  // Compute Best Value Score among car parks with rates within 1 km:
  // Best value weights distance heavily: (distanceMeters / 1000) * 0.65 + (cost / maxCost) * 0.35
  const maxCost = Math.max(...withRates.map(c => c.estimatedCost ?? 5), 10);
  let bestScore = Infinity;
  let bestValueId: string | null = null;

  for (const c of withRates) {
    if (c.distanceMeters <= 1000 && c.estimatedCost !== null) {
      const score = (c.distanceMeters / 1000) * 0.65 + (c.estimatedCost / maxCost) * 0.35;
      if (score < bestScore) {
        bestScore = score;
        bestValueId = c.id;
      }
    }
  }

  // Assign at most ONE badge per card:
  // Priority: Best value -> Cheapest -> Nearest
  const assigned = carparks.map(c => {
    let badge: 'Best value' | 'Cheapest' | 'Nearest' | undefined = undefined;
    if (c.id === bestValueId) {
      badge = 'Best value';
    } else if (c.id === cheapestId) {
      badge = 'Cheapest';
    } else if (c.id === nearestId) {
      badge = 'Nearest';
    }
    return { ...c, badge };
  });

  // Sort: Best value first, then ranked by composite score if rate available, followed by distance
  assigned.sort((a, b) => {
    if (a.id === bestValueId) return -1;
    if (b.id === bestValueId) return 1;

    const hasRateA = a.estimatedCost !== null;
    const hasRateB = b.estimatedCost !== null;

    if (hasRateA && hasRateB) {
      const scoreA = (a.distanceMeters / 1000) * 0.65 + ((a.estimatedCost ?? 99) / maxCost) * 0.35;
      const scoreB = (b.distanceMeters / 1000) * 0.65 + ((b.estimatedCost ?? 99) / maxCost) * 0.35;
      return scoreA - scoreB;
    }

    if (hasRateA && !hasRateB) return -1;
    if (!hasRateA && hasRateB) return 1;

    // Both have no rate: sort by distance
    return a.distanceMeters - b.distanceMeters;
  });

  return assigned;
}
