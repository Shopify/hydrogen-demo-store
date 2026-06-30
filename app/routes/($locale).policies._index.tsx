import {type MetaArgs, type LoaderFunctionArgs} from 'react-router';
import {useLoaderData} from 'react-router';
import invariant from 'tiny-invariant';
import {gql} from '@shopify/hydrogen';

import {PageHeader, Section, Heading} from '~/components/Text';
import {Link} from '~/components/Link';
import {routeHeaders} from '~/data/cache';
import {seoPayload} from '~/lib/seo.server';
import {generateSeoMeta} from '~/lib/seo';
import {storefrontContext} from '~/storefront.context';
import type {NonNullableFields} from '~/lib/type';

export const headers = routeHeaders;

export async function loader({request, context}: LoaderFunctionArgs) {
  const client = context.get(storefrontContext);
  const {data} = await client.graphql(POLICIES_QUERY);

  invariant(data?.shop, 'No data returned from Shopify API');
  const policies = Object.values(
    data.shop as NonNullableFields<typeof data.shop>,
  ).filter(Boolean) as Array<{id: string; title: string; handle: string}>;

  if (policies.length === 0) {
    throw new Response('Not found', {status: 404});
  }

  const seo = seoPayload.policies({policies, url: request.url});

  return {
    policies,
    seo,
  };
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return generateSeoMeta(...matches.map((match) => (match.data as any)?.seo));
};

export default function Policies() {
  const {policies} = useLoaderData<typeof loader>();

  return (
    <>
      <PageHeader heading="Policies" />
      <Section padding="x" className="mb-24">
        {policies.map((policy) => {
          return (
            policy && (
              <Heading className="font-normal text-heading" key={policy.id}>
                <Link to={`/policies/${policy.handle}`}>{policy.title}</Link>
              </Heading>
            )
          );
        })}
      </Section>
    </>
  );
}

const POLICIES_QUERY = gql(`
  fragment PolicyIndex on ShopPolicy {
    id
    title
    handle
  }

  query PoliciesIndex {
    shop {
      privacyPolicy {
        ...PolicyIndex
      }
      shippingPolicy {
        ...PolicyIndex
      }
      termsOfService {
        ...PolicyIndex
      }
      refundPolicy {
        ...PolicyIndex
      }
      subscriptionPolicy {
        id
        title
        handle
      }
    }
  }
`);
