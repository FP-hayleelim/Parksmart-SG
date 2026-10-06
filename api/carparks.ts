import type { Request, Response } from 'express';
import { Carpark, EVCharger } from '../src/types/index.ts';
import { calculateDistanceMeters } from '../src/utils/geo.ts';
import { matchCarparkRateDefinition } from '../src/data/carparkRates.ts';
import { calculateParkingCost } from '../src/utils/rateCalculator.ts';
import { assignBadgesAndSort, getFallbackCarparks, MBS_ANCHOR } from '../src/data/fallbackSnapshot.ts';
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
  const dateStr = (req.query.date as string) || '2026-10-06';
  const arrivalTime = (req.query.time as string) || '09:30';
  const durationHours = parseFloat(req.query.duration as string) || 2;
  const needEV = req.query.ev === 'true' || req.query.ev === '1';

  let lat = parseFloat(latStr);
  let lng = parseFloat(lngStr);

  // If coordinates are invalid, default to Marina Bay Sands
  if (isNaN(lat) || isNaN(lng)) {
    lat = MBS_ANCHOR.latitude;
    lng = MBS_ANCHOR.longitude;
  }

  const ltaKey = process.env.LTA_ACCOUNT_KEY;

  try {
    let rawCarparks: any[] = [];
    let isLive = false;

    if (ltaKey) {
      const now = Date.now();
      if (carparkCache && (now - carparkCache.timestamp) < CACHE_TTL) {
        rawCarparks = carparkCache.data;
        isLive = true;
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
          const resp = await fetch('https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2', {
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
              rawCarparks = json.value;
              carparkCache = { timestamp: now, data: rawCarparks };
              isLive = true;
            }
          }
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          console.warn('LTA Carpark API failed or timed out:', fetchErr.message);
        }
      }
    }

    // If live API data is available from LTA
    if (isLive && rawCarparks.length > 0) {
      // 1. Filter LotType === 'C' (Cars only)
      const carLots = rawCarparks.filter(item => item.LotType === 'C' && item.Location);

      // 2. Compute distance and filter within 1 km (1000m)
      const within1km: any[] = [];
      for (const item of carLots) {
        const parts = item.Location.trim().split(/\s+/);
        if (parts.length >= 2) {
          const cLat = parseFloat(parts[0]);
          const cLng = parseFloat(parts[1]);
          if (!isNaN(cLat) && !isNaN(cLng)) {
            const distMeters = calculateDistanceMeters(lat, lng, cLat, cLng);
            if (distMeters <= 1000) {
              within1km.push({
                ...item,
                cLat,
                cLng,
                distMeters
              });
            }
          }
        }
      }

      // Fetch nearby EV chargers to link chargers within 100m of car parks
      const nearbyEVs = await fetchEVChargersNearby(lat, lng, 1200);

      const parsedList: Carpark[] = [];
      const nowTimeString = new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false });

      for (const item of within1km) {
        const name = item.Development || `Car Park ${item.CarParkID}`;

        // Link EV chargers within 100m
        const linkedEVs: EVCharger[] = [];
        for (const ev of nearbyEVs) {
          if (ev.distanceMeters !== undefined) {
            const evDistToCarpark = calculateDistanceMeters(item.cLat, item.cLng, lat, lng);
            // If charger is close to carpark (within 100m)
            if (Math.abs(ev.distanceMeters - item.distMeters) <= 100) {
              linkedEVs.push(ev);
            }
          }
        }

        // Match rates
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

      if (filtered.length > 0) {
        const sorted = assignBadgesAndSort(filtered);
        return res.json({
          carparks: sorted,
          source: 'lta_live',
          isFallback: false,
          count: sorted.length
        });
      }
    }

    // Fallback: If no LTA key, LTA error, or 0 car parks returned from LTA,
    // load saved snapshot for Marina Bay Sands or nearby anchor
    const fallbackList = getFallbackCarparks(lat, lng, dateStr, arrivalTime, durationHours);
    let finalFallback = fallbackList;
    if (needEV) {
      finalFallback = finalFallback.filter(c => c.evChargers.length > 0);
    }

    return res.json({
      carparks: finalFallback,
      source: 'saved_snapshot',
      isFallback: true,
      message: 'Showing saved data',
      count: finalFallback.length
    });

  } catch (error: any) {
    console.error('Error in carparks endpoint:', error);
    const fallbackList = getFallbackCarparks(lat, lng, dateStr, arrivalTime, durationHours);
    return res.json({
      carparks: fallbackList,
      source: 'saved_snapshot',
      isFallback: true,
      message: 'Showing saved data',
      count: fallbackList.length
    });
  }
}
