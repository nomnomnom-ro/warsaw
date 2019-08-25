/*
  This file is part of The Colony Network.

  The Colony Network is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  The Colony Network is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with The Colony Network. If not, see <http://www.gnu.org/licenses/>.
*/

pragma solidity 0.5.8;
pragma experimental ABIEncoderV2;

import "./lib/colony/IColony.sol";
import "./lib/colony/OneTxPayment.sol";
import "./lib/colony/Token.sol";
import "./lib/dappsys/math.sol";
import "./lib/uniswap/UniswapFactoryInterface.sol";
import "./lib/uniswap/UniswapExchangeInterface.sol";


contract Warsaw is DSMath {
  uint256 constant UINT256_MAX = 2**256 - 1;
  uint256 constant ROOT_DOMAIN = 1;
  uint256 constant ROOT_POT = 1;
  uint256 constant REWARDS_POT = 0;

  IColony colony;
  OneTxPayment oneTxPayment;
  UniswapFactoryInterface uniswapFactory;

  address owner;

  uint256 salePeriod;
  uint256 periodsPerDay;
  uint256 saleAmount;

  uint256 dailyMint;
  uint256 payoutFrequency;
  uint256 lastRewardPayout;

  mapping (address => mapping (uint256 => Deposit)) deposits;
  mapping (address => uint256) heads;
  mapping (address => uint256) tails;
  mapping (address => uint256) lastSale;

  mapping (uint256 => uint256) periodIncome;
  uint256 activePeriodIncome;
  uint256 activePeriod;

  struct Deposit {
    address payable depositor;
    uint256 balance;
  }

  event TokensDeposited(address indexed depositor, address indexed token, uint256 amount);
  event TokensComposted(address indexed depositor, address indexed token, uint256 amount);

  modifier onlyOwner() {
    require(owner == msg.sender, "only-owner");
    _;
  }

  // Note: contract assumes root, funding, and administration permissions in root domain
  // Note: oneTxPayment assumes funding and administration permissions in root domain
  // Note: needs reward inverse set to UINT256_MAX (i.e. 0 automatic rewards claims)
  constructor(address colonyAddress, address oneTxPaymentAddress, address uniswapFactoryAddress) public {
    owner = msg.sender;
    colony = IColony(colonyAddress);
    oneTxPayment = OneTxPayment(oneTxPaymentAddress);
    uniswapFactory = UniswapFactoryInterface(uniswapFactoryAddress);

    // Defaults!
    setSaleAmount(WAD);
    setSalePeriod(1 hours);
    setDailyMint(100 * WAD);
    setPayoutFrequency(7 days);

    // Initialize!
    lastRewardPayout = now;
    activePeriod = getCurrentPeriod();
  }

  // Administrative functions

  function transferOwner(address newOwner) public onlyOwner {
    owner = newOwner;
  }

  function setSalePeriod(uint256 interval) public onlyOwner {
    require(interval <= 24 hours, "interval-too-long");
    salePeriod = interval;
    periodsPerDay = 24 hours / interval;
  }

  function setSaleAmount(uint256 wad) public onlyOwner {
    saleAmount = wad;
  }

  function setDailyMint(uint256 wad) public onlyOwner {
    dailyMint = wad;
  }

  function setPayoutFrequency(uint256 frequency) public onlyOwner {
    require(frequency >= 1 days);
    payoutFrequency = frequency;
  }

  // Public functions

  function depositTokens(address token, uint256 wad) public {
    require(wad >= saleAmount, "deposit-too-small");

    Token(token).transferFrom(msg.sender, address(this), wad);
    deposits[token][tails[token]++] = Deposit({ depositor: msg.sender, balance: wad});

    emit TokensDeposited(msg.sender, token, wad);
  }

  function sellTokens(address token) public {
    require(getNumDeposits(token) > 0, "no-token-deposits");
    require(now >= add(lastSale[token], salePeriod), "sale-too-soon");
    lastSale[token] = now;

    Deposit storage deposit = deposits[token][heads[token]];
    address payable depositor = deposit.depositor;
    uint256 amount = saleAmount;

    // Subtract from balance
    deposit.balance -= amount;

    // If *remaining* balance is too small, liquidate and move to next
    if (deposit.balance < saleAmount) {
      amount += deposit.balance;
      delete deposits[token][heads[token]++];
    }

    // Do the sale
    uint256 etherValue = executeSale(token, amount);
    sendEtherToRewardsPot(etherValue);

    // Update active period income
    updateActivePeriodIncome(etherValue);

    // Get daily income (excluding current period, including current tx)
    uint256 dailyIncome = add(getDailyIncome(), etherValue);

    // // Figure out percent of daily income depositor gets
    uint256 percentContribution = wdiv(etherValue, dailyIncome);
    uint256 tokensToMint = wmul(percentContribution, dailyMint);
    mintAndSendTokens(depositor, tokensToMint);

    emit TokensComposted(depositor, token, amount);
  }

  // Public view functions

  function getCurrentPeriod() public view returns(uint256 period) {
    uint256 secondInDay = now % 24 hours;
    period = secondInDay / salePeriod;
    require(period <= periodsPerDay, "invalid-period");
  }

  function getDailyIncome() public view returns(uint256 total) {
    for (uint256 i; i < periodsPerDay; i++) {
      total += periodIncome[i];
    }
  }

  function getPeriodIncomes() public view returns(uint256[] memory periodIncomes) {
    periodIncomes = new uint256[](periodsPerDay);
    for (uint256 i; i < periodsPerDay; i++) {
      periodIncomes[i] = periodIncome[i];
    }
  }

  function getNumDeposits(address token) public view returns(uint256 numDeposits) {
    numDeposits = sub(tails[token], heads[token]);
  }

  function getDeposit(address token, uint256 id) public view returns(Deposit memory deposit) {
    deposit = deposits[token][id];
  }

  function getNumPeriodsPerDay() public view returns(uint256 numPeriodsPerDay) {
    numPeriodsPerDay = periodsPerDay;
  }

  function getTimeToPayout() public view returns(uint256 timeToPayout) {
    timeToPayout = min(0, add(lastRewardPayout, payoutFrequency) - now);
  }

  // Internal functions

  function updateActivePeriodIncome(uint256 income) internal {
    uint256 currentPeriod = getCurrentPeriod();
    if (currentPeriod == activePeriod) {
      // Still in the same period, increment running total
      activePeriodIncome += income;
    } else {
      // In a new period, so save and restart
      periodIncome[currentPeriod] = activePeriodIncome;
      activePeriodIncome = income;
      activePeriod = currentPeriod;
    }
  }

  // REAL IMPLEMENTATIONS

  function initiateRewardPayout(
    bytes memory key,
    bytes memory value,
    uint256 branchMask,
    bytes32[] memory siblings
  )
    public
  {
    require(getTimeToPayout() == 0, "payout-too-soon");

    lastRewardPayout = now;
    colony.startNextRewardPayout(address(0x0), key, value, branchMask, siblings);
  }

  function executeSale(address token, uint256 wad) internal returns(uint256 etherValue) {
    address uniswapExchangeAddress = uniswapFactory.getExchange(token);
    UniswapExchangeInterface uniswapExchange = UniswapExchangeInterface(uniswapExchangeAddress);

    Token(token).approve(uniswapExchangeAddress, wad);
    etherValue = uniswapExchange.tokenToEthSwapInput(wad, 1, now + 1 hours); // Conservative
  }

  function mintAndSendTokens(address payable recipient, uint256 amount) internal {
    require(colony.getRewardInverse() == UINT256_MAX, "colony-bad-reward-inverse");

    address token = colony.getToken();
    colony.mintTokens(amount);
    colony.claimColonyFunds(token);
    oneTxPayment.makePayment(1, 0, 1, 0, recipient, token, amount, ROOT_DOMAIN, 0);
  }

  function sendEtherToRewardsPot(uint256 amount) internal {
    require(colony.getRewardInverse() == UINT256_MAX, "colony-bad-reward-inverse");

    // Well this is ratchet
    address colonyAddress = address(colony);
    address payable colonyAddressPayable = (address(uint160(colonyAddress)));
    colonyAddressPayable.transfer(amount);

    colony.claimColonyFunds(address(0x0));
    colony.moveFundsBetweenPots(1, 0, 0, ROOT_POT, REWARDS_POT, amount, address(0x0));
  }

  // TEST MOCKS

  // function initiateRewardPayout(
  //   bytes memory key,
  //   bytes memory value,
  //   uint256 branchMask,
  //   bytes32[] memory siblings
  // )
  //   public
  // {
  //   // Calls to colony
  // }

  // function executeSale(address token, uint256 wad) internal returns(uint256 etherValue) {
  //   // Calls to uniswap
  //   return WAD;
  // }

  // function mintAndSendTokens(address payable recipient, uint256 amount) internal {
  //   // Calls to colony
  // }

  // function sendEtherToRewardsPot(uint256 amount) internal {
  //   // Calls to colony
  // }

}
