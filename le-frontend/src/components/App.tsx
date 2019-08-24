/* eslint-disable jsx-a11y/accessible-emoji */

// @ts-ignore
import React from 'react';

import { MetaMask } from './MetaMask';
import { Provider } from './Provider';
import { TokensList } from './TokensList';

import './App.css';

export const App = () => (
  <div className="app">
    <header className="appHeader">
      <h1>nomnomnom 💩👉🍪</h1>
    </header>
    <main className="appMain">
      <MetaMask>
        {({ wallet }) => (
          <Provider wallet={wallet}>
            {({ provider }) => (
              <>
                <TokensList provider={provider} />
              </>
            )}
          </Provider>
        )}
      </MetaMask>
    </main>
  </div>
);
