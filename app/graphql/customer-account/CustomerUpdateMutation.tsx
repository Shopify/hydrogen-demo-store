import {gql} from '@shopify/hydrogen/customer-account';

export const CUSTOMER_UPDATE_MUTATION = gql(`
  mutation customerUpdate($customer: CustomerUpdateInput!) {
    customerUpdate(input: $customer) {
      userErrors {
        code
        field
        message
      }
    }
  }
`);
