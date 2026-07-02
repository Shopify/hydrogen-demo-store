import {gql} from '@shopify/hydrogen';
import type {ResultOf} from '~/lib/graphql-types';

export const MEDIA_FRAGMENT = gql(`
  fragment Media on Media {
    __typename
    mediaContentType
    alt
    previewImage {
      url
    }
    ... on MediaImage {
      id
      image {
        id
        url
        width
        height
      }
    }
    ... on Video {
      id
      sources {
        mimeType
        url
      }
    }
    ... on Model3d {
      id
      sources {
        mimeType
        url
      }
    }
    ... on ExternalVideo {
      id
      embedUrl
      host
    }
  }
`);

export const PRODUCT_CARD_FRAGMENT = gql(`
  fragment ProductCard on Product {
    id
    title
    publishedAt
    handle
    vendor
    variants(first: 1) {
      nodes {
        id
        availableForSale
        image {
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
        selectedOptions {
          name
          value
        }
        product {
          handle
          title
        }
      }
    }
  }
`);

export const FEATURED_COLLECTION_FRAGMENT = gql(`
  fragment FeaturedCollectionDetails on Collection {
    id
    title
    handle
    image {
      altText
      width
      height
      url
    }
  }
`);

export const COLLECTION_CONTENT_FRAGMENT = gql(
  `
  fragment CollectionContent on Collection {
    id
    handle
    title
    descriptionHtml
    heading: metafield(namespace: "hero", key: "title") {
      value
    }
    byline: metafield(namespace: "hero", key: "byline") {
      value
    }
    cta: metafield(namespace: "hero", key: "cta") {
      value
    }
    spread: metafield(namespace: "hero", key: "spread") {
      reference {
        ...Media
      }
    }
    spreadSecondary: metafield(namespace: "hero", key: "spread_secondary") {
      reference {
        ...Media
      }
    }
  }
`,
  [MEDIA_FRAGMENT],
);

const FRAGMENT_TYPES_QUERY = gql(
  `
  query _FragmentTypes {
    media: product(handle: "") {
      media(first: 1) {
        nodes {
          ...Media
        }
      }
    }
    productCard: product(handle: "") {
      ...ProductCard
    }
    featuredCollection: collection(handle: "") {
      ...FeaturedCollectionDetails
    }
    collectionContent: collection(handle: "") {
      ...CollectionContent
    }
  }
`,
  [
    MEDIA_FRAGMENT,
    PRODUCT_CARD_FRAGMENT,
    FEATURED_COLLECTION_FRAGMENT,
    COLLECTION_CONTENT_FRAGMENT,
  ],
);

type FragmentTypes = ResultOf<typeof FRAGMENT_TYPES_QUERY>;

export type MediaFragment = NonNullable<
  NonNullable<FragmentTypes['media']>['media']['nodes'][number]
>;
export type ProductCardFragment = NonNullable<FragmentTypes['productCard']>;
export type FeaturedCollectionFragment = NonNullable<
  FragmentTypes['featuredCollection']
>;
export type CollectionContentFragment = NonNullable<
  FragmentTypes['collectionContent']
>;
