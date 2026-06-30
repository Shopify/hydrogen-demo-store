// @ts-ignore
// Virtual entry point for the app
import * as serverBuild from 'virtual:react-router/server-build';
import {createRequestHandler, RouterContextProvider} from 'react-router';
import {oxygenContext} from '~/storefront.context';

/**
 * Export a fetch handler in module format.
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    try {
      const handleRequest = createRequestHandler(
        serverBuild,
        process.env.NODE_ENV,
      );

      const context = new RouterContextProvider();
      context.set(oxygenContext, {env, executionContext});

      return await handleRequest(request, context);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};
