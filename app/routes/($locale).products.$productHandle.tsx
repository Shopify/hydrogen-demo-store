import {useEffect, useRef, Suspense} from 'react';
import {Disclosure, Listbox} from '@headlessui/react';
import {Await, useLoaderData, useLocation, useNavigate} from 'react-router';
import {
  buildProductSelectionSearchParams,
  canAddToCart,
  getSelectedProductOptions,
} from '@shopify/hydrogen';
import {ShopPayButton} from '@shopify/hydrogen/react';
import invariant from 'tiny-invariant';
import clsx from 'clsx';

import type {Route} from './+types/($locale).products.$productHandle';

import {Heading, Section, Text} from '~/components/Text';
import {Link} from '~/components/Link';
import {Button} from '~/components/Button';
import {Money} from '~/components/Money';
import {Skeleton} from '~/components/Skeleton';
import {ProductSwimlane} from '~/components/ProductSwimlane';
import {ProductGallery} from '~/components/ProductGallery';
import {IconCaret, IconCheck, IconClose} from '~/components/Icon';
import {getExcerpt, usePrefixPathWithLocale} from '~/lib/utils';
import {seoPayload} from '~/lib/seo.server';
import {getSeoMeta} from '~/lib/seo-meta';
import {routeHeaders} from '~/data/cache';
import {MEDIA_FRAGMENT, PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {
  storefrontClientContext,
  type AppStorefrontClient,
} from '~/lib/storefront';
import {
  ProductProvider,
  useProductForm,
  type ProductData,
  type ProductVariantData,
} from '~/lib/product';
import {openCartDrawer} from '~/lib/cart-drawer';
import {AnalyticsEvent, getAnalytics} from '~/lib/analytics';

export const headers = routeHeaders;

export async function loader({params, request, context}: Route.LoaderArgs) {
  const {productHandle} = params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  const storefrontClient = context.get(storefrontClientContext);
  const selectedOptions = getSelectedProductOptions({
    searchParams: new URL(request.url).searchParams,
  });

  const {data} = await storefrontClient.graphql(PRODUCT_QUERY, {
    variables: {
      handle: productHandle,
      selectedOptions,
    },
  });

  invariant(data, 'No data returned from Shopify API');

  if (!data.product?.id) {
    throw new Response('product', {status: 404});
  }

  const product = {
    ...data.product,
    selectedOrFirstAvailableVariant:
      data.product.selectedOrFirstAvailableVariant ?? null,
  };
  const {shop} = data;

  const recommended = getRecommendedProducts(
    storefrontClient,
    product.id,
  ).catch((error) => {
    console.error(error);
    return null;
  });

  const variants = getAllProductVariants(product);
  const selectedVariant = product.selectedOrFirstAvailableVariant ?? {};

  const seo = seoPayload.product({
    product: {...product, variants},
    selectedVariant,
    url: request.url,
  });

  return {
    product,
    shop,
    recommended,
    seo,
  };
}

function getAllProductVariants(product: ProductData) {
  const variants = [
    product.selectedOrFirstAvailableVariant,
    ...product.adjacentVariants,
    ...product.options.flatMap((option) =>
      option.optionValues.map((value) => value.firstSelectableVariant),
    ),
  ].filter((variant): variant is ProductVariantData => Boolean(variant));

  return variants.filter(
    (variant, index, array) =>
      array.findIndex((otherVariant) => otherVariant.id === variant.id) ===
      index,
  );
}

export const meta: Route.MetaFunction = ({matches}) => {
  return getSeoMeta(...matches.map((match) => (match?.data as any)?.seo));
};

export default function Product() {
  const {product, shop, recommended} = useLoaderData<typeof loader>();
  const {media, title, vendor, descriptionHtml} = product;
  const {shippingPolicy, refundPolicy} = shop;
  const navigate = useNavigate();
  const location = useLocation();
  const productsPath = usePrefixPathWithLocale('/products');

  return (
    <ProductProvider
      product={product}
      onSelect={(result) => {
        const search = buildProductSelectionSearchParams({
          selectedOptions: result.selectedOptions,
          optionNames: product.options.map((option) => option.name),
          base: new URLSearchParams(location.search),
        }).toString();
        const currentSearch = new URLSearchParams(location.search).toString();
        if (search === currentSearch) return;
        void navigate(
          `${productsPath}/${product.handle}${search ? `?${search}` : ''}`,
          {replace: true, preventScrollReset: true},
        );
      }}
    >
      <Section className="px-0 md:px-8 lg:px-12">
        <div className="grid items-start md:gap-6 lg:gap-20 md:grid-cols-2 lg:grid-cols-3">
          <ProductGallery
            media={media.nodes}
            className="w-full lg:col-span-2"
          />
          <div className="sticky md:-mb-nav md:top-nav md:-translate-y-nav md:h-screen md:pt-nav hiddenScroll md:overflow-y-scroll">
            <section className="flex flex-col w-full max-w-xl gap-8 p-6 md:mx-auto md:max-w-sm md:px-0">
              <div className="grid gap-2">
                <Heading as="h1" className="whitespace-normal">
                  {title}
                </Heading>
                {vendor && (
                  <Text className={'opacity-50 font-medium'}>{vendor}</Text>
                )}
              </div>
              <ProductForm product={product} />
              <div className="grid gap-4 py-4">
                {descriptionHtml && (
                  <ProductDetail
                    title="Product Details"
                    content={descriptionHtml}
                  />
                )}
                {shippingPolicy?.body && (
                  <ProductDetail
                    title="Shipping"
                    content={getExcerpt(shippingPolicy.body)}
                    learnMore={`/policies/${shippingPolicy.handle}`}
                  />
                )}
                {refundPolicy?.body && (
                  <ProductDetail
                    title="Returns"
                    content={getExcerpt(refundPolicy.body)}
                    learnMore={`/policies/${refundPolicy.handle}`}
                  />
                )}
              </div>
            </section>
          </div>
        </div>
      </Section>
      <Suspense fallback={<Skeleton className="h-32" />}>
        <Await
          errorElement="There was a problem loading related products"
          resolve={recommended}
        >
          {(products) =>
            products ? (
              <ProductSwimlane title="Related Products" products={products} />
            ) : null
          }
        </Await>
      </Suspense>
      <ProductViewTracker product={product} />
    </ProductProvider>
  );
}

function ProductViewTracker({product}: {product: ProductData}) {
  const lastPublishedId = useRef<string | null>(null);
  const selectedVariant = product.selectedOrFirstAvailableVariant;

  useEffect(() => {
    if (lastPublishedId.current === product.id) return;
    lastPublishedId.current = product.id;
    getAnalytics()?.publish(AnalyticsEvent.PRODUCT_VIEWED, {
      products: [
        {
          id: product.id,
          title: product.title,
          price: selectedVariant?.price.amount || '0',
          vendor: product.vendor,
          variantId: selectedVariant?.id || '',
          variantTitle: selectedVariant?.title || '',
          quantity: 1,
        },
      ],
      url: window.location.href,
    });
  }, [product, selectedVariant]);

  return null;
}

export function ProductForm({product}: {product: ProductData}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const {options, selectedVariant, register, formProps, errors, pending} =
    useProductForm();

  const addable = canAddToCart(product, options);
  const hidePicker = options.every((option) => option.values.length <= 1);
  const optionNames = product.options.map((option) => option.name);

  const optionValueUrl = (value: {
    selectedOptions: readonly {name: string; value: string}[];
    handle: string;
  }) => {
    const search = buildProductSelectionSearchParams({
      selectedOptions: value.selectedOptions,
      optionNames,
      base: new URLSearchParams(location.search),
    }).toString();
    return `/products/${value.handle}${search ? `?${search}` : ''}`;
  };

  const isOutOfStock = !selectedVariant?.availableForSale;

  const isOnSale =
    selectedVariant?.price?.amount &&
    selectedVariant?.compareAtPrice?.amount &&
    selectedVariant?.price?.amount < selectedVariant?.compareAtPrice?.amount;

  return (
    <div className="grid gap-10">
      <div className="grid gap-4">
        {!hidePicker &&
          options.map((option, optionIndex) => (
            <div
              key={option.name}
              className="product-options flex flex-col flex-wrap mb-4 gap-y-2 last:mb-0"
            >
              <Heading as="legend" size="lead" className="min-w-[4rem]">
                {option.name}
              </Heading>
              <div className="flex flex-wrap items-baseline gap-4">
                {option.values.length > 7 ? (
                  <div className="relative w-full">
                    <Listbox>
                      {({open}) => (
                        <>
                          <Listbox.Button
                            ref={closeRef}
                            className={clsx(
                              'flex items-center justify-between w-full py-3 px-4 border border-primary',
                              open
                                ? 'rounded-b md:rounded-t md:rounded-b-none'
                                : 'rounded',
                            )}
                          >
                            <span>
                              {
                                selectedVariant?.selectedOptions[optionIndex]
                                  ?.value
                              }
                            </span>
                            <IconCaret direction={open ? 'up' : 'down'} />
                          </Listbox.Button>
                          <Listbox.Options
                            className={clsx(
                              'border-primary bg-contrast absolute bottom-12 z-30 grid h-48 w-full overflow-y-scroll rounded-t border px-2 py-2 transition-[max-height] duration-150 sm:bottom-auto md:rounded-b md:rounded-t-none md:border-t-0 md:border-b',
                              open ? 'max-h-48' : 'max-h-0',
                            )}
                          >
                            {option.values
                              .filter((value) => value.available)
                              .map((value) => {
                                const isDifferentProduct =
                                  value.handle !== product.handle;
                                const registered = isDifferentProduct
                                  ? null
                                  : register('optionValue', {
                                      optionName: option.name,
                                      value: value.name,
                                    });

                                return (
                                  <Listbox.Option
                                    key={`option-${option.name}-${value.name}`}
                                    value={value.name}
                                  >
                                    <Link
                                      {...(registered
                                        ? {rel: 'nofollow', ...registered}
                                        : {})}
                                      to={optionValueUrl(value)}
                                      preventScrollReset
                                      aria-current={
                                        value.selected ? 'true' : undefined
                                      }
                                      className={clsx(
                                        'text-primary w-full p-2 transition rounded flex justify-start items-center text-left cursor-pointer',
                                        value.selected && 'bg-primary/10',
                                      )}
                                      onClick={() => {
                                        registered?.onClick?.();
                                        if (!closeRef?.current) return;
                                        closeRef.current.click();
                                      }}
                                    >
                                      {value.name}
                                      {value.selected && (
                                        <span className="ml-2">
                                          <IconCheck />
                                        </span>
                                      )}
                                    </Link>
                                  </Listbox.Option>
                                );
                              })}
                          </Listbox.Options>
                        </>
                      )}
                    </Listbox>
                  </div>
                ) : (
                  option.values.map((value) => {
                    const isDifferentProduct = value.handle !== product.handle;
                    const valueClassName = clsx(
                      'leading-none py-1 border-b-[1.5px] cursor-pointer transition-all duration-200',
                      value.selected ? 'border-primary/50' : 'border-primary/0',
                      value.available ? 'opacity-100' : 'opacity-50',
                    );

                    if (!value.exists) {
                      return (
                        <button
                          key={option.name + value.name}
                          type="button"
                          disabled
                          aria-pressed={value.selected}
                          className={clsx(valueClassName, 'opacity-20')}
                        >
                          <ProductOptionSwatch
                            swatch={value.swatch}
                            name={value.name}
                          />
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={option.name + value.name}
                        {...(!isDifferentProduct
                          ? {
                              rel: 'nofollow',
                              ...register('optionValue', {
                                optionName: option.name,
                                value: value.name,
                              }),
                            }
                          : {})}
                        to={optionValueUrl(value)}
                        preventScrollReset
                        prefetch="intent"
                        replace
                        aria-current={value.selected ? 'true' : undefined}
                        data-available={value.available ? 'true' : 'false'}
                        className={valueClassName}
                      >
                        <ProductOptionSwatch
                          swatch={value.swatch}
                          name={value.name}
                        />
                        {!value.available ? (
                          <span className="sr-only"> (Sold out)</span>
                        ) : null}
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        <div className="grid items-stretch gap-4">
          <form {...formProps({beforeSubmit: openCartDrawer})}>
            <input type="hidden" {...register('merchandiseId', {})} />
            <input type="hidden" {...register('quantity', {value: 1})} />
            <Button
              as="button"
              width="full"
              variant={addable ? 'primary' : 'secondary'}
              disabled={!addable || pending}
              data-test="add-to-cart"
              {...register('addToCart', {})}
            >
              {addable ? (
                <Text
                  as="span"
                  className="flex items-center justify-center gap-2"
                >
                  <span>Add to Cart</span> <span>·</span>{' '}
                  <Money
                    withoutTrailingZeros
                    data={selectedVariant?.price!}
                    as="span"
                    data-test="price"
                  />
                  {isOnSale && (
                    <Money
                      withoutTrailingZeros
                      data={selectedVariant?.compareAtPrice!}
                      as="span"
                      className="opacity-50 strike"
                    />
                  )}
                </Text>
              ) : (
                <Text as="span">
                  {!selectedVariant
                    ? 'Select options'
                    : isOutOfStock
                    ? 'Sold out'
                    : 'Unavailable'}
                </Text>
              )}
            </Button>
          </form>
          {selectedVariant ? (
            <ShopPayButton
              variants={[{id: selectedVariant.id, quantity: 1}]}
              disabled={!addable || pending}
              width="100%"
            />
          ) : null}
          {errors?.userErrors?.length ? (
            <Text className="text-red-500">
              {errors.userErrors
                .map((error) => error.message)
                .filter(Boolean)
                .join(' ')}
            </Text>
          ) : null}
          {errors?.networkErrors?.length ? (
            <Text className="text-red-500">
              Something went wrong. Please try again.
            </Text>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProductOptionSwatch({
  swatch,
  name,
}: {
  swatch?: ProductData['options'][number]['optionValues'][number]['swatch'];
  name: string;
}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) return name;

  return (
    <div
      aria-label={name}
      className="w-8 h-8"
      style={{
        backgroundColor: color || 'transparent',
      }}
    >
      {!!image && <img src={image} alt={name} />}
    </div>
  );
}

function ProductDetail({
  title,
  content,
  learnMore,
}: {
  title: string;
  content: string;
  learnMore?: string;
}) {
  return (
    <Disclosure key={title} as="div" className="grid w-full gap-2">
      {({open}) => (
        <>
          <Disclosure.Button className="text-left">
            <div className="flex justify-between">
              <Text size="lead" as="h4">
                {title}
              </Text>
              <IconClose
                className={clsx(
                  'transition-transform transform-gpu duration-200',
                  !open && 'rotate-[45deg]',
                )}
              />
            </div>
          </Disclosure.Button>

          <Disclosure.Panel className={'pb-4 pt-2 grid gap-2'}>
            <div
              className="prose dark:prose-invert"
              dangerouslySetInnerHTML={{__html: content}}
            />
            {learnMore && (
              <div className="">
                <Link
                  className="pb-px border-b border-primary/30 text-primary/50"
                  to={learnMore}
                >
                  Learn more
                </Link>
              </div>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    id
    availableForSale
    selectedOptions {
      name
      value
    }
    image {
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
    media(first: 7) {
      nodes {
        ...Media
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
    shop {
      name
      primaryDomain {
        url
      }
      shippingPolicy {
        body
        handle
      }
      refundPolicy {
        body
        handle
      }
    }
  }
  ${MEDIA_FRAGMENT}
  ${PRODUCT_FRAGMENT}
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  query productRecommendations(
    $productId: ID!
    $count: Int
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    recommended: productRecommendations(productId: $productId) {
      ...ProductCard
    }
    additional: products(first: $count, sortKey: BEST_SELLING) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

async function getRecommendedProducts(
  storefrontClient: AppStorefrontClient,
  productId: string,
) {
  const {data} = await storefrontClient.graphql(RECOMMENDED_PRODUCTS_QUERY, {
    variables: {productId, count: 12},
  });

  invariant(data, 'No data returned from Shopify API');

  const mergedProducts = (data.recommended ?? [])
    .concat(data.additional.nodes)
    .filter(
      (value, index, array) =>
        array.findIndex((value2) => value2.id === value.id) === index,
    );

  const originalProduct = mergedProducts.findIndex(
    (item) => item.id === productId,
  );

  mergedProducts.splice(originalProduct, 1);

  return {nodes: mergedProducts};
}
