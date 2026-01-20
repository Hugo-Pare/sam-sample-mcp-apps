// OAuth 2.0 Types

export interface AuthContext {
  userId: string;
  scopes: string[];
  tokenId: string;
  expiresAt: number;
}

export interface OAuthUser {
  userId: string;
  username: string;
  email: string;
  name: string;
  allowedScopes: string[];
}

export interface AuthorizationCode {
  code: string;
  clientId: string;
  userId: string;
  scope: string[];
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  expiresAt: number;
  used: boolean;
}

export interface AccessToken {
  tokenId: string;
  userId: string;
  scope: string[];
  expiresAt: number;
  refreshTokenId?: string;
}

export interface RefreshToken {
  tokenId: string;
  userId: string;
  scope: string[];
  expiresAt: number;
}

export interface RegisteredClient {
  clientId: string;
  clientSecret?: string;
  clientName: string;
  redirectUris: string[];
  grantTypes: string[];
  responseTypes: string[];
  tokenEndpointAuthMethod: 'none' | 'client_secret_basic' | 'client_secret_post';
  scope?: string;
  createdAt: string;
}

export interface ClientRegistrationRequest {
  client_name: string;
  redirect_uris: string[];
  grant_types?: string[];
  response_types?: string[];
  token_endpoint_auth_method?: 'none' | 'client_secret_basic' | 'client_secret_post';
  scope?: string;
}

// Banking Domain Types

export interface BankAccount {
  accountId: string;
  userId: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'credit';
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'closed';
  createdAt: string;
  lastActivity: string;
}

export interface Transaction {
  transactionId: string;
  accountId: string;
  type: 'debit' | 'credit';
  amount: number;
  currency: string;
  description: string;
  merchant?: string;
  category: string;
  timestamp: string;
  balance: number;
}

export interface CustomerProfile {
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  dateOfBirth: string;
  accountsSince: string;
  preferredLanguage: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface Payment {
  paymentId: string;
  fromAccountId: string;
  toAccountNumber: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  initiatedAt: string;
  completedAt?: string;
}
