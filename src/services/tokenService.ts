import { getRuckusJwtToken } from './ruckusApiService';
import { tokenCache } from '../utils/tokenCache';
import { validateEnvironment } from '../utils/config';
import { handleApiError } from '../utils/errorHandler';

export class TokenService {
  private config: ReturnType<typeof validateEnvironment> | null = null;

  private ensureInitialized(): void {
    if (!this.config) {
      this.config = validateEnvironment();
    }
  }

  async getValidToken(): Promise<string> {
    this.ensureInitialized();

    try {
      // Try to get cached token first
      const cachedToken = tokenCache.getToken(
        this.config!.tenantId,
        this.config!.clientId
      );

      if (cachedToken) {
        return cachedToken;
      }

      // No cached token or expired, fetch new one
      const tokenResponse = await getRuckusJwtToken(
        this.config!.tenantId,
        this.config!.clientId,
        this.config!.clientSecret,
        this.config!.region
      );

      // Cache the new token with actual expires_in from API
      tokenCache.setToken(
        this.config!.tenantId,
        this.config!.clientId,
        tokenResponse
      );

      return tokenResponse.access_token;
    } catch (error) {
      // If token fetch fails, clear any cached token
      tokenCache.invalidateToken(this.config!.tenantId, this.config!.clientId);

      throw handleApiError(
        error,
        'TokenService',
        'getValidToken',
        {
          tenantId: this.config!.tenantId,
          clientId: this.config!.clientId,
          region: this.config!.region
        }
      );
    }
  }

  invalidateToken(): void {
    this.ensureInitialized();
    tokenCache.invalidateToken(this.config!.tenantId, this.config!.clientId);
  }

  clearAllTokens(): void {
    tokenCache.clear();
  }

  getTokenStats(): { totalTokens: number; keys: string[] } {
    return tokenCache.getStats();
  }
}

// Global token service instance (lazy initialization)
export const tokenService = new TokenService();