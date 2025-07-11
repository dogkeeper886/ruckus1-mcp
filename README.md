# ruckus1-mcp

A TypeScript Express API server for proxying requests to Jira/Confluence using Bearer tokens.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Create a `.env` file (see `.env.example` for example).
3. Build the project:
   ```
   npm run build
   ```
4. Start the server:
   ```
   npm start
   ```
   Or for development:
   ```
   npm run dev
   ```

## Usage

### Start the Server

- Development: `npm run dev`
- Production: `npm run build` then `npm start`

### Available Endpoints

| Endpoint                | Method | Description                        |
|-------------------------|--------|------------------------------------|
| `/`                     | GET    | Health check                       |
| `/ruckus-auth/token`    | GET    | Get RUCKUS One JWT token           |
| `/venues`               | GET    | Get list of venues from RUCKUS One |

### Example Requests

**Health Check**
```sh
curl http://localhost:4000/
```

**Get RUCKUS One Auth Token**
```sh
curl http://localhost:4000/ruckus-auth/token
```

**Get Venues**
```sh
curl http://localhost:4000/venues
```

- The `/venues` endpoint returns a list of venue records (id and name) from your RUCKUS One account.
- No authentication is required to call your MCP server endpoints (unless you add it).
- The server handles all RUCKUS One authentication and API calls for you.

## Extending

- Add more routes in `src/routes/`
- Add service logic in `src/services/` 