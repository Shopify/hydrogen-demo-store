import {ServerRouter} from 'react-router';
import type {EntryContext, RouterContextProvider} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';

import {createContentSecurityPolicy} from '~/lib/csp.server';
import {NonceProvider} from '~/lib/nonce';
import {envContext} from '~/lib/storefront';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  routerContext: RouterContextProvider,
) {
  const env = routerContext.get(envContext);
  const {nonce, header} = createContentSecurityPolicy(env);

  const body = await renderToReadableStream(
    <NonceProvider value={nonce}>
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={nonce}
      />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        // eslint-disable-next-line no-console
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
