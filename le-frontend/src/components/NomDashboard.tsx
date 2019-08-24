import React, { useCallback, useEffect, useState, useRef } from 'react';

import { TokenProvider } from '../lib/TokenProvider';
import './NomDashboard.css';

interface Props {
  provider?: TokenProvider;
}

const padTime = (t: number) => (t < 10 ? String(t).padStart(2, '0') : t);

const formatTimeToPayout = (timeToPayout: number) => {
  const hours = Math.floor(timeToPayout / 3600);
  const minutes = Math.floor((timeToPayout - hours * 3600) / 60);
  const seconds = Math.floor(timeToPayout - hours * 3600 - minutes * 60);

  return `${padTime(hours)}:${padTime(minutes)}:${padTime(seconds)}`;
};

export const NomDashboard = ({ provider }: Props) => {
  const timeToPayoutInterval = useRef<any>();
  const [nomBalance, setNomBalance] = useState('0');
  const [enzymes, setEnzymes] = useState('0');
  const [rewardsPot, setRewardsPot] = useState('0');
  const [myRewards, setMyRewards] = useState('0');
  const [isClaiming, setIsClaiming] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [timeToPayout, setTimeToPayout] = useState();

  useEffect(() => {
    if (!provider) return;

    provider
      .getEnzymes()
      .catch((error: Error) => {
        console.error(error);
      })
      .then(reputationAmount => {
        reputationAmount && setEnzymes(reputationAmount);
      });

    provider
      .getTimeToPayout()
      .catch((error: Error) => {
        console.error(error);
      })
      .then((timeToPayout: number) => {
        setTimeToPayout(timeToPayout);
      });

    provider
      .getNoms()
      .catch((error: Error) => {
        console.error(error);
      })
      .then(noms => {
        if (noms) setNomBalance(noms);
      });

    provider
      .getMyRewards()
      .catch((error: Error) => {
        console.error(error);
      })
      .then(eth => {
        if (eth) setMyRewards(eth);
      });

    provider
      .getRewardsPot()
      .catch((error: Error) => {
        console.error(error);
      })
      .then(eth => {
        if (eth) setRewardsPot(eth);
      });
  }, [provider]);

  useEffect(() => {
    if (typeof timeToPayout === 'number') {
      timeToPayoutInterval.current = setInterval(() => {
        if (timeToPayout > 0) setTimeToPayout(timeToPayout - 1);
      }, 1000);
    }
    return () => {
      if (timeToPayoutInterval.current)
        clearInterval(timeToPayoutInterval.current);
    };
  }, [timeToPayout]);

  const claim = useCallback(() => {
    setIsClaiming(true);
    setTimeout(() => setIsClaiming(false), 1000);
  }, []);

  const trigger = useCallback(() => {
    setIsTriggering(true);
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
            <span className="balance">{formatTimeToPayout(timeToPayout)}</span>
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
                Trigger
              </button>
            </div>
          </div>
        </div>
        <div className="item">
          <div className="itemHeader">My Rewards</div>
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
