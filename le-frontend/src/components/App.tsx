/* eslint-disable jsx-a11y/accessible-emoji */

// @ts-ignore
import React from 'react';

import { MetaMask } from './MetaMask';
import { Provider } from './Provider';
import { TokensList } from './TokensList';
import { NomDashboard } from './NomDashboard';
import { WalletAddress } from './WalletAddress';

import './App.css';

export const App = () => (
  <MetaMask>
    {({ wallet }) => (
      <Provider wallet={wallet}>
        {({ provider }) => (
          <div className="app">
            <header className="appHeader">
              <h1>Coin Composter</h1>
              <WalletAddress
                className="walletAddress"
                address={wallet ? wallet.address : undefined}
              />
            </header>
            <div className="appMain">
              <div className="top">
                <div className="explainer">
                  Rot down your illiquid ERC20s into crypto compost. Grow fresh,
                  clean ETH.
                </div>
                <NomDashboard provider={provider} />
              </div>
              <div className="bottom">
                <div className="explainer">
                  <ol>
                    <li>Dump your coins into the composter</li>
                    <li>
                      The composter will gradually rot your coins down for you
                    </li>
                    <li>magic?</li>
                  </ol>
                </div>
                <TokensList provider={provider} />
              </div>
            </div>
          </div>
        )}
      </Provider>
    )}
  </MetaMask>
);
