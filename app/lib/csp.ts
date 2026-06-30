export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

export function createCSPHeader({
  nonce,
  storeDomain,
  checkoutDomain,
}: {
  nonce: string;
  storeDomain?: string;
  checkoutDomain?: string;
}): string {
  const isDev = process.env.NODE_ENV !== 'production';
  const store = storeDomain ? `https://${storeDomain}` : '';
  const checkout = checkoutDomain ? `https://${checkoutDomain}` : '';

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    'https://cdn.shopify.com',
    'https://shopify.com',
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    ...(isDev ? ['http://localhost:*'] : []),
  ];

  const connectSrc = [
    "'self'",
    'https://monorail-edge.shopifysvc.com',
    store,
    checkout,
    ...(isDev ? ['ws://localhost:*', 'http://localhost:*'] : []),
  ].filter(Boolean);

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': scriptSrc,
    'style-src': ["'self'", "'unsafe-inline'", 'https://cdn.shopify.com'],
    'img-src': [
      "'self'",
      'data:',
      'https://cdn.shopify.com',
      'https://shopify.com',
    ],
    'font-src': ["'self'", 'data:', 'https://cdn.shopify.com'],
    'connect-src': connectSrc,
    'frame-src': ["'self'", 'https://*.shopify.com', checkout].filter(Boolean),
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}
