import {useFetchers} from 'react-router';

export function useCartFetchers(intent: string) {
  const fetchers = useFetchers();
  const cartFetchers = [];

  for (const fetcher of fetchers) {
    if (
      fetcher.formData &&
      fetcher.formAction?.includes('/api/cart') &&
      fetcher.formData.get('intent') === intent
    ) {
      cartFetchers.push(fetcher);
    }
  }
  return cartFetchers;
}
