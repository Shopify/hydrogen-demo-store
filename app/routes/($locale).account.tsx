import {
  Await,
  Outlet,
  data,
  useLoaderData,
  useMatches,
  useOutlet,
} from 'react-router';
import {Suspense} from 'react';
import {flattenConnection} from '@shopify/hydrogen';
import type {
  CustomerDetailsFragment,
  OrderCardFragment,
} from 'customer-accountapi.generated';

import type {Route} from './+types/($locale).account';
import {
  getFeaturedData,
  type FeaturedData,
} from './($locale).featured-products';

import {PageHeader, Text} from '~/components/Text';
import {Button} from '~/components/Button';
import {OrderCard} from '~/components/OrderCard';
import {AccountDetails} from '~/components/AccountDetails';
import {AccountAddressBook} from '~/components/AccountAddressBook';
import {Modal} from '~/components/Modal';
import {ProductSwimlane} from '~/components/ProductSwimlane';
import {FeaturedCollections} from '~/components/FeaturedCollections';
import {CACHE_NONE, routeHeaders} from '~/data/cache';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';
import {getAuthenticatedCustomerClient} from '~/lib/customer-account.server';
import {
  envContext,
  storefrontClientContext,
  storefrontRequestContext,
} from '~/lib/storefront';
import {sessionManagerContext} from '~/lib/session.server';
import {getCustomerSession} from '~/lib/customer-session';

export const headers = routeHeaders;

export async function loader({request, context}: Route.LoaderArgs) {
  const env = context.get(envContext);
  const requestContext = context.get(storefrontRequestContext);
  const sessionManager = context.get(sessionManagerContext);
  const customerSession = getCustomerSession(env);

  const isLoggedIn = await customerSession.isLoggedIn(
    sessionManager,
    requestContext,
  );

  if (!isLoggedIn) {
    return data(
      {customer: null, heading: 'Account', featuredDataPromise: null},
      {headers: {'Cache-Control': CACHE_NONE}},
    );
  }

  const {client, accessToken} = await getAuthenticatedCustomerClient(
    request,
    context,
  );

  const {data: customerData, errors} = await client.graphql(
    CUSTOMER_DETAILS_QUERY,
    {accessToken},
  );

  if (errors?.length || !customerData?.customer) {
    throw new Response('Failed to load the customer account.', {status: 500});
  }

  const customer = customerData.customer;

  const heading = customer.firstName
    ? `Welcome, ${customer.firstName}.`
    : `Welcome to your account.`;

  const storefrontClient = context.get(storefrontClientContext);

  return data(
    {
      customer,
      heading,
      featuredDataPromise: getFeaturedData(storefrontClient),
    },
    {
      headers: {
        'Cache-Control': CACHE_NONE,
      },
    },
  );
}

export default function Authenticated() {
  const data = useLoaderData<typeof loader>();
  const outlet = useOutlet();
  const matches = useMatches();

  // routes that export handle { renderInModal: true }
  const renderOutletInModal = matches.some((match) => {
    const handle = match?.handle as {renderInModal?: boolean};
    return handle?.renderInModal;
  });

  if (!data.customer) {
    return <SignedOut />;
  }

  if (outlet) {
    if (renderOutletInModal) {
      return (
        <>
          <Modal cancelLink="/account">
            <Outlet context={{customer: data.customer}} />
          </Modal>
          <Account {...data} customer={data.customer} />
        </>
      );
    } else {
      return <Outlet context={{customer: data.customer}} />;
    }
  }

  return <Account {...data} customer={data.customer} />;
}

function SignedOut() {
  return (
    <PageHeader heading="Account">
      <div className="grid gap-4 w-48">
        <Text as="p">Sign in to see your orders and addresses.</Text>
        <a
          href="/account/login?return_to=/account"
          className="inline-block rounded font-medium text-center py-3 px-6 border border-primary/10 bg-primary text-contrast w-full"
        >
          Sign in
        </a>
      </div>
    </PageHeader>
  );
}

interface AccountType {
  customer: CustomerDetailsFragment;
  featuredDataPromise: Promise<FeaturedData> | null;
  heading: string;
}

function Account({customer, heading, featuredDataPromise}: AccountType) {
  const orders = flattenConnection(customer.orders);
  const addresses = flattenConnection(customer.addresses);

  return (
    <>
      <PageHeader heading={heading}>
        <form method="post" action="/account/logout">
          <button type="submit" className="text-primary/50">
            Sign out
          </button>
        </form>
      </PageHeader>
      {orders && <AccountOrderHistory orders={orders} />}
      <AccountDetails customer={customer} />
      <AccountAddressBook addresses={addresses} customer={customer} />
      {!orders.length && featuredDataPromise && (
        <Suspense>
          <Await
            resolve={featuredDataPromise}
            errorElement="There was a problem loading featured products."
          >
            {(data) => (
              <>
                <FeaturedCollections
                  title="Popular Collections"
                  collections={data.featuredCollections}
                />
                <ProductSwimlane products={data.featuredProducts} />
              </>
            )}
          </Await>
        </Suspense>
      )}
    </>
  );
}

type OrderCardsProps = {
  orders: OrderCardFragment[];
};

function AccountOrderHistory({orders}: OrderCardsProps) {
  return (
    <div className="mt-6">
      <div className="grid w-full gap-4 p-4 py-6 md:gap-8 md:p-8 lg:p-12">
        <h2 className="font-bold text-lead">Order History</h2>
        {orders?.length ? <Orders orders={orders} /> : <EmptyOrders />}
      </div>
    </div>
  );
}

function EmptyOrders() {
  return (
    <div>
      <Text className="mb-1" size="fine" width="narrow" as="p">
        You haven&apos;t placed any orders yet.
      </Text>
      <div className="w-48">
        <Button className="w-full mt-2 text-sm" variant="secondary" to="/">
          Start Shopping
        </Button>
      </div>
    </div>
  );
}

function Orders({orders}: OrderCardsProps) {
  return (
    <ul className="grid grid-flow-row grid-cols-1 gap-2 gap-y-6 md:gap-4 lg:gap-6 false sm:grid-cols-3">
      {orders.map((order) => (
        <OrderCard order={order} key={order.id} />
      ))}
    </ul>
  );
}
