export interface TokenResponse {
  access_token?: string;
  id_token?: string;
}

export interface ProviderProfile {
  providerAccountId: string;
  email: string | null;
  name: string | null;
}

export interface OAuthProvider {
  getAuthorizationUrl(state: string, redirectUri: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<TokenResponse>;
  fetchProfile(token: TokenResponse): Promise<ProviderProfile>;
}
