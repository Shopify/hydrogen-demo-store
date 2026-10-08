import {useLoaderData, type LinksFunction} from 'react-router';
import invariant from 'tiny-invariant';

import styles from '../styles/custom-font.css?url';

import type {Route} from './+types/($locale).journal.$journalHandle';

import {PageHeader, Section} from '~/components/Text';
import {Image} from '~/components/Image';
import {seoPayload} from '~/lib/seo.server';
import {getSeoMeta} from '~/lib/seo-meta';
import {getLocaleFromRequest} from '~/lib/i18n';
import {routeHeaders} from '~/data/cache';
import {storefrontClientContext} from '~/lib/storefront';

const BLOG_HANDLE = 'journal';

export const headers = routeHeaders;

export const links: LinksFunction = () => {
  return [{rel: 'stylesheet', href: styles}];
};

export async function loader({request, params, context}: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const {language, country} = getLocaleFromRequest(request);

  invariant(params.journalHandle, 'Missing journal handle');

  const {data} = await storefrontClient.graphql(ARTICLE_QUERY, {
    variables: {
      blogHandle: BLOG_HANDLE,
      articleHandle: params.journalHandle,
    },
  });

  if (!data?.blog?.articleByHandle) {
    throw new Response(null, {status: 404});
  }

  const article = data.blog.articleByHandle;

  const formattedDate = new Intl.DateTimeFormat(`${language}-${country}`, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article?.publishedAt!));

  const seo = seoPayload.article({article, url: request.url});

  return {article, formattedDate, seo};
}

export const meta: Route.MetaFunction = ({matches}) => {
  return getSeoMeta(...matches.map((match) => (match?.data as any)?.seo));
};

export default function Article() {
  const {article, formattedDate} = useLoaderData<typeof loader>();

  const {title, image, contentHtml, author} = article;

  return (
    <>
      <PageHeader heading={title} variant="blogPost">
        <span>
          {formattedDate} &middot; {author?.name}
        </span>
      </PageHeader>
      <Section as="article" padding="x">
        {image && (
          <Image
            data={image}
            className="w-full mx-auto mt-8 md:mt-16 max-w-7xl"
            sizes="90vw"
            loading="eager"
          />
        )}
        <div
          dangerouslySetInnerHTML={{__html: contentHtml}}
          className="article"
        />
      </Section>
    </>
  );
}

const ARTICLE_QUERY = `#graphql
  query ArticleDetails(
    $language: LanguageCode
    $blogHandle: String!
    $articleHandle: String!
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      articleByHandle(handle: $articleHandle) {
        title
        contentHtml
        publishedAt
        author: authorV2 {
          name
        }
        image {
          id
          altText
          url
          width
          height
        }
        seo {
          description
          title
        }
      }
    }
  }
`;
