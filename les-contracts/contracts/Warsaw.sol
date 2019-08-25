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

import "../uniswap/UniswapFactoryInterface.sol";
import "../uniswap/UniswapExchangeInterface.sol";
import "../colony/IColony.sol";
import "../lib/dappsys/math.sol";
import "../lib/dappsys/erc20.sol";


contract Warsaw is DSMath {
  uint256 constant UINT256_MAX = 2**256 - 1;
  uint256 constant ROOT_DOMAIN = 1;
  uint256 constant ROOT_POT = 1;
  uint256 constant REWARDS_POT = 0;

  IColony colony;
  UniswapFactoryInterface uniswapFactory;
  ERC20 weth;

  address owner;
  bool deprecated;

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
  // Note: needs reward inverse set to UINT256_MAX (i.e. 0 automatic rewards claims)
  constructor(address colonyAddress, address uniswapFactoryAddress, address wethAddress) public {
    owner = msg.sender;
    colony = IColony(colonyAddress);
    weth = ERC20(wethAddress);
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

  function setDeprecated(bool status) public onlyOwner {
    deprecated = status;
  }

  // Public functions

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
    colony.startNextRewardPayout(address(weth), key, value, branchMask, siblings);
  }

  function depositTokens(address token, uint256 wad) public {
    require(wad >= saleAmount, "deposit-too-small");
    require(!deprecated, "contract-deprecated");

    ERC20(token).transferFrom(msg.sender, address(this), wad);
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
    uint256 wethAmount = executeSale(token, amount);
    sendWethToRewardsPot(wethAmount);

    // Update active period income
    updateActivePeriodIncome(wethAmount);

    // Get daily income (excluding current period, including current tx)
    uint256 dailyIncome = add(getDailyIncome(), wethAmount);

    // // Figure out percent of daily income depositor gets
    uint256 percentContribution = wdiv(wethAmount, dailyIncome);
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
    timeToPayout = max(0, add(lastRewardPayout, payoutFrequency) - now);
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

  function executeSale(address token, uint256 wad) internal returns(uint256 wethAmount) {
    address uniswapExchangeAddress = uniswapFactory.getExchange(token);
    ERC20(token).approve(uniswapExchangeAddress, wad);

    UniswapExchangeInterface uniswapExchange = UniswapExchangeInterface(uniswapExchangeAddress);
    wethAmount = uniswapExchange.tokenToTokenSwapInput(wad, 1, 1, now + 1 hours, address(weth));
  }

  function mintAndSendTokens(address payable recipient, uint256 amount) internal {
    require(colony.getRewardInverse() == UINT256_MAX, "colony-bad-reward-inverse");

    // Supply the tokens
    address token = colony.getToken();
    colony.mintTokens(amount);
    colony.claimColonyFunds(token);

    // Make the payment
    uint256 paymentId = colony.addPayment(1, 0, recipient, token, amount, ROOT_DOMAIN, 0);
    uint256 fundingPotId = colony.getPayment(paymentId).fundingPotId;
    colony.moveFundsBetweenPots(1, 0, 0, ROOT_POT, fundingPotId, amount, token);
    colony.finalizePayment(1, 0, paymentId);
    colony.claimPayment(paymentId, token);
  }

  function sendWethToRewardsPot(uint256 amount) internal {
    require(colony.getRewardInverse() == UINT256_MAX, "colony-bad-reward-inverse");

    weth.transfer(address(colony), amount);
    colony.claimColonyFunds(address(weth));
    colony.moveFundsBetweenPots(1, 0, 0, ROOT_POT, REWARDS_POT, amount, address(weth));
  }
}
