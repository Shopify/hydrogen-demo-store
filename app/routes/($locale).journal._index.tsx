import {useLoaderData} from 'react-router';
import {flattenConnection} from '@shopify/hydrogen';
import type {ArticleFragment} from 'storefrontapi.generated';

import type {Route} from './+types/($locale).journal._index';

import {PageHeader, Section} from '~/components/Text';
import {Link} from '~/components/Link';
import {Grid} from '~/components/Grid';
import {Image} from '~/components/Image';
import {getImageLoadingPriority, PAGINATION_SIZE} from '~/lib/const';
import {seoPayload} from '~/lib/seo.server';
import {getSeoMeta} from '~/lib/seo-meta';
import {getLocaleFromRequest} from '~/lib/i18n';
import {routeHeaders} from '~/data/cache';
import {storefrontClientContext} from '~/lib/storefront';

const BLOG_HANDLE = 'Journal';

export const headers = routeHeaders;

export const loader = async ({request, context}: Route.LoaderArgs) => {
  const storefrontClient = context.get(storefrontClientContext);
  const {language, country} = getLocaleFromRequest(request);
  const {data} = await storefrontClient.graphql(BLOGS_QUERY, {
    variables: {
      blogHandle: BLOG_HANDLE,
      pageBy: PAGINATION_SIZE,
    },
  });

  const blog = data?.blog;

  if (!blog?.articles) {
    throw new Response('Not found', {status: 404});
  }

  const articles = flattenConnection(blog.articles).map((article) => {
    const {publishedAt} = article!;
    return {
      ...article,
      publishedAt: new Intl.DateTimeFormat(`${language}-${country}`, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(publishedAt!)),
    };
  });

  const seo = seoPayload.blog({blog, url: request.url});

  return {articles, seo};
};

export const meta: Route.MetaFunction = ({matches}) => {
  return getSeoMeta(...matches.map((match) => (match?.data as any)?.seo));
};

export default function Journals() {
  const {articles} = useLoaderData<typeof loader>();

  return (
    <>
      <PageHeader heading={BLOG_HANDLE} />
      <Section>
        <Grid as="ol" layout="blog">
          {articles.map((article, i) => (
            <ArticleCard
              blogHandle={BLOG_HANDLE.toLowerCase()}
              article={article}
              key={article.id}
              loading={getImageLoadingPriority(i, 2)}
            />
          ))}
        </Grid>
      </Section>
    </>
  );
}

function ArticleCard({
  blogHandle,
  article,
  loading,
}: {
  blogHandle: string;
  article: ArticleFragment;
  loading?: HTMLImageElement['loading'];
}) {
  return (
    <li key={article.id}>
      <Link to={`/${blogHandle}/${article.handle}`}>
        {article.image && (
          <div className="card-image aspect-[3/2]">
            <Image
              alt={article.image.altText || article.title}
              className="object-cover w-full"
              data={article.image}
              aspectRatio="3/2"
              loading={loading}
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>
        )}
        <h2 className="mt-4 font-medium">{article.title}</h2>
        <span className="block mt-1">{article.publishedAt}</span>
      </Link>
    </li>
  );
}

const BLOGS_QUERY = `#graphql
query Blog(
  $language: LanguageCode
  $blogHandle: String!
  $pageBy: Int!
  $cursor: String
) @inContext(language: $language) {
  blog(handle: $blogHandle) {
    title
    seo {
      title
      description
    }
    articles(first: $pageBy, after: $cursor) {
      edges {
        node {
          ...Article
        }
      }
    }
  }
}

fragment Article on Article {
  author: authorV2 {
    name
  }
  contentHtml
  handle
  id
  image {
    id
    altText
    url
    width
    height
  }
  publishedAt
  title
}
`;
