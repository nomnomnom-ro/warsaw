import React from 'react';
import Blockies from 'react-blockies';

import './WalletAddress.css';

interface Props {
  address: string | void;
  className?: string;
}

export const WalletAddress = ({ address }: Props) => {
  const slicedAddress =
    typeof address === 'string'
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : null;
  return (
    <div className="walletAddressContainer">
      {address ? (
        <>
          <span className="address">{slicedAddress}</span>
          <Blockies
            seed={address}
            size={5}
            scale={4}
            bgColor="#24242a"
            className="identicon"
          />
        </>
      ) : (
        <span className="notConnected">Not connected</span>
      )}
    </div>
  );
};
