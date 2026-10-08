import {gql} from '@shopify/hydrogen/customer-account';

const ORDER_CARD_FRAGMENT = gql(`
  fragment OrderCard on Order {
    id
    number
    processedAt
    financialStatus
    fulfillments(first: 1) {
      nodes {
        status
      }
    }
    totalPrice {
      amount
      currencyCode
    }
    lineItems(first: 2) {
      edges {
        node {
          title
          image {
            altText
            height
            url
            width
          }
        }
      }
    }
  }
`);

const ADDRESS_PARTIAL_FRAGMENT = gql(`
  fragment AddressPartial on CustomerAddress {
    id
    formatted
    firstName
    lastName
    company
    address1
    address2
    territoryCode
    zoneCode
    city
    zip
    phoneNumber
  }
`);

const CUSTOMER_FRAGMENT = gql(
  `
  fragment CustomerDetails on Customer {
    firstName
    lastName
    phoneNumber {
      phoneNumber
    }
    emailAddress {
      emailAddress
    }
    defaultAddress {
      ...AddressPartial
    }
    addresses(first: 6) {
      edges {
        node {
          ...AddressPartial
        }
      }
    }
    orders(first: 250, sortKey: PROCESSED_AT, reverse: true) {
      edges {
        node {
          ...OrderCard
        }
      }
    }
  }
`,
  [ADDRESS_PARTIAL_FRAGMENT, ORDER_CARD_FRAGMENT],
);

// NOTE: https://shopify.dev/docs/api/customer/latest/queries/customer
export const CUSTOMER_DETAILS_QUERY = gql(
  `
  query CustomerDetails {
    customer {
      ...CustomerDetails
    }
  }
`,
  [CUSTOMER_FRAGMENT],
);
