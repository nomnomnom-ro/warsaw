import React, { useCallback, useEffect, useState, useMemo } from 'react';

import { TokenProvider } from '../lib/TokenProvider';
import './NomDashboard.css';

interface Props {
  provider?: TokenProvider;
}

export const NomDashboard = ({ provider }: Props) => {
  const [nomBalance, setNomBalance] = useState(0);
  const [enzymes, setEnzymes] = useState(0);
  const [rewardsPot, setRewardsPot] = useState(0);
  const [myRewards, setMyRewards] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [countdown, setCountdown] = useState('23:59:58'); // @todo

  const claim = useCallback(() => {
    setIsClaiming(true);
    console.log('claim');
    setTimeout(() => setIsClaiming(false), 1000);
  }, []);

  const trigger = useCallback(() => {
    setIsTriggering(true);
    console.log('trigger');
    setTimeout(() => setIsTriggering(false), 1000);
  }, []);

  return (
    <div className="dashboard">
      <div className="header">My Composter</div>
      <div className="content">
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
          <div className="itemHeader">Countdown</div>
          <div className="itemContent">
            <span className="balance">{countdown}</span>
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
              <button onClick={trigger} disabled={isTriggering}>
                Claim
              </button>
            </div>
          </div>
        </div>
        <div className="item">
          <div className="itemHeader">Rewards Pot</div>
          <div className="itemContent">
            <div className="myRewards">
              <span className="balance">{myRewards}</span>
              <span className="symbol">ETH</span>
            </div>
            <div>
              <button onClick={claim} disabled={isClaiming}>
                Claim
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
