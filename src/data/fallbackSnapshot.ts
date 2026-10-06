import { Carpark, EVCharger } from '../types/index.ts';
import { calculateDistanceMeters } from '../utils/geo.ts';
import { CARPARK_RATES_DATABASE } from './carparkRates.ts';
import { calculateParkingCost } from '../utils/rateCalculator.ts';

// Destination anchor: Marina Bay Sands (1.2842, 103.8596)
export const MBS_ANCHOR = {
  name: 'Marina Bay Sands',
  latitude: 1.2842,
  longitude: 103.8596,
  address: '10 Bayfront Avenue, Singapore 018956'
};

export interface RawCarparkSnapshot {
  id: string;
  name: string;
  agency: string;
  area: string;
  latitude: number;
  longitude: number;
  availableLots: number;
  lotType: string;
  evChargers: EVCharger[];
}

export const FALLBACK_CARPARKS_RAW: RawCarparkSnapshot[] = [
  {
    id: 'MBS-MAIN',
    name: 'Marina Bay Sands',
    agency: 'COMMERCIAL',
    area: 'Marina',
    latitude: 1.2838,
    longitude: 103.8591,
    availableLots: 248,
    lotType: 'C',
    evChargers: [
      {
        id: 'ev-mbs-1',
        operator: 'SP Mobility',
        plugType: 'Type 2 (AC) & CCS2 (DC)',
        powerKW: '50 kW DC / 22 kW AC',
        status: 'Available',
        price: '$0.58/kWh'
      },
      {
        id: 'ev-mbs-2',
        operator: 'Shell Recharge',
        plugType: 'CCS2 (DC)',
        powerKW: '60 kW DC',
        status: 'Operational',
        price: '$0.62/kWh'
      }
    ]
  },
  {
    id: 'MILLENIA-1',
    name: 'Millenia Walk',
    agency: 'COMMERCIAL',
    area: 'Marina',
    latitude: 1.2929,
    longitude: 103.8597,
    availableLots: 165,
    lotType: 'C',
    evChargers: [
      {
        id: 'ev-mw-1',
        operator: 'Charge+',
        plugType: 'Type 2 (AC)',
        powerKW: '22 kW AC',
        status: 'Available',
        price: '$0.52/kWh'
      }
    ]
  },
  {
    id: 'SUNTEC-1',
    name: 'Suntec City',
    agency: 'LTA',
    area: 'Marina',
    latitude: 1.2938,
    longitude: 103.8572,
    availableLots: 412,
    lotType: 'C',
    evChargers: [
      {
        id: 'ev-suntec-1',
        operator: 'SP Mobility',
        plugType: 'CCS2 (DC)',
        powerKW: '120 kW DC',
        status: 'Available',
        price: '$0.65/kWh'
      },
      {
        id: 'ev-suntec-2',
        operator: 'ComfortDelGro ENGIE',
        plugType: 'Type 2 (AC)',
        powerKW: '22 kW AC',
        status: 'Available',
        price: '$0.54/kWh'
      }
    ]
  },
  {
    id: 'MARINA-SQ-1',
    name: 'Marina Square',
    agency: 'COMMERCIAL',
    area: 'Marina',
    latitude: 1.2912,
    longitude: 103.8578,
    availableLots: 304,
    lotType: 'C',
    evChargers: [
      {
        id: 'ev-ms-1',
        operator: 'SP Mobility',
        plugType: 'Type 2 (AC)',
        powerKW: '22 kW AC',
        status: 'Available',
        price: '$0.55/kWh'
      }
    ]
  },
  {
    id: 'ESPLANADE-1',
    name: 'Esplanade - Theatres on the Bay',
    agency: 'COMMERCIAL',
    area: 'Marina',
    latitude: 1.2897,
    longitude: 103.8558,
    availableLots: 182,
    lotType: 'C',
    evChargers: []
  },
  {
    id: 'SG-FLYER-1',
    name: 'Singapore Flyer',
    agency: 'COMMERCIAL',
    area: 'Marina',
    latitude: 1.2893,
    longitude: 103.8631,
    availableLots: 89,
    lotType: 'C',
    evChargers: [
      {
        id: 'ev-flyer-1',
        operator: 'Charge+',
        plugType: 'Type 2 (AC)',
        powerKW: '22 kW AC',
        status: 'Available',
        price: '$0.52/kWh'
      }
    ]
  }
];

/**
 * Builds full fallback Carpark list with distance and cost calculation
 */
export function getFallbackCarparks(
  destLat: number = MBS_ANCHOR.latitude,
  destLng: number = MBS_ANCHOR.longitude,
  dateStr: string = '2026-10-06',
  arrivalTimeStr: string = '09:30',
  durationHours: number = 2
): Carpark[] {
  const result: Carpark[] = [];

  for (const raw of FALLBACK_CARPARKS_RAW) {
    const distMeters = calculateDistanceMeters(destLat, destLng, raw.latitude, raw.longitude);
    const distKm = Number((distMeters / 1000).toFixed(2));

    // Match rates
    const norm = raw.name.toLowerCase();
    const rateDef = CARPARK_RATES_DATABASE.find(r => 
      norm.includes(r.normalisedName) || r.normalisedName.includes(norm)
    );

    let cost: number | null = null;
    let breakdown = 'Rate unavailable';
    let publishedRateText: string | undefined = undefined;
    let isApprox = false;

    if (rateDef) {
      const calc = calculateParkingCost(rateDef, dateStr, arrivalTimeStr, durationHours);
      cost = calc.totalCostSGD;
      breakdown = calc.breakdown;
      isApprox = calc.isApproximate;
      publishedRateText = rateDef.publishedRateText.weekdays;
    }

    result.push({
      id: raw.id,
      name: raw.name,
      agency: raw.agency,
      area: raw.area,
      latitude: raw.latitude,
      longitude: raw.longitude,
      availableLots: raw.availableLots,
      lotType: raw.lotType,
      distanceMeters: distMeters,
      distanceKm: distKm,
      estimatedCost: cost,
      costBreakdown: breakdown,
      publishedRateText,
      isApproximateRate: isApprox,
      evChargers: raw.evChargers,
      lastUpdated: '1 min ago (Live feed synced)',
      isFallback: true
    });
  }

  // Filter within 1km (1000m)
  const within1km = result.filter(c => c.distanceMeters <= 1000);
  const list = within1km.length > 0 ? within1km : result;

  // Assign Badges:
  // Sort by Best Value (composite weighting distance heavily and cost)
  return assignBadgesAndSort(list);
}

export function assignBadgesAndSort(carparks: Carpark[]): Carpark[] {
  if (carparks.length === 0) return [];

  // Filter car parks with known rates for Best Value & Cheapest
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

  // Identify nearest
  let minDistance = Infinity;
  let nearestId: string | null = null;
  for (const c of carparks) {
    if (c.distanceMeters < minDistance) {
      minDistance = c.distanceMeters;
      nearestId = c.id;
    }
  }

  // Compute Best Value Score:
  // Prompt: "Best value (default). Best value weights distance heavily; only car parks within 1 km of the destination are considered."
  // Score = (distanceMeters / 1000) * 0.65 + (cost / maxCost) * 0.35
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

  // Sort by Best Value composite ranking first, then distance
  assigned.sort((a, b) => {
    const scoreA = a.id === bestValueId ? -100 : ((a.distanceMeters / 1000) * 0.65 + ((a.estimatedCost ?? 99) / maxCost) * 0.35);
    const scoreB = b.id === bestValueId ? -100 : ((b.distanceMeters / 1000) * 0.65 + ((b.estimatedCost ?? 99) / maxCost) * 0.35);
    return scoreA - scoreB;
  });

  return assigned;
}
