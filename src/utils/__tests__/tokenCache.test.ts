import { TokenCache } from '../tokenCache';
import { AuthTokenResponse } from '../../types/ruckusApi';

describe('TokenCache', () => {
  let cache: TokenCache;

  beforeEach(() => {
    cache = new TokenCache();
  });

  it('should cache and retrieve tokens', () => {
    const tokenResponse: AuthTokenResponse = {
      access_token: 'test-token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    cache.setToken('tenant1', 'client1', tokenResponse);
    const token = cache.getToken('tenant1', 'client1');

    expect(token).toBe('test-token');
  });

  it('should return null for non-existent tokens', () => {
    const token = cache.getToken('non-existent', 'client');
    expect(token).toBeNull();
  });

  it('should return null for expired tokens', (done) => {
    const expiredTokenResponse: AuthTokenResponse = {
      access_token: 'expired-token',
      token_type: 'Bearer',
      expires_in: 0, // Expires immediately
    };

    cache.setToken('tenant1', 'client1', expiredTokenResponse);
    
    // Wait a bit to ensure expiration
    setTimeout(() => {
      const token = cache.getToken('tenant1', 'client1');
      expect(token).toBeNull();
      done();
    }, 100);
  });

  it('should invalidate specific tokens', () => {
    const tokenResponse: AuthTokenResponse = {
      access_token: 'test-token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    cache.setToken('tenant1', 'client1', tokenResponse);
    cache.invalidateToken('tenant1', 'client1');
    
    const token = cache.getToken('tenant1', 'client1');
    expect(token).toBeNull();
  });

  it('should clear all tokens', () => {
    const tokenResponse: AuthTokenResponse = {
      access_token: 'test-token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    cache.setToken('tenant1', 'client1', tokenResponse);
    cache.setToken('tenant2', 'client2', tokenResponse);
    
    cache.clear();
    
    expect(cache.getToken('tenant1', 'client1')).toBeNull();
    expect(cache.getToken('tenant2', 'client2')).toBeNull();
  });

  it('should provide cache stats', () => {
    const tokenResponse: AuthTokenResponse = {
      access_token: 'test-token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    cache.setToken('tenant1', 'client1', tokenResponse);
    cache.setToken('tenant2', 'client2', tokenResponse);
    
    const stats = cache.getStats();
    expect(stats.totalTokens).toBe(2);
    expect(stats.keys).toContain('tenant1:client1');
    expect(stats.keys).toContain('tenant2:client2');
  });
});