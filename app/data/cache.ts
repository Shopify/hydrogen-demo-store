export function routeHeaders({loaderHeaders}: {loaderHeaders: Headers}) {
  // Keep the same cache-control headers when loading the page directly
  // versus when transititioning to the page from other areas in the app
  return {
    'Cache-Control': loaderHeaders.get('Cache-Control'),
  };
}

export const CACHE_SHORT = 'public, max-age=1, stale-while-revalidate=9';
export const CACHE_LONG =
  'public, max-age=3600, stale-while-revalidate=82800';
export const CACHE_NONE = 'no-store';
