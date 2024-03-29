/* eslint-disable jsx-a11y/accessible-emoji */

// @ts-ignore
import React, { useCallback, useEffect, useState } from 'react';
import { utils } from 'ethers';

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
  composted: string;
  deposited: string;
}

interface TokenTransfer {
  address: string;
  value: string;
  isSending: boolean;
  error: Error | void;
}

const getTokenImage = (address: string) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`;

const formatDecimals = (value: string) => parseInt(value, 10).toFixed(2);

export const TokensList = ({ provider }: Props) => {
  const [balances, setBalances] = useState<TokenBalance[]>();
  const [transfers, setTransfers] = useState<TokenTransfer[]>([]);

  useEffect(() => {
    // On mount, get all the things and set up the listener
    if (provider) {
      // Whenever any new event comes in, update all the things
      provider.warsaw.events.allEvents().on('data', () => {
        provider.getAllTokens().then(balances => setBalances(balances));
      });

      // Update all the things
      provider.getAllTokens().then(balances => {
        setBalances(balances);

        // Also set a value for transfers
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
      const token = balances.find(item => item.address === tokenAddress);

      if (!(provider && transfer && token)) return;
      if (parseInt(transfer.value, 10) <= 0) return;

      setTransfer(tokenAddress, { isSending: true, error: undefined });

      provider
        .transfer(
          tokenAddress,
          utils.parseUnits(transfer.value, token.decimals).toString(),
        )
        .catch((error: Error) => {
          console.error(error);
          setTransfer(tokenAddress, { error });
        })
        .then(() => {
          provider.getCompostTotals(tokenAddress).then(totals => {
            setBalance(tokenAddress, totals);
          });
          provider.getAllTokenBalances().then(balances => {
            const token = balances.find(
              balance => balance.address === tokenAddress,
            );
            if (token) {
              setBalance(tokenAddress, { balance: token.balance });
            }
          });
        })
        .finally(() => {
          setTransfer(tokenAddress, { isSending: false, error: undefined });
        });
    },
    [transfers, balances, provider, setTransfer, setBalance],
  );

  return (
    <div className="tokensList">
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
              (
                {
                  address,
                  balance,
                  composted,
                  deposited,
                  name,
                  symbol,
                }: TokenBalance,
                index,
              ) => {
                const transfer =
                  transfers[index] || ({ value: '0' } as TokenTransfer);
                return (
                  <tr key={address}>
                    <td className="tokenIcon">
                      <img src={getTokenImage(address)} />
                    </td>
                    <td className="tokenDetails">
                      <div className="tokenSymbol">{symbol}</div>
                      <div className="tokenName">{name}</div>
                    </td>
                    <td>
                      <div className="compostInput">
                        <div>
                          Max: {formatDecimals(balance)} {symbol}
                        </div>
                        <input
                          name={`compost-${address}`}
                          type="number"
                          min={0}
                          max={balance}
                          placeholder="Enter amount"
                          onClick={() => {
                            setTransferValue(address, balance);
                          }}
                          onChange={({ target: { value } }) =>
                            setTransferValue(address, value)
                          }
                          value={formatDecimals(transfer.value)}
                        />
                      </div>
                    </td>
                    <td className="compostingValue">
                      {formatDecimals(deposited)}
                    </td>
                    <td className="compostedValue">
                      {formatDecimals(composted)}
                    </td>
                    <td className="tokenActions">
                      {parseFloat(balance) > 0 ? (
                        <div
                          className={
                            transfer.isSending
                              ? 'sendButton disabled'
                              : 'sendButton'
                          }
                          onClick={() => send(address)}
                        />
                      ) : null}
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
