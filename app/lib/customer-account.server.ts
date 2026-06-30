import {redirect} from 'react-router';
import type {AppSession} from '~/lib/session.server';

const CUSTOMER_ACCOUNT_API_VERSION = '2026-04';

const TOKEN_KEY = 'customerAccessToken';
const REFRESH_KEY = 'customerRefreshToken';
const ID_TOKEN_KEY = 'customerIdToken';
const EXPIRES_KEY = 'customerExpiresAt';
const CODE_VERIFIER_KEY = 'customerCodeVerifier';
const STATE_KEY = 'customerState';
const NONCE_KEY = 'customerNonce';
const RETURN_KEY = 'customerReturnTo';

type GraphQLResult = {
  data: any;
  errors?: Array<{message: string}>;
};

export type CustomerAccountClient = {
  login: (returnTo?: string) => Promise<Response>;
  authorize: () => Promise<Response>;
  logout: () => Promise<Response>;
  isLoggedIn: () => Promise<boolean>;
  handleAuthStatus: () => Promise<void>;
  query: (query: string, options?: {variables?: Record<string, unknown>}) => Promise<GraphQLResult>;
  mutate: (mutation: string, options: {variables?: Record<string, unknown>}) => Promise<GraphQLResult>;
};

function base64UrlEncode(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function codeChallengeFromVerifier(verifier: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  );
  return base64UrlEncode(new Uint8Array(digest));
}

export function createCustomerAccountClient({
  request,
  session,
  env,
}: {
  request: Request;
  session: AppSession;
  env: Env;
}): CustomerAccountClient {
  const clientId = env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID;
  const baseUrl =
    env.PUBLIC_CUSTOMER_ACCOUNT_API_URL ||
    `https://shopify.com/${env.SHOP_ID}`;
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/account/authorize`;

  const authorizeEndpoint = `${baseUrl}/auth/oauth/authorize`;
  const tokenEndpoint = `${baseUrl}/auth/oauth/token`;
  const logoutEndpoint = `${baseUrl}/auth/logout`;
  const graphqlEndpoint = `${baseUrl}/account/customer/api/${CUSTOMER_ACCOUNT_API_VERSION}/graphql`;

  const scope = 'openid email customer-account-api:full';

  async function clearAndLogout(): Promise<Response> {
    const idToken = session.get(ID_TOKEN_KEY);
    session.unset(TOKEN_KEY);
    session.unset(REFRESH_KEY);
    session.unset(ID_TOKEN_KEY);
    session.unset(EXPIRES_KEY);

    const url = new URL(logoutEndpoint);
    if (idToken) url.searchParams.set('id_token_hint', idToken);
    url.searchParams.set('post_logout_redirect_uri', origin);

    return redirect(url.toString());
  }

  async function exchangeRefreshToken(): Promise<boolean> {
    const refreshToken = session.get(REFRESH_KEY);
    if (!refreshToken) return false;

    const body = new URLSearchParams();
    body.append('grant_type', 'refresh_token');
    body.append('client_id', clientId);
    body.append('refresh_token', refreshToken);

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body,
    });

    if (!response.ok) return false;

    const data = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      id_token?: string;
      expires_in?: number;
    };

    if (!data.access_token) return false;

    session.set(TOKEN_KEY, data.access_token);
    if (data.refresh_token) session.set(REFRESH_KEY, data.refresh_token);
    if (data.id_token) session.set(ID_TOKEN_KEY, data.id_token);
    session.set(EXPIRES_KEY, Date.now() + (data.expires_in ?? 7200) * 1000);
    return true;
  }

  async function getAccessToken(): Promise<string | null> {
    const token = session.get(TOKEN_KEY);
    const expiresAt = session.get(EXPIRES_KEY);

    if (!token) return null;

    if (typeof expiresAt === 'number' && Date.now() > expiresAt - 60_000) {
      const refreshed = await exchangeRefreshToken();
      if (!refreshed) return null;
      return session.get(TOKEN_KEY) ?? null;
    }

    return token;
  }

  async function graphql(
    operation: string,
    variables?: Record<string, unknown>,
  ): Promise<GraphQLResult> {
    const token = await getAccessToken();
    if (!token) throw await clearAndLogout();

    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({query: operation, variables}),
    });

    if (response.status === 401) throw await clearAndLogout();

    const result = (await response.json()) as GraphQLResult;
    return {data: result.data, errors: result.errors};
  }

  return {
    async login(returnTo?: string) {
      const verifier = randomToken();
      const challenge = await codeChallengeFromVerifier(verifier);
      const state = randomToken(16);
      const nonce = randomToken(16);

      session.set(CODE_VERIFIER_KEY, verifier);
      session.set(STATE_KEY, state);
      session.set(NONCE_KEY, nonce);
      if (returnTo) session.set(RETURN_KEY, returnTo);

      const url = new URL(authorizeEndpoint);
      url.searchParams.set('client_id', clientId);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('scope', scope);
      url.searchParams.set('state', state);
      url.searchParams.set('nonce', nonce);
      url.searchParams.set('code_challenge', challenge);
      url.searchParams.set('code_challenge_method', 'S256');

      return redirect(url.toString());
    },

    async authorize() {
      const url = new URL(request.url);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const expectedState = session.get(STATE_KEY);
      const verifier = session.get(CODE_VERIFIER_KEY);

      if (!code || !state || state !== expectedState || !verifier) {
        throw new Response('Authorization failed', {status: 400});
      }

      const body = new URLSearchParams();
      body.append('grant_type', 'authorization_code');
      body.append('client_id', clientId);
      body.append('redirect_uri', redirectUri);
      body.append('code', code);
      body.append('code_verifier', verifier);

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body,
      });

      if (!response.ok) {
        throw new Response('Token exchange failed', {status: 401});
      }

      const data = (await response.json()) as {
        access_token?: string;
        refresh_token?: string;
        id_token?: string;
        expires_in?: number;
      };

      if (!data.access_token) {
        throw new Response('Token exchange failed', {status: 401});
      }

      session.set(TOKEN_KEY, data.access_token);
      if (data.refresh_token) session.set(REFRESH_KEY, data.refresh_token);
      if (data.id_token) session.set(ID_TOKEN_KEY, data.id_token);
      session.set(EXPIRES_KEY, Date.now() + (data.expires_in ?? 7200) * 1000);

      const returnTo = session.get(RETURN_KEY);
      session.unset(CODE_VERIFIER_KEY);
      session.unset(STATE_KEY);
      session.unset(NONCE_KEY);
      session.unset(RETURN_KEY);

      return redirect(returnTo || '/account');
    },

    logout() {
      return clearAndLogout();
    },

    async isLoggedIn() {
      const token = await getAccessToken();
      return Boolean(token);
    },

    async handleAuthStatus() {
      const token = await getAccessToken();
      if (!token) throw await this.login();
    },

    query(query: string, options?: {variables?: Record<string, unknown>}) {
      return graphql(query, options?.variables);
    },

    mutate(mutation: string, options: {variables?: Record<string, unknown>}) {
      return graphql(mutation, options?.variables);
    },
  };
}
