export type PaginationVariables = {
  first: number | null;
  last: number | null;
  startCursor: string | null;
  endCursor: string | null;
};

export function getPaginationVariables(
  request: Request,
  {pageBy}: {pageBy: number},
): PaginationVariables {
  if (typeof request?.url === 'undefined') {
    throw new Error('getPaginationVariables requires a Request argument');
  }

  const {searchParams} = new URL(request.url);
  const cursor = searchParams.get('cursor') ?? null;
  const direction =
    searchParams.get('direction') === 'previous' ? 'previous' : 'next';

  if (direction === 'previous') {
    return {first: null, last: pageBy, startCursor: cursor, endCursor: null};
  }

  return {first: pageBy, last: null, startCursor: null, endCursor: cursor};
}
