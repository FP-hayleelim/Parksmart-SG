import type { Request, Response } from 'express';
import { Carpark, EVCharger } from '../src/types/index.ts';
import { calculateDistanceMeters } from '../src/utils/geo.ts';
import { matchCarparkRateDefinition } from '../src/data/carparkRates.ts';
import { calculateParkingCost } from '../src/utils/rateCalculator.ts';
import { assignBadgesAndSort } from '../src/utils/sorter.ts';
import { fetchEVChargersNearby } from './ev.ts';

// 1-minute LTA Carpark cache
interface CarparkCacheEntry {
  timestamp: number;
  data: any[];
}
let carparkCache: CarparkCacheEntry | null = null;
const CACHE_TTL = 60 * 1000;

export default async function carparksHandler(req: Request, res: Response) {
  const latStr = req.query.lat as string;
  const lngStr = req.query.lng as string;
  const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const arrivalTime = (req.query.time as string) || '09:30';
  const durationHours = parseFloat(req.query.duration as string) || 2;
  const needEV = req.query.ev === 'true' || req.query.ev === '1';
  const radiusMeters = parseInt(req.query.radius as string, 10) || 1000; // Default 1km (1000m), can be 2000m

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  // Coordinates are strictly required for destination search
  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({
      error: 'Valid lat and lng coordinates are required for destination search',
      carparks: []
    });
  }

  const ltaKey = process.env.LTA_ACCOUNT_KEY;

  if (!ltaKey) {
    return res.status(500).json({
      error: 'LTA_ACCOUNT_KEY is not configured on the server',
      carparks: [],
      source: 'unconfigured'
    });
  }

  try {
    let rawCarparks: any[] = [];
    const now = Date.now();

    if (carparkCache && (now - carparkCache.timestamp) < CACHE_TTL) {
      rawCarparks = carparkCache.data;
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const resp = await fetch('https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2', {
        signal: controller.signal,
        headers: {
          'AccountKey': ltaKey,
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        throw new Error(`LTA DataMall responded with ${resp.status}: ${resp.statusText}`);
      }

      const json = await resp.json();
      if (json && Array.isArray(json.value)) {
        rawCarparks = json.value;
        carparkCache = { timestamp: now, data: rawCarparks };
      }
    }

    // 1. Filter LotType === 'C' (Cars only) and validate location coordinates
    const carLots = rawCarparks.filter(item => item.LotType === 'C' && item.Location);

    // 2. Compute straight-line distance to destination and filter within radiusMeters (e.g. 1000m or 2000m)
    const withinRadius: any[] = [];
    for (const item of carLots) {
      const parts = item.Location.trim().split(/\s+/);
      if (parts.length >= 2) {
        const cLat = parseFloat(parts[0]);
        const cLng = parseFloat(parts[1]);
        if (!isNaN(cLat) && !isNaN(cLng)) {
          const distMeters = calculateDistanceMeters(lat, lng, cLat, cLng);
          if (distMeters <= radiusMeters) {
            withinRadius.push({
              ...item,
              cLat,
              cLng,
              distMeters
            });
          }
        }
      }
    }

    if (withinRadius.length === 0) {
      return res.json({
        carparks: [],
        source: 'lta_live',
        radiusMeters,
        count: 0
      });
    }

    // Fetch nearby EV chargers to link chargers within 100m of car parks
    const nearbyEVs = await fetchEVChargersNearby(lat, lng, radiusMeters + 200);

    const parsedList: Carpark[] = [];
    const nowTimeString = new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false });

    for (const item of withinRadius) {
      const name = item.Development || `Car Park ${item.CarParkID}`;

      // Link EV chargers within 100m
      const linkedEVs: EVCharger[] = [];
      for (const ev of nearbyEVs) {
        if (ev.distanceMeters !== undefined) {
          const evDistToCarpark = calculateDistanceMeters(item.cLat, item.cLng, lat, lng);
          if (Math.abs(ev.distanceMeters - item.distMeters) <= 100) {
            linkedEVs.push(ev);
          }
        }
      }

      // Rates: for car parks without a matching rate in the dataset, show "Rate unavailable"
      // instead of hiding them or guessing a price.
      const rateDef = matchCarparkRateDefinition(name, item.Agency);
      let cost: number | null = null;
      let breakdown = 'Rate unavailable';
      let publishedRateText: string | undefined = undefined;
      let isApprox = false;

      if (rateDef) {
        const calc = calculateParkingCost(rateDef, dateStr, arrivalTime, durationHours);
        cost = calc.totalCostSGD;
        breakdown = calc.breakdown;
        isApprox = calc.isApproximate;
        publishedRateText = rateDef.publishedRateText.weekdays;
      }

      parsedList.push({
        id: item.CarParkID || `cp-${item.cLat}-${item.cLng}`,
        name: name,
        agency: item.Agency,
        area: item.Area,
        latitude: item.cLat,
        longitude: item.cLng,
        availableLots: Math.max(0, parseInt(item.AvailableLots, 10) || 0),
        lotType: 'C',
        distanceMeters: item.distMeters,
        distanceKm: Number((item.distMeters / 1000).toFixed(2)),
        estimatedCost: cost,
        costBreakdown: breakdown,
        publishedRateText,
        isApproximateRate: isApprox,
        evChargers: linkedEVs,
        lastUpdated: `${nowTimeString} (Live LTA DataMall)`,
        isFallback: false
      });
    }

    // Filter EV if required
    let filtered = parsedList;
    if (needEV) {
      filtered = filtered.filter(c => c.evChargers.length > 0);
    }

    const sorted = assignBadgesAndSort(filtered);

    return res.json({
      carparks: sorted,
      source: 'lta_live',
      radiusMeters,
      count: sorted.length
    });

  } catch (error: any) {
    console.error('Error fetching live LTA carparks:', error.message);
    return res.status(502).json({
      error: error.message || 'Error communicating with LTA DataMall',
      carparks: [],
      source: 'lta_error'
    });
  }
}
