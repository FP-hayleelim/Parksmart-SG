import { CarparkRateDefinition, DayType, RateRule } from '../types/index.ts';

const SINGAPORE_PUBLIC_HOLIDAYS_2026 = new Set([
  '2026-01-01',
  '2026-02-17',
  '2026-02-18',
  '2026-03-20',
  '2026-04-03',
  '2026-05-01',
  '2026-05-27',
  '2026-05-31',
  '2026-08-09',
  '2026-08-10',
  '2026-11-08',
  '2026-12-25',
]);

/**
 * Determine DayType from a Date or ISO date string (YYYY-MM-DD)
 */
export function getDayType(dateStr: string): DayType {
  if (SINGAPORE_PUBLIC_HOLIDAYS_2026.has(dateStr)) {
    return 'sunday_ph';
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0) return 'sunday_ph';
  if (dayOfWeek === 6) return 'saturday';
  return 'weekday';
}

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export interface CalculationResult {
  totalCostSGD: number;
  breakdown: string;
  isApproximate: boolean;
}

/**
 * Computes parking fee according to LTA billing rules:
 * - "or part thereof" rounds UP to the next block (Math.ceil)
 * - per-entry charges apply once per time band
 * - split stays that cross time bands
 * - public holidays use sunday_ph rates
 */
export function calculateParkingCost(
  rateDef: CarparkRateDefinition,
  dateStr: string,
  arrivalTimeStr: string,
  durationHours: number
): CalculationResult {
  const dayType = getDayType(dateStr);
  const arrivalMin = parseTimeToMinutes(arrivalTimeStr);
  const totalDurationMin = Math.round(durationHours * 60);
  const departureMin = arrivalMin + totalDurationMin;

  // Filter rules for this dayType
  const activeRules = rateDef.rules.filter(r => r.dayType === dayType);
  if (activeRules.length === 0) {
    return {
      totalCostSGD: 0,
      breakdown: 'Rate unavailable for selected time',
      isApproximate: true
    };
  }

  // Group rules into time bands (e.g. 07:00-19:00 vs 19:00-07:00)
  interface TimeBand {
    startMin: number;
    endMin: number;
    rules: RateRule[];
  }

  const bands: TimeBand[] = [];
  for (const rule of activeRules) {
    let s = parseTimeToMinutes(rule.startTime);
    let e = parseTimeToMinutes(rule.endTime);
    if (e <= s) {
      e += 24 * 60; // Overnight band, e.g. 19:00 to 07:00 (+24h)
    }

    let existing = bands.find(b => b.startMin === s && b.endMin === e);
    if (!existing) {
      existing = { startMin: s, endMin: e, rules: [] };
      bands.push(existing);
    }
    existing.rules.push(rule);
  }

  let totalCost = 0;
  const breakdownParts: string[] = [];

  // Check each band
  for (const band of bands) {
    // Normalise interval check across 24h cycles if arrival or departure wraps
    const testIntervals = [
      { start: arrivalMin, end: departureMin },
      { start: arrivalMin + 24 * 60, end: departureMin + 24 * 60 },
      { start: arrivalMin - 24 * 60, end: departureMin - 24 * 60 }
    ];

    let bandOverlapMin = 0;
    for (const interval of testIntervals) {
      const overlapStart = Math.max(interval.start, band.startMin);
      const overlapEnd = Math.min(interval.end, band.endMin);
      if (overlapEnd > overlapStart) {
        bandOverlapMin += (overlapEnd - overlapStart);
      }
    }

    if (bandOverlapMin <= 0) continue;

    // Check if there is a per_entry rule
    const perEntryRule = band.rules.find(r => r.type === 'per_entry');
    if (perEntryRule) {
      totalCost += perEntryRule.amountSGD;
      breakdownParts.push(`Entry rate $${perEntryRule.amountSGD.toFixed(2)}`);
      continue;
    }

    // Check per_minute rule
    const perMinRule = band.rules.find(r => r.type === 'per_minute');
    if (perMinRule) {
      const cost = bandOverlapMin * perMinRule.amountSGD;
      totalCost += cost;
      breakdownParts.push(`${bandOverlapMin} min × $${perMinRule.amountSGD.toFixed(2)} = $${cost.toFixed(2)}`);
      continue;
    }

    // Check flat_hourly rule
    const flatRule = band.rules.find(r => r.type === 'flat_hourly');
    if (flatRule) {
      const blocks = Math.ceil(bandOverlapMin / flatRule.blockMinutes);
      const cost = blocks * flatRule.amountSGD;
      totalCost += cost;
      const unit = flatRule.blockMinutes === 60 ? 'hr' : `${flatRule.blockMinutes}m`;
      breakdownParts.push(`${blocks} × ${unit} @ $${flatRule.amountSGD.toFixed(2)} = $${cost.toFixed(2)}`);
      continue;
    }

    // Check first_block + subsequent_block rules
    const firstRule = band.rules.find(r => r.type === 'first_block');
    const subRule = band.rules.find(r => r.type === 'subsequent_block');

    if (firstRule) {
      let bandCost = 0;
      let bandBreakdown = '';

      if (bandOverlapMin <= firstRule.blockMinutes) {
        bandCost = firstRule.amountSGD;
        const unit = firstRule.blockMinutes === 60 ? '1st hr' : `${firstRule.blockMinutes}m`;
        bandBreakdown = `${unit} $${firstRule.amountSGD.toFixed(2)}`;
      } else {
        bandCost = firstRule.amountSGD;
        const firstUnit = firstRule.blockMinutes === 60 ? '1st hr' : `${firstRule.blockMinutes}m`;
        const remainingMin = bandOverlapMin - firstRule.blockMinutes;

        if (subRule) {
          const subBlocks = Math.ceil(remainingMin / subRule.blockMinutes);
          const subCost = subBlocks * subRule.amountSGD;
          bandCost += subCost;
          bandBreakdown = `${firstUnit} $${firstRule.amountSGD.toFixed(2)} + ${subBlocks} × $${subRule.amountSGD.toFixed(2)} = $${bandCost.toFixed(2)}`;
        } else {
          bandBreakdown = `${firstUnit} $${firstRule.amountSGD.toFixed(2)}`;
        }
      }

      totalCost += bandCost;
      breakdownParts.push(bandBreakdown);
    }
  }

  if (breakdownParts.length === 0) {
    return {
      totalCostSGD: 0,
      breakdown: 'Rate unavailable',
      isApproximate: true
    };
  }

  const breakdown = breakdownParts.join(' + ');

  return {
    totalCostSGD: Number(totalCost.toFixed(2)),
    breakdown: breakdownParts.length === 1 && !breakdown.includes('=')
      ? `${breakdown} = $${totalCost.toFixed(2)}`
      : breakdown,
    isApproximate: Boolean((rateDef as any).isApproximate)
  };
}
