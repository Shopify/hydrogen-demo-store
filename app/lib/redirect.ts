import {countries} from '~/data/countries';

/**
 * Returns the `/<locale>` path prefix for a supported locale route param, or an
 * empty string for anything else.
 *
 * Route params are decoded before they reach loaders and actions, so an
 * unchecked `$locale` value such as `%5Cevil.example` becomes `\evil.example`.
 * Interpolated into a `Location` header, that is a network-path reference to
 * another host. Only locales listed in `~/data/countries` are allowed through.
 */
export function getLocalePrefix(locale: string | undefined): string {
  if (!locale) return '';
  const prefix = `/${locale.toLowerCase()}`;
  return Object.hasOwn(countries, prefix) ? prefix : '';
}

/**
 * Returns a same-origin path (`pathname + search + hash`) for a user-supplied
 * redirect target, or `fallback` when the target is missing, unparseable, or
 * points at another origin.
 *
 * Resolving against the request URL makes the browser's own parsing rules
 * apply, so protocol-relative (`//host`), backslash (`/\host`, `\\host`) and
 * whitespace-obfuscated variants are all treated as the external URLs they
 * are. A path that normalizes to a leading `//` (for example `/.//host`) is
 * also rejected, because emitting it as-is would be read as a network path.
 */
export function getSafeRedirectPath(
  target: unknown,
  requestUrl: string,
  fallback = '/',
): string {
  if (typeof target !== 'string' || target === '') return fallback;

  try {
    const base = new URL(requestUrl);
    const url = new URL(target, base);
    if (url.origin !== base.origin) return fallback;

    const path = `${url.pathname}${url.search}${url.hash}`;
    return path.startsWith('//') ? fallback : path;
  } catch {
    return fallback;
  }
}
