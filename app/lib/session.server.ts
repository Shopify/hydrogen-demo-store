import {createContext, createCookieSessionStorage} from 'react-router';
import type {ShopifyRouteHandlerContext} from '@shopify/hydrogen';

type ShopifyRouteSessionManager = ShopifyRouteHandlerContext['sessionManager'];

export type AppSessionManager = ShopifyRouteSessionManager & {
  commit: () => Promise<HeadersInit | undefined>;
};

export const sessionManagerContext = createContext<AppSessionManager>();

export async function createRequestSessionManager(
  request: Request,
  env: Env,
): Promise<AppSessionManager> {
  const storage = createCookieSessionStorage({
    cookie: {
      name: 'session',
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secrets: [env.SESSION_SECRET],
    },
  });

  const session = await storage
    .getSession(request.headers.get('Cookie'))
    .catch(() => storage.getSession());

  let dirty = false;

  return {
    getSessionOrigin: () => new URL(request.url).origin,
    getSessionItem: (key: string) => session.get(key) as unknown,
    setSessionItem: (key: string, value: unknown) => {
      session.set(key, value);
      dirty = true;
    },
    removeSessionItem: (key: string) => {
      session.unset(key);
      dirty = true;
    },
    commit: async () =>
      dirty ? {'Set-Cookie': await storage.commitSession(session)} : undefined,
  };
}
