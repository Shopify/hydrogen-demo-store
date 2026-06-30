import {createContext, useContext, type ReactNode} from 'react';

const NonceContext = createContext<string | undefined>(undefined);

export function NonceProvider({
  value,
  children,
}: {
  value?: string;
  children: ReactNode;
}) {
  return (
    <NonceContext.Provider value={value}>{children}</NonceContext.Provider>
  );
}

export function useNonce() {
  return useContext(NonceContext);
}
