import { validateEnvironment } from '../config';

describe('validateEnvironment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return valid config when all required env vars are present', () => {
    process.env.RUCKUS_TENANT_ID = 'test-tenant';
    process.env.RUCKUS_CLIENT_ID = 'test-client';
    process.env.RUCKUS_CLIENT_SECRET = 'test-secret';
    process.env.RUCKUS_REGION = 'us-east-1';

    const config = validateEnvironment();

    expect(config).toEqual({
      tenantId: 'test-tenant',
      clientId: 'test-client',
      clientSecret: 'test-secret',
      region: 'us-east-1',
    });
  });

  it('should work without optional region', () => {
    process.env.RUCKUS_TENANT_ID = 'test-tenant';
    process.env.RUCKUS_CLIENT_ID = 'test-client';
    process.env.RUCKUS_CLIENT_SECRET = 'test-secret';
    delete process.env.RUCKUS_REGION;

    const config = validateEnvironment();

    expect(config).toEqual({
      tenantId: 'test-tenant',
      clientId: 'test-client',
      clientSecret: 'test-secret',
      region: undefined,
    });
  });

  it('should throw error when required env vars are missing', () => {
    delete process.env.RUCKUS_TENANT_ID;
    delete process.env.RUCKUS_CLIENT_ID;
    delete process.env.RUCKUS_CLIENT_SECRET;

    expect(() => validateEnvironment()).toThrow(
      'Environment validation failed:'
    );
  });

  it('should throw error when env vars are empty strings', () => {
    process.env.RUCKUS_TENANT_ID = '   '; // Whitespace only
    process.env.RUCKUS_CLIENT_ID = 'test-client';
    process.env.RUCKUS_CLIENT_SECRET = 'test-secret';

    expect(() => validateEnvironment()).toThrow(
      'RUCKUS_TENANT_ID: Environment variable cannot be empty'
    );
  });
});