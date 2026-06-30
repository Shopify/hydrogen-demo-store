import type {EntryContext} from 'react-router';
import {RouterContextProvider, ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {oxygenContext} from '~/storefront.context';
import {createCSPHeader, generateNonce} from '~/lib/csp';
import {NonceProvider} from '~/lib/nonce';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: RouterContextProvider,
) {
  const {env} = context.get(oxygenContext);
  const nonce = generateNonce();
  const header = createCSPHeader({
    nonce,
    storeDomain: env.PUBLIC_STORE_DOMAIN,
    checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
  });

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
