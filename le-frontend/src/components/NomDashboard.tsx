import React, { useCallback, useEffect, useState } from 'react';

import { TokenProvider } from '../lib/TokenProvider';
import './NomDashboard.css';

interface Props {
  provider?: TokenProvider;
}

export const NomDashboard = ({ provider }: Props) => {
  const [nomBalance, setNomBalance] = useState(0);
  const [enzymes, setEnzymes] = useState(0);
  const [rewardsPot, setRewardsPot] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);

  const claim = useCallback(() => {
    setIsClaiming(true);
    console.log('claim');
    setTimeout(() => setIsClaiming(false), 1000);
  }, []);

  return (
    <div className="dashboard">
      <div className="item">
        <div className="itemHeader">Balance</div>
        <div className="itemContent">
          <span className="balance">{nomBalance}</span>
          <span className="symbol">NOM</span>
        </div>
      </div>
      <div className="item">
        <div className="itemHeader">Enzymes</div>
        <div className="itemContent">
          <span className="balance">{enzymes}</span>
        </div>
      </div>
      <div className="item">
        <div className="itemHeader">Rewards Pot</div>
        <div className="itemContent">
          <div className="rewardsPot">
            <span className="balance">{rewardsPot}</span>
            <span className="symbol">ETH</span>
          </div>
          <div>
            <button className="claimButton" onClick={claim} disabled={isClaiming}>
              Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
