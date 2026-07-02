type Connection<T> =
  | {nodes: T[]}
  | {edges: Array<{node: T}>}
  | null
  | undefined;

export function flattenConnection<T>(connection: Connection<T>): T[] {
  if (!connection) return [];
  if ('nodes' in connection && connection.nodes) return connection.nodes;
  if ('edges' in connection && connection.edges) {
    return connection.edges.map((edge) => edge.node);
  }
  return [];
}
