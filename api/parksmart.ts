import type { Request, Response } from 'express';

const LTA_CARPARK_API_URL = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';

export default async function parksmartHandler(req: Request, res: Response) {
  // Read AccountKey strictly from server-side environment variable. Never hardcoded.
  const ltaAccountKey = process.env.LTA_ACCOUNT_KEY;

  if (!ltaAccountKey) {
    return res.status(401).json({
      success: false,
      error: 'Missing LTA_ACCOUNT_KEY',
      message: 'LTA AccountKey is not configured. Please set the LTA_ACCOUNT_KEY environment variable in your deployment settings or .env file.',
      endpoint: LTA_CARPARK_API_URL,
      headerRequired: 'AccountKey'
    });
  }

  const agencyFilter = (req.query.agency as string || '').toUpperCase();
  const searchVal = (req.query.q as string || '').toLowerCase();
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 500);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(LTA_CARPARK_API_URL, {
      method: 'GET',
      headers: {
        'AccountKey': ltaAccountKey,
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `LTA DataMall responded with HTTP ${response.status}: ${response.statusText}`,
        endpoint: LTA_CARPARK_API_URL
      });
    }

    const data = await response.json();
    let records = Array.isArray(data.value) ? data.value : [];

    // Filter by agency if specified (HDB, LTA, URA)
    if (agencyFilter) {
      records = records.filter((item: any) => item.Agency === agencyFilter);
    }

    // Filter by name, area, or ID if search query specified
    if (searchVal) {
      records = records.filter((item: any) =>
        (item.Development && item.Development.toLowerCase().includes(searchVal)) ||
        (item.CarParkID && item.CarParkID.toLowerCase().includes(searchVal)) ||
        (item.Area && item.Area.toLowerCase().includes(searchVal))
      );
    }

    // Tally lots by agency
    const agencyCounts: Record<string, number> = {};
    for (const r of records) {
      const a = r.Agency || 'OTHER';
      agencyCounts[a] = (agencyCounts[a] || 0) + 1;
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      endpoint: LTA_CARPARK_API_URL,
      totalRecords: records.length,
      agencyBreakdown: agencyCounts,
      data: records.slice(0, limit)
    });

  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Error fetching LTA DataMall CarParkAvailabilityv2 in parksmart.ts:', error);
    return res.status(502).json({
      success: false,
      error: error.name === 'AbortError' ? 'LTA DataMall connection timed out after 6 seconds' : error.message,
      endpoint: LTA_CARPARK_API_URL
    });
  }
}
