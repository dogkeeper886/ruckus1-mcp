export interface RuckusConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  region?: string | undefined;
}

export const API_CONSTANTS = {
  DEFAULT_VENUES_PAGE_SIZE: 10000,
  DEFAULT_VENUES_PAGE: 1,
  DEFAULT_AP_GROUPS_PAGE_SIZE: 10000,
  DEFAULT_AP_GROUPS_PAGE: 1,
  DEFAULT_POLLING_INTERVAL_MS: 2000,
  DEFAULT_MAX_RETRIES: 5,
  TOKEN_EXPIRY_BUFFER_MS: 60000,
  VENUES_SEARCH_TARGET_FIELDS: ["name", "addressLine", "description", "tagList"],
  DEFAULT_VENUES_FIELDS: ["id", "name"],
  DEFAULT_AP_GROUPS_FIELDS: ["id", "name"],
  DEFAULT_SORT_ORDER: "ASC" as const,
  DEFAULT_VENUES_SORT_FIELD: "name",
  RUCKUS_GLOBAL_ENDPOINT: "https://api.ruckuswireless.com",
  REGIONAL_ENDPOINTS: {
    'us-east-1': 'https://api-us-east-1.ruckuswireless.com',
    'us-west-2': 'https://api-us-west-2.ruckuswireless.com',
    'eu-west-1': 'https://api-eu-west-1.ruckuswireless.com',
    'eu-central-1': 'https://api-eu-central-1.ruckuswireless.com',
    'ap-southeast-1': 'https://api-ap-southeast-1.ruckuswireless.com',
    'ap-southeast-2': 'https://api-ap-southeast-2.ruckuswireless.com'
  },
  HTTP_TIMEOUT_MS: 30000,
  OAUTH_TOKEN_ENDPOINT: '/oauth2/token'
} as const;

export interface ConfigValidationError {
  variable: string;
  error: string;
}

export function validateEnvironment(): RuckusConfig {
  const errors: ConfigValidationError[] = [];
  
  const tenantId = process.env.RUCKUS_TENANT_ID;
  const clientId = process.env.RUCKUS_CLIENT_ID;
  const clientSecret = process.env.RUCKUS_CLIENT_SECRET;
  const region = process.env.RUCKUS_REGION;

  if (!tenantId || tenantId.trim().length === 0) {
    errors.push({
      variable: 'RUCKUS_TENANT_ID',
      error: !tenantId ? 'Required environment variable is missing' : 'Environment variable cannot be empty'
    });
  }

  if (!clientId || clientId.trim().length === 0) {
    errors.push({
      variable: 'RUCKUS_CLIENT_ID',
      error: !clientId ? 'Required environment variable is missing' : 'Environment variable cannot be empty'
    });
  }

  if (!clientSecret || clientSecret.trim().length === 0) {
    errors.push({
      variable: 'RUCKUS_CLIENT_SECRET',
      error: !clientSecret ? 'Required environment variable is missing' : 'Environment variable cannot be empty'
    });
  }

  if (errors.length > 0) {
    const errorMessage = errors
      .map(err => `${err.variable}: ${err.error}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errorMessage}`);
  }

  return {
    tenantId: tenantId!,
    clientId: clientId!,
    clientSecret: clientSecret!,
    region
  };
}