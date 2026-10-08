import * as serverBuild from 'virtual:react-router/server-build';
import {createRequestHandler, RouterContextProvider} from 'react-router';

import {envContext, cacheContext, waitUntilContext} from '~/lib/storefront';

const handleRequest = createRequestHandler(serverBuild, process.env.NODE_ENV);

export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    const routerContext = new RouterContextProvider();
    routerContext.set(envContext, env);
    routerContext.set(cacheContext, await caches.open('hydrogen'));
    routerContext.set(
      waitUntilContext,
      executionContext.waitUntil.bind(executionContext),
    );
    return handleRequest(request, routerContext as never);
  },
};
