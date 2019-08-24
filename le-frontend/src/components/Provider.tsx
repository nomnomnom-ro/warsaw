import React, { useEffect, useState, ReactNode } from 'react';

import { TokenProvider } from '../lib/TokenProvider';

interface Props {
  children: ({ provider }: { provider?: any }) => ReactNode;
  wallet?: any;
}

export const Provider = ({ wallet, children }: Props) => {
  const [provider, setProvider] = useState();

  useEffect(() => {
    setProvider(wallet ? new TokenProvider(wallet) : null);
  }, [wallet]);

  return <>{children({ provider })}</>;
};
