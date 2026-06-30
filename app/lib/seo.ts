import type {MetaDescriptor} from 'react-router';

export type SeoMedia = {
  type?: string;
  url?: string | null;
  height?: number | null;
  width?: number | null;
  altText?: string | null;
};

export type SeoConfig = {
  title?: string | null;
  titleTemplate?: string | null;
  description?: string | null;
  handle?: string;
  url?: string;
  media?: SeoMedia | {url?: string | null} | null;
  robots?: {noIndex?: boolean; noFollow?: boolean};
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
};

function applyTemplate(title?: string | null, template?: string | null) {
  if (!title) return template ? template.replace('%s', '').trim() : undefined;
  if (!template) return title;
  return template.replace('%s', title);
}

export function generateSeoMeta(
  ...seoConfigs: Array<SeoConfig | null | undefined>
): MetaDescriptor[] {
  const seo: SeoConfig = {};
  const jsonLdBlocks: any[] = [];

  for (const config of seoConfigs) {
    if (!config) continue;
    const {jsonLd, ...rest} = config;
    for (const [key, value] of Object.entries(rest)) {
      if (value != null) (seo as Record<string, unknown>)[key] = value;
    }
    if (jsonLd) {
      jsonLdBlocks.push(...(Array.isArray(jsonLd) ? jsonLd : [jsonLd]));
    }
  }

  const descriptors: MetaDescriptor[] = [];
  const title = applyTemplate(seo.title, seo.titleTemplate);

  if (title) {
    descriptors.push({title});
    descriptors.push({property: 'og:title', content: title});
    descriptors.push({name: 'twitter:title', content: title});
  }

  if (seo.description) {
    descriptors.push({name: 'description', content: seo.description});
    descriptors.push({property: 'og:description', content: seo.description});
    descriptors.push({name: 'twitter:description', content: seo.description});
  }

  if (seo.url) {
    descriptors.push({property: 'og:url', content: seo.url});
    descriptors.push({tagName: 'link', rel: 'canonical', href: seo.url});
  }

  descriptors.push({property: 'og:type', content: 'website'});
  descriptors.push({property: 'og:site_name', content: 'Hydrogen Demo Store'});

  const mediaUrl =
    seo.media && 'url' in seo.media ? (seo.media.url ?? undefined) : undefined;
  descriptors.push({name: 'twitter:card', content: 'summary_large_image'});
  if (mediaUrl) {
    descriptors.push({property: 'og:image', content: mediaUrl});
    descriptors.push({name: 'twitter:image', content: mediaUrl});
  }

  if (seo.handle) {
    descriptors.push({name: 'twitter:site', content: seo.handle});
    descriptors.push({name: 'twitter:creator', content: seo.handle});
  }

  if (seo.robots) {
    const content = [
      seo.robots.noIndex ? 'noindex' : 'index',
      seo.robots.noFollow ? 'nofollow' : 'follow',
    ].join(',');
    descriptors.push({name: 'robots', content});
  }

  for (const block of jsonLdBlocks) {
    descriptors.push({'script:ld+json': block} as MetaDescriptor);
  }

  return descriptors;
}
