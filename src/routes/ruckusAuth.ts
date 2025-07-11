import { Router, Request, Response } from 'express';
import { getRuckusJwtToken } from '../services/ruckusAuthService';

const router = Router();

router.get('/token', async (req: Request, res: Response) => {
  try {
    const token = await getRuckusJwtToken(
      process.env.RUCKUS_TENANT_ID!,
      process.env.RUCKUS_CLIENT_ID!,
      process.env.RUCKUS_CLIENT_SECRET!,
      process.env.RUCKUS_REGION
    );
    res.json({ token });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get token' });
  }
});

export default router; 