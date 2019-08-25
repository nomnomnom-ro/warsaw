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
            <div className="appHeader">
              <h1 className="appTitle">Coin Composter</h1>
              <WalletAddress
                className="walletAddress"
                address={wallet ? wallet.address : undefined}
              />
            </div>
            <div className="appMain">
              <div className="top">
                <div className="explainer explainerMain">
                  Compost illiquid ERC20s; harvest farm fresh ETH.
                </div>
                <NomDashboard provider={provider} />
              </div>
              <div className="bottom">
                <div className="explainer">
                  <ol>
                    <li>Dump your ERC20s in the composter.</li>
                    <li>
                      The composter will gradually rot your ERC20s into ETH.
                    </li>
                    <li>
                      As your tokens are composted, you earn a stake
                      proportional to the value realised from the tokens you
                      composted.
                    </li>
                    <li>
                      Each week claim your share of the ETH until your Enzymes
                      run out.
                    </li>
                  </ol>
                </div>
                <TokensList provider={provider} />
              </div>
            </div>
            <img className="bwc" title="Built with Colony" src="bwc.png" />
          </div>
        )}
      </Provider>
    )}
  </MetaMask>
);
