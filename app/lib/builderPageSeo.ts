import {truncate} from '~/lib/helpers/truncate';

/**
 * Generates SEO metadata for a builder page.
 *
 * @param data - The data object containing information for SEO, which may include properties like title, description, and media.
 * @param url - The URL of the page for SEO purposes.
 * @returns An object containing SEO metadata including title, description, media, and URL.
 */
export const builderPageSeo = (data: any, url: Request['url']) => {
  return {
    /**
     * The title for the page, falling back to a default value if not provided.
     */
    title:
      data?.builderPage?.data?.title ??
      data?.page?.seo?.title ??
      'ZOX - Elastic Bracelets and Watchbands With Hidden Affirmations',

    /**
     * A template for the page title, allowing for dynamic insertion of the page title followed by a fixed suffix.
     */
    titleTemplate: '%s | ZOX',

    /**
     * The description for the page, truncated if necessary.
     */
    description: truncate(
      data?.builderPage?.data?.description ?? data?.page?.seo?.description,
    ),

    /**
     * Media information for the page, defaulting to an image type.
     */
    media: {
      type: 'image',
      url: data?.builderPage?.data?.media ?? data?.collection?.image?.url,
    },

    /**
     * The URL of the page.
     */
    url,
  };
};
