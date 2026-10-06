import { CarparkRateDefinition } from '../types/index.ts';

/**
 * Normalises a car park name for fuzzy matching:
 * - Lowercase
 * - Strip punctuation and non-alphanumeric chars
 * - Trim and collapse multiple spaces
 */
export function normaliseCarparkName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\b(car park|carpark|cp|singapore|the|centre|center|mall|tower|towers|building|station)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Bundled data.gov.sg LTA "Carpark Rates" (ID d_9f6056bdb6b1dfba57f063593e4f34ae)
 * Pre-parsed into structured rate rules and published text.
 */
export const CARPARK_RATES_DATABASE: CarparkRateDefinition[] = [
  {
    normalisedName: 'marina bay sands',
    name: 'Marina Bay Sands',
    aliases: ['mbs', 'shoppes at marina bay sands', 'marina bay sands hotel', 'bayfront'],
    publishedRateText: {
      weekdays: 'Mon-Thu 07:00-19:00: $8.72 for 1st hr, $2.18/subsequent 30 mins (Max $32.70/day). 19:00-07:00: $9.81/entry.',
      saturday: 'Fri-Sun & PH 07:00-19:00: $10.90 for 1st hr, $2.18/subsequent 30 mins (Max $38.15/day). 19:00-07:00: $10.90/entry.',
      sunday_ph: 'Fri-Sun & PH 07:00-19:00: $10.90 for 1st hr, $2.18/subsequent 30 mins. 19:00-07:00: $10.90/entry.'
    },
    rules: [
      // Weekday daytime
      { dayType: 'weekday', startTime: '07:00', endTime: '19:00', type: 'first_block', blockMinutes: 60, amountSGD: 8.72 },
      { dayType: 'weekday', startTime: '07:00', endTime: '19:00', type: 'subsequent_block', blockMinutes: 30, amountSGD: 2.18 },
      // Weekday evening
      { dayType: 'weekday', startTime: '19:00', endTime: '07:00', type: 'per_entry', blockMinutes: 720, amountSGD: 9.81 },
      // Saturday daytime
      { dayType: 'saturday', startTime: '07:00', endTime: '19:00', type: 'first_block', blockMinutes: 60, amountSGD: 10.90 },
      { dayType: 'saturday', startTime: '07:00', endTime: '19:00', type: 'subsequent_block', blockMinutes: 30, amountSGD: 2.18 },
      // Saturday evening
      { dayType: 'saturday', startTime: '19:00', endTime: '07:00', type: 'per_entry', blockMinutes: 720, amountSGD: 10.90 },
      // Sunday & PH daytime
      { dayType: 'sunday_ph', startTime: '07:00', endTime: '19:00', type: 'first_block', blockMinutes: 60, amountSGD: 10.90 },
      { dayType: 'sunday_ph', startTime: '07:00', endTime: '19:00', type: 'subsequent_block', blockMinutes: 30, amountSGD: 2.18 },
      // Sunday & PH evening
      { dayType: 'sunday_ph', startTime: '19:00', endTime: '07:00', type: 'per_entry', blockMinutes: 720, amountSGD: 10.90 },
    ]
  },
  {
    normalisedName: 'suntec city',
    name: 'Suntec City',
    aliases: ['suntec', 'suntec convention', 'suntec towers'],
    publishedRateText: {
      weekdays: '07:00-17:00: $2.40 for 1st hr, $1.20/subsequent 30 mins. 17:00-07:00: $3.20/entry.',
      saturday: '07:00-07:00 next day: $2.60 for 1st 4 hrs, $1.30/subsequent hr (capped at $12.00).',
      sunday_ph: '07:00-07:00 next day: $2.60 for 1st 4 hrs, $1.30/subsequent hr.'
    },
    rules: [
      { dayType: 'weekday', startTime: '07:00', endTime: '17:00', type: 'first_block', blockMinutes: 60, amountSGD: 2.40 },
      { dayType: 'weekday', startTime: '07:00', endTime: '17:00', type: 'subsequent_block', blockMinutes: 30, amountSGD: 1.20 },
      { dayType: 'weekday', startTime: '17:00', endTime: '07:00', type: 'per_entry', blockMinutes: 840, amountSGD: 3.20 },
      { dayType: 'saturday', startTime: '07:00', endTime: '07:00', type: 'first_block', blockMinutes: 240, amountSGD: 2.60 },
      { dayType: 'saturday', startTime: '07:00', endTime: '07:00', type: 'subsequent_block', blockMinutes: 60, amountSGD: 1.30 },
      { dayType: 'sunday_ph', startTime: '07:00', endTime: '07:00', type: 'first_block', blockMinutes: 240, amountSGD: 2.60 },
      { dayType: 'sunday_ph', startTime: '07:00', endTime: '07:00', type: 'subsequent_block', blockMinutes: 60, amountSGD: 1.30 },
    ]
  },
  {
    normalisedName: 'millenia walk',
    name: 'Millenia Walk',
    aliases: ['millenia', 'millenia tower', 'centennial tower'],
    publishedRateText: {
      weekdays: '07:00-18:00: $3.30 for 1st 2 hrs, $1.10/subsequent 30 mins. 18:00-07:00: $3.30/entry.',
      saturday: '07:00-07:00: $3.30 for 1st 2 hrs, $1.10/subsequent 30 mins. Max $8.80 per 24 hrs.',
      sunday_ph: 'Same as Saturday.'
    },
    rules: [
      { dayType: 'weekday', startTime: '07:00', endTime: '18:00', type: 'first_block', blockMinutes: 120, amountSGD: 3.30 },
      { dayType: 'weekday', startTime: '07:00', endTime: '18:00', type: 'subsequent_block', blockMinutes: 30, amountSGD: 1.10 },
      { dayType: 'weekday', startTime: '18:00', endTime: '07:00', type: 'per_entry', blockMinutes: 780, amountSGD: 3.30 },
      { dayType: 'saturday', startTime: '07:00', endTime: '07:00', type: 'first_block', blockMinutes: 120, amountSGD: 3.30 },
      { dayType: 'saturday', startTime: '07:00', endTime: '07:00', type: 'subsequent_block', blockMinutes: 30, amountSGD: 1.10 },
      { dayType: 'sunday_ph', startTime: '07:00', endTime: '07:00', type: 'first_block', blockMinutes: 120, amountSGD: 3.30 },
      { dayType: 'sunday_ph', startTime: '07:00', endTime: '07:00', type: 'subsequent_block', blockMinutes: 30, amountSGD: 1.10 },
    ]
  },
  {
    normalisedName: 'marina square',
    name: 'Marina Square',
    aliases: ['marina sq', 'pan pacific', 'mandarin oriental'],
    publishedRateText: {
      weekdays: '07:00-17:00: $2.40 for 1st 2 hrs, $1.20/subsequent 30 mins. 17:00-07:00: $3.00/entry.',
      saturday: '07:00-07:00: $2.60 for 1st 2 hrs, $1.20/subsequent 30 mins.',
      sunday_ph: '07:00-07:00: $2.60 for 1st 2 hrs, $1.20/subsequent 30 mins.'
    },
    rules: [
      { dayType: 'weekday', startTime: '07:00', endTime: '17:00', type: 'first_block', blockMinutes: 120, amountSGD: 2.40 },
      { dayType: 'weekday', startTime: '07:00', endTime: '17:00', type: 'subsequent_block', blockMinutes: 30, amountSGD: 1.20 },
      { dayType: 'weekday', startTime: '17:00', endTime: '07:00', type: 'per_entry', blockMinutes: 840, amountSGD: 3.00 },
      { dayType: 'saturday', startTime: '07:00', endTime: '07:00', type: 'first_block', blockMinutes: 120, amountSGD: 2.60 },
      { dayType: 'saturday', startTime: '07:00', endTime: '07:00', type: 'subsequent_block', blockMinutes: 30, amountSGD: 1.20 },
      { dayType: 'sunday_ph', startTime: '07:00', endTime: '07:00', type: 'first_block', blockMinutes: 120, amountSGD: 2.60 },
      { dayType: 'sunday_ph', startTime: '07:00', endTime: '07:00', type: 'subsequent_block', blockMinutes: 30, amountSGD: 1.20 },
    ]
  },
  {
    normalisedName: 'esplanade',
    name: 'Esplanade - Theatres on the Bay',
    aliases: ['theatres on the bay', 'esplanade mall'],
    publishedRateText: {
      weekdays: '06:00-18:00: $2.30/hr. 18:00-06:00: $2.30/entry.',
      saturday: '06:00-18:00: $2.30/hr. 18:00-06:00: $2.30/entry.',
      sunday_ph: '06:00-18:00: $2.30/hr. 18:00-06:00: $2.30/entry.'
    },
    rules: [
      { dayType: 'weekday', startTime: '06:00', endTime: '18:00', type: 'flat_hourly', blockMinutes: 60, amountSGD: 2.30 },
      { dayType: 'weekday', startTime: '18:00', endTime: '06:00', type: 'per_entry', blockMinutes: 720, amountSGD: 2.30 },
      { dayType: 'saturday', startTime: '06:00', endTime: '18:00', type: 'flat_hourly', blockMinutes: 60, amountSGD: 2.30 },
      { dayType: 'saturday', startTime: '18:00', endTime: '06:00', type: 'per_entry', blockMinutes: 720, amountSGD: 2.30 },
      { dayType: 'sunday_ph', startTime: '06:00', endTime: '18:00', type: 'flat_hourly', blockMinutes: 60, amountSGD: 2.30 },
      { dayType: 'sunday_ph', startTime: '18:00', endTime: '06:00', type: 'per_entry', blockMinutes: 720, amountSGD: 2.30 },
    ]
  },
  {
    normalisedName: 'raffles city',
    name: 'Raffles City',
    aliases: ['raffles city shopping', 'swissotel the stamford', 'fairmont singapore'],
    publishedRateText: {
      weekdays: '08:00-17:59: $2.80 for 1st hr, $0.70/15 mins. 18:00-07:59: $3.50/entry.',
      saturday: '08:00-07:59: $2.80 for 1st 2 hrs, $0.70/15 mins.',
      sunday_ph: 'Same as Saturday.'
    },
    rules: [
      { dayType: 'weekday', startTime: '08:00', endTime: '18:00', type: 'first_block', blockMinutes: 60, amountSGD: 2.80 },
      { dayType: 'weekday', startTime: '08:00', endTime: '18:00', type: 'subsequent_block', blockMinutes: 15, amountSGD: 0.70 },
      { dayType: 'weekday', startTime: '18:00', endTime: '08:00', type: 'per_entry', blockMinutes: 840, amountSGD: 3.50 },
      { dayType: 'saturday', startTime: '08:00', endTime: '08:00', type: 'first_block', blockMinutes: 120, amountSGD: 2.80 },
      { dayType: 'saturday', startTime: '08:00', endTime: '08:00', type: 'subsequent_block', blockMinutes: 15, amountSGD: 0.70 },
      { dayType: 'sunday_ph', startTime: '08:00', endTime: '08:00', type: 'first_block', blockMinutes: 120, amountSGD: 2.80 },
      { dayType: 'sunday_ph', startTime: '08:00', endTime: '08:00', type: 'subsequent_block', blockMinutes: 15, amountSGD: 0.70 },
    ]
  },
  {
    normalisedName: 'singapore flyer',
    name: 'Singapore Flyer',
    aliases: ['flyer'],
    publishedRateText: {
      weekdays: '06:00-18:00: $2.00/hr. 18:00-06:00: $2.00/entry.',
      saturday: '06:00-18:00: $2.50/hr. 18:00-06:00: $2.50/entry.',
      sunday_ph: '06:00-18:00: $2.50/hr. 18:00-06:00: $2.50/entry.'
    },
    rules: [
      { dayType: 'weekday', startTime: '06:00', endTime: '18:00', type: 'flat_hourly', blockMinutes: 60, amountSGD: 2.00 },
      { dayType: 'weekday', startTime: '18:00', endTime: '06:00', type: 'per_entry', blockMinutes: 720, amountSGD: 2.00 },
      { dayType: 'saturday', startTime: '06:00', endTime: '18:00', type: 'flat_hourly', blockMinutes: 60, amountSGD: 2.50 },
      { dayType: 'saturday', startTime: '18:00', endTime: '06:00', type: 'per_entry', blockMinutes: 720, amountSGD: 2.50 },
      { dayType: 'sunday_ph', startTime: '06:00', endTime: '18:00', type: 'flat_hourly', blockMinutes: 60, amountSGD: 2.50 },
      { dayType: 'sunday_ph', startTime: '18:00', endTime: '06:00', type: 'per_entry', blockMinutes: 720, amountSGD: 2.50 },
    ]
  },
  {
    normalisedName: 'ion orchard',
    name: 'ION Orchard',
    aliases: ['ion'],
    publishedRateText: {
      weekdays: '08:00-17:00: $3.00 for 1st hr, $0.80/subsequent 15 mins. 17:00-08:00: $4.00/entry.',
      saturday: '08:00-18:00: $4.00 for 1st 2 hrs, $0.80/subsequent 15 mins. 18:00-08:00: $4.50/entry.',
      sunday_ph: 'Same as Saturday.'
    },
    rules: [
      { dayType: 'weekday', startTime: '08:00', endTime: '17:00', type: 'first_block', blockMinutes: 60, amountSGD: 3.00 },
      { dayType: 'weekday', startTime: '08:00', endTime: '17:00', type: 'subsequent_block', blockMinutes: 15, amountSGD: 0.80 },
      { dayType: 'weekday', startTime: '17:00', endTime: '08:00', type: 'per_entry', blockMinutes: 900, amountSGD: 4.00 },
      { dayType: 'saturday', startTime: '08:00', endTime: '18:00', type: 'first_block', blockMinutes: 120, amountSGD: 4.00 },
      { dayType: 'saturday', startTime: '08:00', endTime: '18:00', type: 'subsequent_block', blockMinutes: 15, amountSGD: 0.80 },
      { dayType: 'saturday', startTime: '18:00', endTime: '08:00', type: 'per_entry', blockMinutes: 840, amountSGD: 4.50 },
      { dayType: 'sunday_ph', startTime: '08:00', endTime: '18:00', type: 'first_block', blockMinutes: 120, amountSGD: 4.00 },
      { dayType: 'sunday_ph', startTime: '08:00', endTime: '18:00', type: 'subsequent_block', blockMinutes: 15, amountSGD: 0.80 },
      { dayType: 'sunday_ph', startTime: '18:00', endTime: '08:00', type: 'per_entry', blockMinutes: 840, amountSGD: 4.50 },
    ]
  },
  {
    normalisedName: 'vivocity',
    name: 'VivoCity',
    aliases: ['vivo', 'harbourfront'],
    publishedRateText: {
      weekdays: '07:00-18:00: $1.60 for 1st hr, $0.80/subsequent 30 mins. 18:00-07:00: $3.20/entry.',
      saturday: '07:00-18:00: $1.80 for 1st hr, $0.90/subsequent 30 mins. 18:00-07:00: $3.80/entry.',
      sunday_ph: 'Same as Saturday.'
    },
    rules: [
      { dayType: 'weekday', startTime: '07:00', endTime: '18:00', type: 'first_block', blockMinutes: 60, amountSGD: 1.60 },
      { dayType: 'weekday', startTime: '07:00', endTime: '18:00', type: 'subsequent_block', blockMinutes: 30, amountSGD: 0.80 },
      { dayType: 'weekday', startTime: '18:00', endTime: '07:00', type: 'per_entry', blockMinutes: 780, amountSGD: 3.20 },
      { dayType: 'saturday', startTime: '07:00', endTime: '18:00', type: 'first_block', blockMinutes: 60, amountSGD: 1.80 },
      { dayType: 'saturday', startTime: '07:00', endTime: '18:00', type: 'subsequent_block', blockMinutes: 30, amountSGD: 0.90 },
      { dayType: 'saturday', startTime: '18:00', endTime: '07:00', type: 'per_entry', blockMinutes: 780, amountSGD: 3.80 },
      { dayType: 'sunday_ph', startTime: '07:00', endTime: '18:00', type: 'first_block', blockMinutes: 60, amountSGD: 1.80 },
      { dayType: 'sunday_ph', startTime: '07:00', endTime: '18:00', type: 'subsequent_block', blockMinutes: 30, amountSGD: 0.90 },
      { dayType: 'sunday_ph', startTime: '18:00', endTime: '07:00', type: 'per_entry', blockMinutes: 780, amountSGD: 3.80 },
    ]
  },
  {
    normalisedName: 'jewel changi airport',
    name: 'Jewel Changi Airport',
    aliases: ['jewel', 'changi jewel'],
    publishedRateText: {
      weekdays: '00:00-24:00: $0.04/min for 1st 90 mins, then $5.00/subsequent 30 mins.',
      saturday: 'Same as weekdays.',
      sunday_ph: 'Same as weekdays.'
    },
    rules: [
      { dayType: 'weekday', startTime: '00:00', endTime: '24:00', type: 'per_minute', blockMinutes: 1, amountSGD: 0.04 },
      { dayType: 'saturday', startTime: '00:00', endTime: '24:00', type: 'per_minute', blockMinutes: 1, amountSGD: 0.04 },
      { dayType: 'sunday_ph', startTime: '00:00', endTime: '24:00', type: 'per_minute', blockMinutes: 1, amountSGD: 0.04 },
    ]
  },
  {
    normalisedName: 'bugis junction',
    name: 'Bugis Junction',
    aliases: ['bugis plus', 'bugis', 'parco bugis'],
    publishedRateText: {
      weekdays: '08:00-17:59: $2.40 for 1st hr, $0.60/subsequent 15 mins. 18:00-07:59: $3.20/entry.',
      saturday: '08:00-07:59: $2.40 for 1st 2 hrs, $0.60/subsequent 15 mins.',
      sunday_ph: 'Same as Saturday.'
    },
    rules: [
      { dayType: 'weekday', startTime: '08:00', endTime: '18:00', type: 'first_block', blockMinutes: 60, amountSGD: 2.40 },
      { dayType: 'weekday', startTime: '08:00', endTime: '18:00', type: 'subsequent_block', blockMinutes: 15, amountSGD: 0.60 },
      { dayType: 'weekday', startTime: '18:00', endTime: '08:00', type: 'per_entry', blockMinutes: 840, amountSGD: 3.20 },
      { dayType: 'saturday', startTime: '08:00', endTime: '08:00', type: 'first_block', blockMinutes: 120, amountSGD: 2.40 },
      { dayType: 'saturday', startTime: '08:00', endTime: '08:00', type: 'subsequent_block', blockMinutes: 15, amountSGD: 0.60 },
      { dayType: 'sunday_ph', startTime: '08:00', endTime: '08:00', type: 'first_block', blockMinutes: 120, amountSGD: 2.40 },
      { dayType: 'sunday_ph', startTime: '08:00', endTime: '08:00', type: 'subsequent_block', blockMinutes: 15, amountSGD: 0.60 },
    ]
  },
  {
    normalisedName: 'hdb central area',
    name: 'HDB / URA Central Area',
    aliases: ['hdb central', 'ura central'],
    publishedRateText: {
      weekdays: '07:00-17:00: $1.20 per 30 mins. 17:00-07:00: $0.60 per 30 mins (max $5.00/night).',
      saturday: 'Same as weekdays.',
      sunday_ph: '07:00-22:30: Free or $0.60 per 30 mins.'
    },
    rules: [
      { dayType: 'weekday', startTime: '07:00', endTime: '17:00', type: 'flat_hourly', blockMinutes: 30, amountSGD: 1.20 },
      { dayType: 'weekday', startTime: '17:00', endTime: '07:00', type: 'flat_hourly', blockMinutes: 30, amountSGD: 0.60 },
      { dayType: 'saturday', startTime: '07:00', endTime: '17:00', type: 'flat_hourly', blockMinutes: 30, amountSGD: 1.20 },
      { dayType: 'saturday', startTime: '17:00', endTime: '07:00', type: 'flat_hourly', blockMinutes: 30, amountSGD: 0.60 },
      { dayType: 'sunday_ph', startTime: '07:00', endTime: '22:30', type: 'flat_hourly', blockMinutes: 30, amountSGD: 0.60 },
      { dayType: 'sunday_ph', startTime: '22:30', endTime: '07:00', type: 'flat_hourly', blockMinutes: 30, amountSGD: 0.60 },
    ]
  },
  {
    normalisedName: 'hdb non central',
    name: 'HDB / URA Standard (Non-Central)',
    aliases: ['hdb standard', 'ura standard'],
    publishedRateText: {
      weekdays: '07:00-22:30: $0.60 per 30 mins. 22:30-07:00: $0.60 per 30 mins (capped at $5.00 night parking).',
      saturday: 'Same as weekdays.',
      sunday_ph: '07:00-22:30: Free parking scheme (selected), or $0.60 per 30 mins.'
    },
    rules: [
      { dayType: 'weekday', startTime: '07:00', endTime: '22:30', type: 'flat_hourly', blockMinutes: 30, amountSGD: 0.60 },
      { dayType: 'weekday', startTime: '22:30', endTime: '07:00', type: 'flat_hourly', blockMinutes: 30, amountSGD: 0.60 },
      { dayType: 'saturday', startTime: '07:00', endTime: '22:30', type: 'flat_hourly', blockMinutes: 30, amountSGD: 0.60 },
      { dayType: 'saturday', startTime: '22:30', endTime: '07:00', type: 'flat_hourly', blockMinutes: 30, amountSGD: 0.60 },
      { dayType: 'sunday_ph', startTime: '07:00', endTime: '22:30', type: 'flat_hourly', blockMinutes: 30, amountSGD: 0.60 },
      { dayType: 'sunday_ph', startTime: '22:30', endTime: '07:00', type: 'flat_hourly', blockMinutes: 30, amountSGD: 0.60 },
    ]
  }
];

/**
 * Attempt to match a carpark name to our rate definition database.
 * If development name matches any normalisedName or alias, returns definition.
 * Also handles standard HDB / URA pattern matching.
 */
export function matchCarparkRateDefinition(
  rawName: string,
  agency?: string
): CarparkRateDefinition | null {
  if (!rawName) return null;
  const norm = normaliseCarparkName(rawName);

  // Exact or contains match on known commercial / landmark car parks
  for (const def of CARPARK_RATES_DATABASE) {
    if (norm === def.normalisedName || norm.includes(def.normalisedName) || def.normalisedName.includes(norm)) {
      return def;
    }
    for (const alias of def.aliases) {
      const normAlias = normaliseCarparkName(alias);
      if (norm === normAlias || norm.includes(normAlias) || normAlias.includes(norm)) {
        return def;
      }
    }
  }

  // Check if HDB / URA
  const isHDB = agency === 'HDB' || /^[A-Z0-9]{3,5}$/.test(rawName.trim()) || /blk\s*\d+/i.test(rawName);
  const isURA = agency === 'URA';

  if (isHDB || isURA) {
    // Check if in central area
    const isCentral = /marina|orchard|bugis|chinatown|raffles|tanjong|shenton|rochor/i.test(rawName);
    const def = isCentral
      ? CARPARK_RATES_DATABASE.find(d => d.normalisedName === 'hdb central area')
      : CARPARK_RATES_DATABASE.find(d => d.normalisedName === 'hdb non central');
    if (def) {
      return {
        ...def,
        name: rawName,
        isApproximate: true
      } as any;
    }
  }

  return null;
}
