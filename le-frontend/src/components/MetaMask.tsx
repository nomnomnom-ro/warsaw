import React, { useEffect, useState, useCallback, ReactNode } from 'react';
// @ts-ignore
import { open, accountChangeHook } from '@colony/purser-metamask';

import './MetaMask.css';

interface Props {
  children: ({ wallet }: { wallet: any }) => ReactNode;
}

export const MetaMask = ({ children }: Props) => {
  const [wallet, setWallet] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState();
  const [metamaskError, setMetamaskError] = useState();
  const [timer, setTimer] = useState<any>();

  useEffect(() => {
    accountChangeHook((args: { selectedAddress: string }) => {
      setSelectedAddress(args.selectedAddress as any);
    });
    return () => {
      if ((window as any).web3) {
        (window as any).web3.currentProvider.publicConfigStore._events.update.pop();
      }
    };
  }, []);

  const walletAddress = wallet && (wallet as any).address;
  useEffect(() => {
    if (walletAddress && selectedAddress && selectedAddress !== walletAddress) {
      setWallet(null);
    }
  }, [selectedAddress, walletAddress]);

  const connectMetaMask = useCallback(async () => {
    let metamaskError = null;
    let wallet;
    try {
      wallet = await open();
      setWallet(wallet);
    } catch (error) {
      metamaskError = error.message;
    }
    setIsLoading(false);
    setIsValid(!metamaskError || !!(wallet && wallet.ensAddress));
    setMetamaskError(metamaskError);
  }, []);

  const reconnect = useCallback(() => {
    setIsLoading(true);
    setTimer(setTimeout(connectMetaMask, 500));
  }, [connectMetaMask]);

  useEffect(() => {
    connectMetaMask();
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [connectMetaMask, timer]);

  return (
    <div>
      {wallet ? (
        <>{children({ wallet })}</>
      ) : isValid ? (
        <div className="connectMetamask">
          <button onClick={connectMetaMask} disabled={isLoading}>
            Connect to MetaMask
          </button>
        </div>
      ) : (
        <div className="metamaskError">
          <p>Couldn't connect to MetaMask: {metamaskError}</p>
          <button onClick={reconnect} disabled={isLoading}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
};
