export type DayType = 'weekday' | 'saturday' | 'sunday_ph';

export type RateBandType = 
  | 'first_block'
  | 'subsequent_block'
  | 'per_minute'
  | 'per_entry'
  | 'flat_hourly';

export interface RateRule {
  dayType: DayType;
  startTime: string; // "07:00"
  endTime: string;   // "17:00"
  type: RateBandType;
  blockMinutes: number; // e.g., 60, 30, 15, 1
  amountSGD: number;    // e.g., 2.40, 1.20
  isApproximate?: boolean;
}

export interface CarparkRateDefinition {
  normalisedName: string;
  name: string;
  aliases: string[];
  publishedRateText: {
    weekdays: string;
    saturday: string;
    sunday_ph: string;
  };
  rules: RateRule[];
  defaultAgency?: 'LTA' | 'HDB' | 'URA' | 'COMMERCIAL';
}

export interface EVCharger {
  id: string;
  operator: string;
  plugType: string;
  powerKW: string;
  status: 'Available' | 'In Use' | 'Operational';
  price: string;
  distanceMeters?: number;
}

export interface Carpark {
  id: string;
  name: string;
  agency?: string;
  area?: string;
  latitude: number;
  longitude: number;
  availableLots: number;
  lotType: string;
  distanceMeters: number; // Straight-line distance from destination
  distanceKm: number;
  estimatedCost: number | null; // null if rate unavailable
  costBreakdown: string;
  publishedRateText?: string;
  isApproximateRate?: boolean;
  evChargers: EVCharger[];
  lastUpdated: string;
  badge?: 'Best value' | 'Cheapest' | 'Nearest';
  isFallback?: boolean;
}

export interface SearchParams {
  destinationName: string;
  latitude: number;
  longitude: number;
  dateStr: string; // "2026-10-06"
  dateLabel: string; // "Tue, 06 Oct"
  arrivalTime: string; // "09:30"
  durationHours: number; // 2
  needEV: boolean;
  needAccessible: boolean;
}

export interface GeocodeResult {
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  postalCode?: string;
}
