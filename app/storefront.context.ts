import {createContext} from 'react-router';
import type {RequestScopedPrivateStorefrontClient} from '@shopify/hydrogen';
import type {AppSession} from '~/lib/session.server';
import type {CustomerAccountClient} from '~/lib/customer-account.server';

export type OxygenContext = {
  env: Env;
  executionContext: ExecutionContext;
};

export const oxygenContext = createContext<OxygenContext>();
export const storefrontContext =
  createContext<RequestScopedPrivateStorefrontClient>();
export const sessionContext = createContext<AppSession>();
export const customerAccountContext = createContext<CustomerAccountClient>();
