import {
  type MetaArgs,
  type LinksFunction,
  type LoaderFunctionArgs,
} from 'react-router';
import {useLoaderData} from 'react-router';
import {gql} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';

import {Image} from '~/components/Image';
import {PageHeader, Section} from '~/components/Text';
import {seoPayload} from '~/lib/seo.server';
import {generateSeoMeta} from '~/lib/seo';
import {routeHeaders} from '~/data/cache';
import {getLocaleFromRequest} from '~/lib/utils';
import {storefrontContext} from '~/storefront.context';

import styles from '../styles/custom-font.css?url';

const BLOG_HANDLE = 'journal';

export const headers = routeHeaders;

export const links: LinksFunction = () => {
  return [{rel: 'stylesheet', href: styles}];
};

export async function loader({request, params, context}: LoaderFunctionArgs) {
  const client = context.get(storefrontContext);
  const {language, country} = getLocaleFromRequest(request);

  invariant(params.journalHandle, 'Missing journal handle');

  const {data} = await client.graphql(ARTICLE_QUERY, {
    variables: {
      blogHandle: BLOG_HANDLE,
      articleHandle: params.journalHandle,
    },
  });
  const blog = data?.blog;

  if (!blog?.articleByHandle) {
    throw new Response(null, {status: 404});
  }

  const article = blog.articleByHandle;

  const formattedDate = new Intl.DateTimeFormat(`${language}-${country}`, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article?.publishedAt!));

  const seo = seoPayload.article({article, url: request.url});

  return {article, formattedDate, seo};
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return generateSeoMeta(...matches.map((match) => (match.data as any)?.seo));
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

const ARTICLE_QUERY = gql(`
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
`);
