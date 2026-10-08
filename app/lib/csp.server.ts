function generateNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function createContentSecurityPolicy(env: Env) {
  const nonce = generateNonce();

  const directives: Record<string, string[]> = {
    'base-uri': ["'self'"],
    'default-src': [
      "'self'",
      `'nonce-${nonce}'`,
      'https://cdn.shopify.com',
      'https://shopify.com',
    ],
    'frame-ancestors': ["'none'"],
    'style-src': ["'self'", "'unsafe-inline'", 'https://cdn.shopify.com'],
    'connect-src': [
      "'self'",
      'https://cdn.shopify.com/',
      'https://monorail-edge.shopifysvc.com',
      `https://${env.PUBLIC_CHECKOUT_DOMAIN}`,
      `https://${env.PUBLIC_STORE_DOMAIN}`,
    ],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      'https://cdn.shopify.com',
      'https://shopify.com',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
    ],
  };

  if (process.env.NODE_ENV === 'development') {
    directives['default-src'].push('http://localhost:*');
    directives['style-src'].push('http://localhost:*');
    directives['script-src'].push('http://localhost:*');
    directives['connect-src'].push(
      'http://localhost:*',
      'ws://localhost:*',
      'ws://127.0.0.1:*',
      'ws://*.tryhydrogen.dev:*',
    );
  }

  const header = Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ');

  return {nonce, header};
}
