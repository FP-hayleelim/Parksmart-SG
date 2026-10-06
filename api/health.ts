import type { Request, Response } from 'express';

export default async function healthHandler(req: Request, res: Response) {
  const ltaKey = process.env.LTA_ACCOUNT_KEY;

  return res.status(200).json({
    status: 'ok',
    service: 'ParkSmart SG LTA API Service',
    timestamp: new Date().toISOString(),
    endpoints: {
      carparks: '/api/carparks',
      parksmart: '/api/parksmart',
      geocode: '/api/geocode',
      ev: '/api/ev',
      health: '/api/health'
    },
    ltaDataMall: {
      endpoint: 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
      accountKeyConfigured: Boolean(ltaKey && ltaKey.trim().length > 0),
      header: 'AccountKey'
    }
  });
}
