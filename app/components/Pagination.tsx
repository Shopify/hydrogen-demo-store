import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import {Link, useNavigation, useLocation} from 'react-router';

type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
};

type Connection<NodeType> = {
  nodes: Array<NodeType>;
  pageInfo: PageInfo;
};

type LinkComponent = (
  props: Omit<ComponentPropsWithoutRef<typeof Link>, 'to'>,
) => ReactNode;

type PaginationRenderProps<NodeType> = {
  nodes: Array<NodeType>;
  isLoading: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPageUrl: string;
  previousPageUrl: string;
  PreviousLink: LinkComponent;
  NextLink: LinkComponent;
  state: {nodes: Array<NodeType>; pageInfo: PageInfo};
};

type PaginationProps<NodeType> = {
  connection: Connection<NodeType>;
  children: (props: PaginationRenderProps<NodeType>) => ReactNode;
};

function buildPageUrl(
  search: string,
  direction: 'previous' | 'next',
  cursor?: string | null,
) {
  const params = new URLSearchParams(search);
  params.set('direction', direction);
  if (cursor) params.set('cursor', cursor);
  return `?${params.toString()}`;
}

export function Pagination<NodeType>({
  connection,
  children,
}: PaginationProps<NodeType>) {
  const navigation = useNavigation();
  const {search} = useLocation();
  const {nodes, pageInfo} = connection;
  const {hasNextPage, hasPreviousPage, startCursor, endCursor} = pageInfo;

  const isLoading = navigation.state !== 'idle';
  const previousPageUrl = buildPageUrl(search, 'previous', startCursor);
  const nextPageUrl = buildPageUrl(search, 'next', endCursor);

  const PreviousLink: LinkComponent = forwardRef<HTMLAnchorElement>(
    (props, ref) =>
      hasPreviousPage ? (
        <Link
          ref={ref}
          to={previousPageUrl}
          preventScrollReset
          prefetch="intent"
          {...props}
        />
      ) : null,
  ) as unknown as LinkComponent;

  const NextLink: LinkComponent = forwardRef<HTMLAnchorElement>((props, ref) =>
    hasNextPage ? (
      <Link
        ref={ref}
        to={nextPageUrl}
        preventScrollReset
        prefetch="intent"
        {...props}
      />
    ) : null,
  ) as unknown as LinkComponent;

  return children({
    nodes,
    isLoading,
    hasNextPage,
    hasPreviousPage,
    nextPageUrl,
    previousPageUrl,
    PreviousLink,
    NextLink,
    state: {nodes, pageInfo},
  });
}
