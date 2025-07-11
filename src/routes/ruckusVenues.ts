import { Router, Request, Response } from 'express';
import axios from 'axios';
import { getRuckusJwtToken } from '../services/ruckusAuthService';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Get JWT token
    const token = await getRuckusJwtToken(
      process.env.RUCKUS_TENANT_ID!,
      process.env.RUCKUS_CLIENT_ID!,
      process.env.RUCKUS_CLIENT_SECRET!,
      process.env.RUCKUS_REGION
    );

    // Prepare payload
    const payload = {
      fields: ["id", "name"],
      searchTargetFields: ["name", "addressLine", "description", "tagList"],
      filters: {},
      sortField: "name",
      sortOrder: "ASC",
      page: 1,
      pageSize: 10000,
      defaultPageSize: 10,
      total: 0
    };

    // Build the API URL with region if provided
    const region = process.env.RUCKUS_REGION;
    const apiUrl = region && region.trim() !== ''
      ? `https://api.${region}.ruckus.cloud/venues/query`
      : 'https://api.ruckus.cloud/venues/query';

    // Make POST request to Ruckus One venues API
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch venues' });
  }
});

export default router; 