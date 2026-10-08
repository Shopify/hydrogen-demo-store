import type {MetaDescriptor} from 'react-router';
import type {Thing, WithContext} from 'schema-dts';

type Maybe<T> = T | null | undefined;

export interface RobotsOptions {
  maxImagePreview?: 'none' | 'standard' | 'large';
  maxSnippet?: number;
  maxVideoPreview?: number;
  noArchive?: boolean;
  noFollow?: boolean;
  noImageIndex?: boolean;
  noIndex?: boolean;
  noSnippet?: boolean;
  noTranslate?: boolean;
  unavailableAfter?: string;
}

export interface LanguageAlternate {
  language: string;
  default?: boolean;
  url: string;
}

export type SeoMedia = {
  type: 'image' | 'video' | 'audio';
  url: Maybe<string> | undefined;
  height: Maybe<number> | undefined;
  width: Maybe<number> | undefined;
  altText: Maybe<string> | undefined;
};

export interface SeoConfig {
  title?: Maybe<string>;
  titleTemplate?: Maybe<string> | null;
  media?:
    | Maybe<string>
    | Partial<SeoMedia>
    | (Partial<SeoMedia> | Maybe<string>)[];
  description?: Maybe<string>;
  url?: Maybe<string>;
  handle?: Maybe<string>;
  jsonLd?: WithContext<Thing> | WithContext<Thing>[];
  alternates?: LanguageAlternate | LanguageAlternate[];
  robots?: RobotsOptions;
}

const ERROR_PREFIX = 'Error in SEO input: ';

const schema = {
  title: {
    validate: <T>(value: Maybe<T>): NonNullable<T> => {
      if (typeof value !== 'string') {
        throw new Error(ERROR_PREFIX.concat('`title` should be a string'));
      }

      if (typeof value === 'string' && value.length > 70) {
        throw new Error(
          ERROR_PREFIX.concat(
            '`title` should not be longer than 70 characters',
          ),
        );
      }

      return value;
    },
  },
  description: {
    validate: <T>(value: Maybe<T>): NonNullable<T> => {
      if (typeof value !== 'string') {
        throw new Error(
          ERROR_PREFIX.concat('`description` should be a string'),
        );
      }

      if (typeof value === 'string' && value.length > 155) {
        throw new Error(
          ERROR_PREFIX.concat(
            '`description` should not be longer than 160 characters',
          ),
        );
      }

      return value;
    },
  },
  url: {
    validate: <T>(value: Maybe<T>): NonNullable<T> => {
      if (typeof value !== 'string') {
        throw new Error(ERROR_PREFIX.concat('`url` should be a string'));
      }

      if (typeof value === 'string' && !value.startsWith('http')) {
        throw new Error(ERROR_PREFIX.concat('`url` should be a valid URL'));
      }

      return value;
    },
  },
  handle: {
    validate: <T>(value: Maybe<T>): NonNullable<T> => {
      if (typeof value !== 'string') {
        throw new Error(ERROR_PREFIX.concat('`handle` should be a string'));
      }

      if (typeof value === 'string' && !value.startsWith('@')) {
        throw new Error(ERROR_PREFIX.concat('`handle` should start with `@`'));
      }

      return value;
    },
  },
};

function renderTitle(
  template?: string | ((title: string) => string | undefined) | null,
  title?: string | null,
): string | undefined {
  if (!title) {
    return undefined;
  }

  if (!template) {
    return title;
  }

  if (typeof template === 'function') {
    return template(title);
  }

  return template.replace('%s', title ?? '');
}

function inferMimeType(url: Maybe<string> | undefined) {
  const ext = url && url.split('.').pop();

  switch (ext) {
    case 'svg':
      return 'image/svg+xml';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'swf':
      return 'application/x-shockwave-flash';
    case 'mp3':
      return 'audio/mpeg';
    case 'jpg':
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
}

function ensureArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

function validate<T>(
  validator: {validate: <V>(data: V) => NonNullable<V>},
  data: T,
): T {
  try {
    return validator.validate<T>(data);
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.warn((error as Error).message);
    return data;
  }
}

export type GetSeoMetaReturn = MetaDescriptor[];

type SeoKey = keyof SeoConfig;

type Optional<T> = T | null | undefined;

export function getSeoMeta(
  ...seoInputs: Optional<SeoConfig>[]
): GetSeoMetaReturn {
  const tagResults: GetSeoMetaReturn = [];

  const dedupedSeoInput =
    seoInputs.reduce((acc, current) => {
      if (!current) return acc as SeoConfig;

      Object.keys(current).forEach(
        (key) => !current[key as SeoKey] && delete current[key as SeoKey],
      );

      const {jsonLd} = current;

      if (!jsonLd) {
        return {...acc, ...current} as SeoConfig;
      }

      if (!acc?.jsonLd) {
        return {...acc, ...current, jsonLd: [jsonLd]} as SeoConfig;
      } else {
        return {
          ...acc,
          ...current,
          jsonLd: ensureArray(acc.jsonLd).concat(jsonLd),
        };
      }
    }, {} as SeoConfig) || ({} as SeoConfig);

  for (const seoKey of Object.keys(dedupedSeoInput)) {
    switch (seoKey) {
      case 'title': {
        const content = validate(schema.title, dedupedSeoInput.title);
        const title = renderTitle(dedupedSeoInput?.titleTemplate, content);

        if (!title) {
          break;
        }

        tagResults.push(
          {title},
          {property: 'og:title', content: title},
          {property: 'twitter:title', content: title},
        );

        break;
      }

      case 'description': {
        const content = validate(
          schema.description,
          dedupedSeoInput.description,
        );

        if (!content) {
          break;
        }

        tagResults.push(
          {name: 'description', content},
          {property: 'og:description', content},
          {property: 'twitter:description', content},
        );

        break;
      }

      case 'url': {
        const content = validate(schema.url, dedupedSeoInput.url);

        if (!content) {
          break;
        }

        const urlWithoutParams = content.split('?')[0];
        const urlWithoutTrailingSlash = urlWithoutParams.replace(/\/$/, '');

        tagResults.push(
          {
            tagName: 'link',
            rel: 'canonical',
            href: urlWithoutTrailingSlash,
          },
          {
            property: 'og:url',
            content: urlWithoutTrailingSlash,
          },
        );

        break;
      }

      case 'handle': {
        const content = validate(schema.handle, dedupedSeoInput.handle);

        if (!content) {
          break;
        }

        tagResults.push(
          {property: 'twitter:site', content},
          {property: 'twitter:creator', content},
        );

        break;
      }

      case 'media': {
        let content;
        const values = ensureArray(dedupedSeoInput.media);

        for (const media of values) {
          if (typeof media === 'string') {
            tagResults.push({property: 'og:image', content: media});
          }

          if (media && typeof media === 'object') {
            const type = media.type || 'image';

            const normalizedMedia = media
              ? {
                  url: media?.url,
                  secure_url: media?.url,
                  type: inferMimeType(media.url),
                  width: media?.width,
                  height: media?.height,
                  alt: media?.altText,
                }
              : {};

            for (const key of Object.keys(normalizedMedia)) {
              if (normalizedMedia[key as keyof typeof normalizedMedia]) {
                content = normalizedMedia[
                  key as keyof typeof normalizedMedia
                ] as string;

                tagResults.push({
                  property: `og:${type}:${key}`,
                  content,
                });
              }
            }
          }
        }
        break;
      }

      case 'jsonLd': {
        const jsonLdBlocks = ensureArray(dedupedSeoInput.jsonLd);

        for (const block of jsonLdBlocks) {
          if (typeof block !== 'object' || Object.keys(block).length === 0) {
            continue;
          }

          tagResults.push({
            'script:ld+json': block,
          });
        }

        break;
      }

      case 'alternates': {
        const alternates = ensureArray(dedupedSeoInput.alternates);

        for (const alternate of alternates) {
          if (!alternate) {
            continue;
          }

          const {language, url, default: defaultLang} = alternate;

          const hrefLang = language
            ? `${language}${defaultLang ? '-default' : ''}`
            : undefined;

          tagResults.push({
            tagName: 'link',
            rel: 'alternate',
            hrefLang,
            href: url,
          });
        }

        break;
      }

      case 'robots': {
        if (!dedupedSeoInput.robots) {
          break;
        }

        const {
          maxImagePreview,
          maxSnippet,
          maxVideoPreview,
          noArchive,
          noFollow,
          noImageIndex,
          noIndex,
          noSnippet,
          noTranslate,
          unavailableAfter,
        } = dedupedSeoInput.robots;

        const robotsParams = [
          noArchive && 'noarchive',
          noImageIndex && 'noimageindex',
          noSnippet && 'nosnippet',
          noTranslate && `notranslate`,
          maxImagePreview && `max-image-preview:${maxImagePreview}`,
          maxSnippet && `max-snippet:${maxSnippet}`,
          maxVideoPreview && `max-video-preview:${maxVideoPreview}`,
          unavailableAfter && `unavailable_after:${unavailableAfter}`,
        ];

        let robotsParam =
          (noIndex ? 'noindex' : 'index') +
          ',' +
          (noFollow ? 'nofollow' : 'follow');

        for (const param of robotsParams) {
          if (param) {
            robotsParam += `,${param}`;
          }
        }

        tagResults.push({name: 'robots', content: robotsParam});

        break;
      }

      default: {
        break;
      }
    }
  }

  return tagResults;
}
