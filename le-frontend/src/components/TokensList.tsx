/* eslint-disable jsx-a11y/accessible-emoji */

// @ts-ignore
import React, { useCallback, useEffect, useState } from 'react';

import { TokenProvider } from '../lib/TokenProvider';
import './TokensList.css';

interface Props {
  provider?: TokenProvider;
}

interface TokenBalance {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
}

interface TokenTransfer {
  address: string;
  value: string;
  isSending: boolean;
  error: Error | void;
}

export const TokensList = ({ provider }: Props) => {
  const [balances, setBalances] = useState<TokenBalance[]>();
  const [transfers, setTransfers] = useState<TokenTransfer[]>([]);

  useEffect(() => {
    if (provider) {
      provider.getAllTokenBalances().then(balances => {
        setBalances(balances);
        setTransfers(
          balances.map(({ address }) => ({
            address,
            value: '0',
            isSending: false,
            error: undefined,
          })),
        );
      });
    }
  }, [provider]);

  const setTransfer = useCallback(
    (tokenAddress: string, mod: Partial<TokenTransfer>) =>
      setTransfers(
        transfers.map(item =>
          item.address === tokenAddress
            ? ({ ...item, ...mod } as TokenTransfer)
            : item,
        ),
      ),
    [transfers],
  );

  const setBalance = useCallback(
    (tokenAddress: string, mod: Partial<TokenBalance>) =>
      setBalances(
        (balances || []).map(item =>
          item.address === tokenAddress
            ? ({ ...item, ...mod } as TokenBalance)
            : item,
        ),
      ),
    [balances],
  );

  const setTransferValue = useCallback(
    (tokenAddress: string, value: string) => {
      setTransfer(tokenAddress, { value });
    },
    [setTransfer],
  );

  const send = useCallback(
    (tokenAddress: string) => {
      const transfer = transfers.find(item => item.address === tokenAddress);

      if (!(provider && transfer)) return;
      if (parseInt(transfer.value, 10) <= 0) return;

      setTransfer(tokenAddress, { isSending: true, error: undefined });

      provider
        .transfer(tokenAddress, transfer.value)
        .catch((error: Error) => {
          console.error(error);
          setTransfer(tokenAddress, { error });
        })
        .then(() => {
          // provider.getTokenBalance(tokenAddress).then(balance => {
          //   setBalance(tokenAddress, { balance });
          // });
          console.log('ok');
        })
        .finally(() => {
          setTransfer(tokenAddress, { isSending: false, error: undefined });
        });
    },
    [transfers, provider, setTransfer],
  );

  return (
    <div>
      {balances ? (
        <table className="tokenBalances">
          <thead>
            <tr>
              <th></th>
              <th className="tokenHeading">ERC20</th>
              <th className="compostValueHeading">To Compost</th>
              <th className="compostingValueHeading">Composting</th>
              <th className="compostedValueHeading">Composted</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(balances || []).map(
              ({ address, name, symbol, balance }: TokenBalance, index) => {
                const transfer = transfers[index] || { value: '0' } as TokenTransfer;
                return (
                  <tr key={address}>
                    <td className="tokenIcon">💩</td>
                    <td>
                      <div className="tokenSymbol">{symbol}</div>
                      <div className="tokenName">{name}</div>
                    </td>
                    <td>
                      <div className="compostInput">
                        <div>
                          Max: {balance} {symbol}
                        </div>
                        <input
                          name={`compost-${address}`}
                          type="number"
                          min={0}
                          max={balance}
                          placeholder="Enter amount"
                          onChange={({ target: { value } }) =>
                            setTransferValue(address, value)
                          }
                        />
                      </div>
                    </td>
                    <td className="compostingValue">99.0</td>
                    <td className="compostedValue">1.0</td>
                    <td className="actions">
                      <button
                        disabled={transfer.isSending}
                        onClick={() => send(address)}
                      >
                        ↗️
                      </button>
                      <button
                        disabled={transfer.isSending}
                        onClick={() => {
                          console.log(`Reclaim ${address}`);
                        }}
                      >
                        ↙️
                      </button>
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      ) : (
        <p>No token balances</p>
      )}
    </div>
  );
};
