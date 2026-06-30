import {type ElementType} from 'react';
import {formatMoney} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';
import {useRouteLoaderData} from 'react-router';
import type {RootLoader} from '~/root';
import {DEFAULT_LOCALE} from '~/lib/utils';

function useLocaleString() {
  const root = useRouteLoaderData<RootLoader>('root');
  const locale = root?.selectedLocale ?? DEFAULT_LOCALE;
  return `${locale.language}-${locale.country}`;
}

export function useMoney(money: MoneyV2) {
  const locale = useLocaleString();
  return formatMoney(money, {locale});
}

type MoneyProps = {
  data: MoneyV2;
  as?: ElementType;
  withoutTrailingZeros?: boolean;
} & Record<string, unknown>;

export function Money({
  data,
  as,
  withoutTrailingZeros,
  ...passthrough
}: MoneyProps) {
  const locale = useLocaleString();
  const formatted = formatMoney(data, {locale, withoutTrailingZeros});
  const Tag = as ?? 'div';

  return (
    <Tag {...passthrough}>
      {withoutTrailingZeros
        ? formatted.withoutTrailingZeros
        : formatted.localizedString}
    </Tag>
  );
}
