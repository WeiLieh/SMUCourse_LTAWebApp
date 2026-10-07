/**
 * Health check endpoint to monitor if the APIs and LTA DataMall configuration are working.
 * Compatible with Vercel Serverless Functions (/api/health) and Express.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const hasAccountKey = Boolean(
    process.env.LTA_ACCOUNT_KEY &&
      process.env.LTA_ACCOUNT_KEY.trim() !== '' &&
      process.env.LTA_ACCOUNT_KEY !== 'YOUR_LTA_ACCOUNT_KEY'
  );

  // Optional live ping to LTA DataMall if LTA_ACCOUNT_KEY is configured
  let ltaUpstreamStatus = hasAccountKey ? 'configured' : 'missing_lta_account_key';

  if (hasAccountKey && req.query?.checkUpstream === 'true') {
    try {
      const response = await fetch(
        'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=04121',
        {
          method: 'GET',
          headers: {
            AccountKey: process.env.LTA_ACCOUNT_KEY.trim(),
            Accept: 'application/json'
          }
        }
      );
      ltaUpstreamStatus = response.ok ? 'connected' : `http_${response.status}`;
    } catch (error) {
      ltaUpstreamStatus = 'unreachable';
    }
  }

  return res.status(200).json({
    status: 'ok',
    service: 'SBS Transit NextBus Telemetry API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    endpoints: {
      health: '/api/health',
      busArrival: '/api/bus-arrival?BusStopCode=04121&ServiceNo=7'
    },
    ltaDataMall: {
      endpoint: 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival',
      accountKeyConfigured: hasAccountKey,
      upstreamStatus: ltaUpstreamStatus,
      refreshIntervalSeconds: 20
    }
  });
}
