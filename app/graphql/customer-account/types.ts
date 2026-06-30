import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

export type {MoneyV2};

export type FulfillmentStatus =
  | 'SUCCESS'
  | 'PENDING'
  | 'OPEN'
  | 'FAILURE'
  | 'ERROR'
  | 'CANCELLED';

export type CustomerImage = {
  altText?: string | null;
  height?: number | null;
  url: string;
  width?: number | null;
  id?: string | null;
};

export type CustomerAddress = {
  id: string;
  formatted?: string[] | null;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  address1?: string | null;
  address2?: string | null;
  territoryCode?: string | null;
  zoneCode?: string | null;
  city?: string | null;
  zip?: string | null;
  phoneNumber?: string | null;
};

export type CustomerAddressInput = {
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  zoneCode?: string;
  territoryCode?: string;
  zip?: string;
  phoneNumber?: string;
};

export type CustomerUpdateInput = {
  firstName?: string;
  lastName?: string;
};

type Connection<T> = {edges: {node: T}[]};
type NodeList<T> = {nodes: T[]};

export type OrderCardFragment = {
  id: string;
  number: number;
  processedAt: string;
  financialStatus?: string | null;
  fulfillments: NodeList<{status: FulfillmentStatus}>;
  totalPrice: MoneyV2;
  lineItems: Connection<{title: string; image?: CustomerImage | null}>;
};

export type CustomerDetailsFragment = {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: {phoneNumber: string} | null;
  emailAddress?: {emailAddress: string} | null;
  defaultAddress?: CustomerAddress | null;
  addresses: Connection<CustomerAddress>;
  orders: Connection<OrderCardFragment>;
};

export type Customer = CustomerDetailsFragment;

export type DiscountApplication = {
  value:
    | ({__typename: 'MoneyV2'} & MoneyV2)
    | {__typename: 'PricingPercentageValue'; percentage: number};
};

export type OrderLineItemFull = {
  id: string;
  title: string;
  quantity: number;
  price?: MoneyV2 | null;
  discountAllocations: {
    allocatedAmount: MoneyV2;
    discountApplication: DiscountApplication;
  }[];
  totalDiscount?: MoneyV2 | null;
  image?: CustomerImage | null;
  variantTitle?: string | null;
};

export type OrderFragment = {
  id: string;
  name: string;
  statusPageUrl?: string | null;
  processedAt: string;
  fulfillments: NodeList<{status: FulfillmentStatus}>;
  totalTax?: MoneyV2 | null;
  totalPrice: MoneyV2;
  subtotal?: MoneyV2 | null;
  shippingAddress?: {
    name?: string | null;
    formatted: string[];
    formattedArea?: string | null;
  } | null;
  discountApplications: NodeList<DiscountApplication>;
  lineItems: NodeList<OrderLineItemFull>;
};
