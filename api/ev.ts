import type { Request, Response } from 'express';
import { EVCharger } from '../src/types/index.ts';
import { calculateDistanceMeters } from '../src/utils/geo.ts';

// 1-minute cache
interface CacheEntry {
  timestamp: number;
  data: any[];
}
let evCache: CacheEntry | null = null;
const CACHE_TTL = 60 * 1000;

// Curated Singapore EV chargers snapshot
const VERIFIED_SG_EV_CHARGERS: Array<{
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  operator: string;
  plugType: string;
  powerKW: string;
  status: 'Available' | 'In Use' | 'Operational';
  price: string;
}> = [
  {
    id: 'ev-mbs-1',
    name: 'Marina Bay Sands B3',
    latitude: 1.2838,
    longitude: 103.8591,
    operator: 'SP Mobility',
    plugType: 'Type 2 (AC) & CCS2 (DC)',
    powerKW: '50 kW DC / 22 kW AC',
    status: 'Available',
    price: '$0.58/kWh'
  },
  {
    id: 'ev-mbs-2',
    name: 'Marina Bay Sands B4',
    latitude: 1.2840,
    longitude: 103.8593,
    operator: 'Shell Recharge',
    plugType: 'CCS2 (DC)',
    powerKW: '60 kW DC',
    status: 'Operational',
    price: '$0.62/kWh'
  },
  {
    id: 'ev-mw-1',
    name: 'Millenia Walk Basement',
    latitude: 1.2929,
    longitude: 103.8597,
    operator: 'Charge+',
    plugType: 'Type 2 (AC)',
    powerKW: '22 kW AC',
    status: 'Available',
    price: '$0.52/kWh'
  },
  {
    id: 'ev-suntec-1',
    name: 'Suntec City B1 Yellow Zone',
    latitude: 1.2938,
    longitude: 103.8572,
    operator: 'SP Mobility',
    plugType: 'CCS2 (DC)',
    powerKW: '120 kW DC Fast',
    status: 'Available',
    price: '$0.65/kWh'
  },
  {
    id: 'ev-suntec-2',
    name: 'Suntec City Tower 2',
    latitude: 1.2941,
    longitude: 103.8575,
    operator: 'ComfortDelGro ENGIE',
    plugType: 'Type 2 (AC)',
    powerKW: '22 kW AC',
    status: 'Available',
    price: '$0.54/kWh'
  },
  {
    id: 'ev-ms-1',
    name: 'Marina Square B1 Green Zone',
    latitude: 1.2912,
    longitude: 103.8578,
    operator: 'SP Mobility',
    plugType: 'Type 2 (AC)',
    powerKW: '22 kW AC',
    status: 'Available',
    price: '$0.55/kWh'
  },
  {
    id: 'ev-flyer-1',
    name: 'Singapore Flyer Multi-Storey',
    latitude: 1.2893,
    longitude: 103.8631,
    operator: 'Charge+',
    plugType: 'Type 2 (AC)',
    powerKW: '22 kW AC',
    status: 'Available',
    price: '$0.52/kWh'
  },
  {
    id: 'ev-ion-1',
    name: 'ION Orchard B3 Car Park',
    latitude: 1.3040,
    longitude: 103.8318,
    operator: 'Shell Recharge',
    plugType: 'Type 2 & CCS2',
    powerKW: '50 kW DC',
    status: 'Available',
    price: '$0.62/kWh'
  },
  {
    id: 'ev-rc-1',
    name: 'Raffles City B2',
    latitude: 1.2939,
    longitude: 103.8532,
    operator: 'SP Mobility',
    plugType: 'CCS2 (DC)',
    powerKW: '60 kW DC',
    status: 'Available',
    price: '$0.60/kWh'
  },
  {
    id: 'ev-vivo-1',
    name: 'VivoCity B2 Yellow Zone',
    latitude: 1.2644,
    longitude: 103.8222,
    operator: 'Charge+',
    plugType: 'Type 2 & CCS2',
    powerKW: '60 kW DC',
    status: 'Available',
    price: '$0.59/kWh'
  },
  {
    id: 'ev-bugis-1',
    name: 'Bugis Junction B1',
    latitude: 1.3002,
    longitude: 103.8553,
    operator: 'SP Mobility',
    plugType: 'Type 2 (AC)',
    powerKW: '22 kW AC',
    status: 'Available',
    price: '$0.55/kWh'
  }
];

export async function fetchEVChargersNearby(lat: number, lng: number, maxRadiusMeters: number = 1000): Promise<EVCharger[]> {
  const ltaKey = process.env.LTA_ACCOUNT_KEY;

  if (ltaKey) {
    const now = Date.now();
    if (evCache && (now - evCache.timestamp) < CACHE_TTL) {
      return filterEVsByLocation(evCache.data, lat, lng, maxRadiusMeters);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const resp = await fetch('https://datamall2.mytransport.sg/ltaodataservice/EVChargingPoints', {
        signal: controller.signal,
        headers: {
          'AccountKey': ltaKey,
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const json = await resp.json();
        if (json && Array.isArray(json.value)) {
          const mapped = json.value.map((item: any, idx: number) => ({
            id: item.StationID || `ev-lta-${idx}`,
            name: item.Name || 'EV Charger',
            latitude: parseFloat(item.Latitude || item.lat),
            longitude: parseFloat(item.Longitude || item.lng),
            operator: item.Operator || 'EV Network',
            plugType: item.ConnectorType || 'Type 2 / CCS2',
            powerKW: item.PowerRating ? `${item.PowerRating} kW` : '22 kW AC',
            status: item.Status === 'Available' ? 'Available' : 'Operational',
            price: item.Price || '$0.55/kWh'
          })).filter((c: any) => !isNaN(c.latitude) && !isNaN(c.longitude));

          evCache = { timestamp: now, data: mapped };
          return filterEVsByLocation(mapped, lat, lng, maxRadiusMeters);
        }
      }
    } catch (err) {
      console.warn('EV points API failed, using fallback dataset:', err);
    }
  }

  return filterEVsByLocation(VERIFIED_SG_EV_CHARGERS, lat, lng, maxRadiusMeters);
}

function filterEVsByLocation(chargers: any[], lat: number, lng: number, maxRadiusMeters: number): EVCharger[] {
  const list: EVCharger[] = [];
  for (const c of chargers) {
    const dist = calculateDistanceMeters(lat, lng, c.latitude, c.longitude);
    if (dist <= maxRadiusMeters) {
      list.push({
        id: c.id,
        operator: c.operator,
        plugType: c.plugType,
        powerKW: c.powerKW,
        status: c.status || 'Available',
        price: c.price || '$0.55/kWh',
        distanceMeters: dist
      });
    }
  }
  return list;
}

export default async function evHandler(req: Request, res: Response) {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'Valid lat and lng query parameters required' });
  }

  const chargers = await fetchEVChargersNearby(lat, lng, 1000);
  return res.json({ chargers });
}
