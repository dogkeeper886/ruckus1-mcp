import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import ruckusAuthRouter from './routes/ruckusAuth';
import ruckusVenuesRouter from './routes/ruckusVenues';

dotenv.config();

const app = express();

app.use(express.json());
app.use('/ruckus-auth', ruckusAuthRouter);
app.use('/venues', ruckusVenuesRouter);
app.get('/', (req, res) => {
  res.send('Ruckus1-MCP API is running!');
});

// Serve openapi.yaml at /openapi.yaml
app.get('/openapi.yaml', (req, res) => {
  res.sendFile(path.join(__dirname, '../openapi.yaml'));
});

// Placeholder for routes

export default app; 