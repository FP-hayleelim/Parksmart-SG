import type { Request, Response } from 'express';

export default async function geocodeHandler(req: Request, res: Response) {
  const query = (req.query.q as string || '').trim();
  const latStr = req.query.lat as string;
  const lngStr = req.query.lng as string;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    // 1. Reverse Geocode if lat and lng provided (e.g. for "Near me")
    if (latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        const reverseUrl = `https://www.onemap.gov.sg/api/common/reverseGeocode?location=${lat},${lng}&buffer=100&addressType=All`;
        const resp = await fetch(reverseUrl, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const data = await resp.json();
          const first = data?.GeocodeInfo?.[0];
          if (first) {
            const title = first.BUILDINGNAME || first.ROAD || 'Current Location';
            const address = `${first.BLOCK ? first.BLOCK + ' ' : ''}${first.ROAD || ''} ${first.POSTALCODE ? 'Singapore ' + first.POSTALCODE : ''}`.trim();
            return res.json({
              results: [{
                title: title.toUpperCase(),
                address: address || 'Your current location',
                latitude: lat,
                longitude: lng,
                postalCode: first.POSTALCODE || ''
              }],
              source: 'onemap_reverse'
            });
          }
        }

        return res.json({
          results: [{
            title: 'Current Location',
            address: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            latitude: lat,
            longitude: lng,
            postalCode: ''
          }],
          source: 'coordinates'
        });
      }
    }

    // 2. Standard Search query via OneMap Search API
    if (!query) {
      return res.json({ results: [] });
    }

    const oneMapUrl = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(query)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
    const response = await fetch(oneMapUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OneMap API error: ${response.status}`);
    }

    const data = await response.json();
    if (data && Array.isArray(data.results) && data.results.length > 0) {
      const results = data.results.slice(0, 10).map((item: any) => ({
        title: item.SEARCHVAL || item.BUILDING || item.ROAD_NAME,
        address: item.ADDRESS || `${item.BLK_NO || ''} ${item.ROAD_NAME || ''}`.trim(),
        latitude: parseFloat(item.LATITUDE),
        longitude: parseFloat(item.LONGITUDE),
        postalCode: item.POSTAL && item.POSTAL !== 'NIL' ? item.POSTAL : ''
      })).filter((item: any) => !isNaN(item.latitude) && !isNaN(item.longitude));

      return res.json({ results, source: 'onemap' });
    }

    return res.json({ results: [], source: 'onemap' });
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('OneMap geocoding error:', error.message);
    return res.status(502).json({
      error: 'Unable to connect to OneMap Search API',
      results: []
    });
  }
}
