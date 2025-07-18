import { getRuckusJwtToken } from './ruckusApiService.js';
import { tokenCache } from '../utils/tokenCache.js';
import { validateEnvironment } from '../utils/config.js';
import { handleApiError } from '../utils/errorHandler.js';

export class TokenService {
  private config: ReturnType<typeof validateEnvironment>;

  constructor() {
    this.config = validateEnvironment();
  }

  async getValidToken(): Promise<string> {
    try {
      // Try to get cached token first
      const cachedToken = tokenCache.getToken(
        this.config.tenantId,
        this.config.clientId
      );

      if (cachedToken) {
        return cachedToken;
      }

      // No cached token or expired, fetch new one
      const accessToken = await getRuckusJwtToken(
        this.config.tenantId,
        this.config.clientId,
        this.config.clientSecret,
        this.config.region
      );

      // Create a token response object for caching
      // Default RUCKUS tokens typically have 1 hour expiry
      const tokenResponse = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600 // 1 hour default
      };

      // Cache the new token
      tokenCache.setToken(
        this.config.tenantId,
        this.config.clientId,
        tokenResponse
      );

      return accessToken;
    } catch (error) {
      // If token fetch fails, clear any cached token
      tokenCache.invalidateToken(this.config.tenantId, this.config.clientId);
      
      throw handleApiError(
        error,
        'TokenService',
        'getValidToken',
        {
          tenantId: this.config.tenantId,
          clientId: this.config.clientId,
          region: this.config.region
        }
      );
    }
  }

  invalidateToken(): void {
    tokenCache.invalidateToken(this.config.tenantId, this.config.clientId);
  }

  clearAllTokens(): void {
    tokenCache.clear();
  }

  getTokenStats(): { totalTokens: number; keys: string[] } {
    return tokenCache.getStats();
  }
}

// Global token service instance
export const tokenService = new TokenService();