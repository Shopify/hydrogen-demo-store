import {formatMoney, type MoneyV2} from '@shopify/hydrogen';
import {useRouteLoaderData} from 'react-router';

import {DEFAULT_LOCALE} from '~/lib/i18n';
import type {RootLoader} from '~/root';

export function useMoneyLocale(): string {
  const data = useRouteLoaderData<RootLoader>('root');
  const locale = data?.selectedLocale ?? DEFAULT_LOCALE;
  return `${locale.language.toLowerCase()}-${locale.country}`;
}

export function useMoney(data: MoneyV2) {
  const locale = useMoneyLocale();
  return formatMoney(data, {locale});
}

type MoneyProps = {
  data: MoneyV2;
  as?: React.ElementType;
  withoutTrailingZeros?: boolean;
  withoutCurrency?: boolean;
  className?: string;
} & Record<string, unknown>;

export function Money({
  data,
  as: Component = 'div',
  withoutTrailingZeros,
  withoutCurrency,
  ...props
}: MoneyProps) {
  const locale = useMoneyLocale();
  const money = formatMoney(data, {
    locale,
    withoutTrailingZeros,
    withoutCurrency,
  });

  return <Component {...props}>{money.toString()}</Component>;
}
