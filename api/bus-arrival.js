/**
 * LTA DataMall v3 BusArrival API Proxy
 * Endpoint: GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=04121
 * Header: AccountKey: process.env.LTA_ACCOUNT_KEY
 *
 * Parameters:
 * - BusStopCode (Required): 5-digit bus stop code (e.g., 04121, 04229)
 * - ServiceNo (Optional): Specific bus service number (e.g., 7, 65)
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Cache-Control aligned with LTA's 20-second refresh cadence
  res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=5');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
  }

  const busStopCode = (req.query?.BusStopCode || req.query?.busStopCode || '').toString().trim();
  const serviceNo = (req.query?.ServiceNo || req.query?.serviceNo || '').toString().trim();

  if (!busStopCode) {
    return res.status(400).json({
      error: 'Missing required query parameter: BusStopCode (e.g. ?BusStopCode=04121)'
    });
  }

  const accountKey = process.env.LTA_ACCOUNT_KEY?.trim();

  if (!accountKey || accountKey === 'YOUR_LTA_ACCOUNT_KEY') {
    return res.status(503).json({
      error: 'LTA_ACCOUNT_KEY is not configured in environment variables.',
      source: 'fallback_required',
      busStopCode,
      serviceNo: serviceNo || null
    });
  }

  try {
    const ltaUrl = new URL('https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival');
    ltaUrl.searchParams.set('BusStopCode', busStopCode);
    if (serviceNo) {
      ltaUrl.searchParams.set('ServiceNo', serviceNo);
    }

    const response = await fetch(ltaUrl.toString(), {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `LTA DataMall returned HTTP ${response.status}`,
        details: errorText,
        busStopCode
      });
    }

    const data = await response.json();
    return res.status(200).json({
      ...data,
      _meta: {
        source: 'lta_datamall_v3',
        fetchedAt: new Date().toISOString(),
        refreshIntervalSeconds: 20
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch from LTA DataMall v3 BusArrival endpoint',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
