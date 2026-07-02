import {redirect} from 'react-router';
import type {ShopifyRequestContext} from '@shopify/hydrogen';
import {
  createCustomerAccountClient as createHydrogenCustomerAccountClient,
  createCustomerSession,
  type AnyCustomerAccountDocument,
  type WritableCustomerSessionManager,
} from '@shopify/hydrogen/customer-account';
import {EncryptedCookieCustomerSession} from '~/lib/customer-session';

const CUSTOMER_ACCOUNT_API_VERSION = '2026-04';

type GraphQLResult = {
  data: any;
  errors?: ReadonlyArray<{message: string}>;
};

export type CustomerAccountClient = {
  login: (returnTo?: string) => Promise<Response>;
  authorize: () => Promise<Response>;
  logout: () => Promise<Response>;
  isLoggedIn: () => Promise<boolean>;
  handleAuthStatus: () => Promise<void>;
  query: (
    query: string,
    options?: {variables?: Record<string, unknown>},
  ) => Promise<GraphQLResult>;
  mutate: (
    mutation: string,
    options?: {variables?: Record<string, unknown>},
  ) => Promise<GraphQLResult>;
};

export async function createCustomerAccountClient({
  request,
  requestContext,
  env,
}: {
  request: Request;
  requestContext: ShopifyRequestContext;
  env: Env;
}): Promise<{
  client: CustomerAccountClient;
  sessionManager: WritableCustomerSessionManager;
}> {
  const sessionManager = await EncryptedCookieCustomerSession.init(
    request,
    env.SESSION_SECRET,
  );

  const session = createCustomerSession({
    shopId: env.SHOP_ID,
    customerAccountApiClientId: env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID,
    customerAccountApiUrl: env.PUBLIC_CUSTOMER_ACCOUNT_API_URL || undefined,
  });

  const graphqlClient = createHydrogenCustomerAccountClient({
    shopId: env.SHOP_ID,
    customerApiVersion: CUSTOMER_ACCOUNT_API_VERSION,
    requestContext,
  });

  async function getAccessToken() {
    return session.getOrRefreshAccessToken(sessionManager, requestContext);
  }

  async function requireAccessToken() {
    const accessToken = await getAccessToken();
    if (accessToken) return accessToken;
    throw redirect('/account/login');
  }

  async function graphql(
    document: string,
    variables?: Record<string, unknown>,
  ): Promise<GraphQLResult> {
    const accessToken = await requireAccessToken();
    const result = await graphqlClient.graphql(
      document as unknown as AnyCustomerAccountDocument,
      {accessToken, variables} as never,
    );
    return {data: result.data, errors: result.errors};
  }

  const client: CustomerAccountClient = {
    async login(returnTo?: string) {
      const url = await session.prepareLoginUrl(sessionManager, requestContext, {
        returnTo,
      });
      return redirect(url);
    },

    async authorize() {
      const path = await session.handleOAuthCallback(
        sessionManager,
        requestContext,
        request,
      );
      return redirect(path);
    },

    async logout() {
      const url = await session.logout(sessionManager, requestContext, {
        postLogoutRedirectUri: new URL(request.url).origin,
      });
      return redirect(url);
    },

    async isLoggedIn() {
      return Boolean(await getAccessToken());
    },

    async handleAuthStatus() {
      await requireAccessToken();
    },

    query(query, options) {
      return graphql(query, options?.variables);
    },

    mutate(mutation, options) {
      return graphql(mutation, options?.variables);
    },
  };

  return {client, sessionManager};
}
