import { GeocodeResult } from '../types/index.ts';

/**
 * Searches OneMap directly without any API key or token.
 * Falls back to serverless proxy if network/CORS restricts direct client call.
 */
export async function searchOneMap(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const directUrl = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(trimmed)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;

  try {
    // 1. Direct call to OneMap Search API without any token or API key
    const response = await fetch(directUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        return data.results.slice(0, 10).map((item: any) => ({
          title: item.SEARCHVAL || item.BUILDING || item.ROAD_NAME,
          address: item.ADDRESS || `${item.BLK_NO || ''} ${item.ROAD_NAME || ''}`.trim(),
          latitude: parseFloat(item.LATITUDE),
          longitude: parseFloat(item.LONGITUDE),
          postalCode: item.POSTAL && item.POSTAL !== 'NIL' ? item.POSTAL : ''
        })).filter((item: any) => !isNaN(item.latitude) && !isNaN(item.longitude));
      }
    }
  } catch (directErr) {
    console.warn('Direct OneMap call issue, trying server proxy:', directErr);
  }

  // 2. Fallback to /api/geocode serverless route (which also calls OneMap directly without token)
  try {
    const proxyResp = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`);
    if (proxyResp.ok) {
      const data = await proxyResp.json();
      if (Array.isArray(data.results)) {
        return data.results;
      }
    }
  } catch (proxyErr) {
    console.error('OneMap geocode error:', proxyErr);
  }

  return [];
}
