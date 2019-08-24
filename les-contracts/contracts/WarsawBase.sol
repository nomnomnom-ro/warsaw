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


contract WarsawBase is DSMath {
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

  modifier onlyOwner() {
    require(owner == msg.sender, "only-owner");
    _;
  }

  // Note: contract assumes root, funding, and administration permissions in root domain
  // Note: oneTxPayment assumes funding and administration permissions in root domain
  // Note: assumes reward inverse is set to UINT256_MAX (i.e. 0 automatic rewards claims)
  constructor(address colonyAddress, address oneTxPaymentAddress, address uniswapFactoryAddress) public {
    owner = msg.sender;
    colony = IColony(colonyAddress);
    oneTxPayment = OneTxPayment(oneTxPaymentAddress);
    uniswapFactory = UniswapFactoryInterface(uniswapFactoryAddress);

    setSaleAmount(WAD);
    setSalePeriod(1 hours);
    setDailyMint(WAD);
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

  // Public functions

  function depositTokens(address token, uint256 wad) public {
    require(wad >= saleAmount, "deposit-too-small");

    Token(token).transferFrom(msg.sender, address(this), wad);
    deposits[token][tails[token]++] = Deposit({ depositor: msg.sender, balance: wad});
  }

  function sellTokens(address token) public {
    require(add(lastSale[token], salePeriod) >= now, "sale-too-soon");

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

    // Get daily income (not including current period)
    uint256 dailyIncome = getDailyIncome();

    // Figure out percent of daily income depositor gets
    uint256 percentContribution = wdiv(etherValue, dailyIncome);
    uint256 tokensToMint = wmul(percentContribution, dailyMint);
    mintAndSendTokens(depositor, tokensToMint);
  }

  function getCurrentPeriod() public view returns(uint256 period) {
    uint256 secondInDay = now % 24 hours;
    period = secondInDay / salePeriod;
    assert(period <= periodsPerDay);
  }

  function getDailyIncome() public view returns(uint256 total) {
    for (uint256 i; i < periodsPerDay; i++) {
      total += periodIncome[i];
    }
  }

  function getNumDeposits(address token) public view returns(uint256 numDeposits) {
    numDeposits = sub(tails[token], heads[token]);
  }

  function getDeposit(address token, uint256 id) public view returns(Deposit memory deposit) {
    deposit = deposits[token][id];
  }

  // Internal functions

  function updateActivePeriodIncome(uint256 income) internal {
    uint256 currentPeriod = getCurrentPeriod();
    if (currentPeriod == activePeriod) {
      // Still in the same period, increment running total
      activePeriodIncome += income;
    } else {
      // In a new period, so save and restart
      assert((currentPeriod - activePeriod) % periodsPerDay == 1);
      periodIncome[currentPeriod] = activePeriodIncome;
      activePeriodIncome = income;
      activePeriod = currentPeriod;
    }
  }

  function executeSale(address token, uint256 wad) internal returns(uint256 etherValue) {
    // Calls to uniswap
    return WAD;
  }

  function mintAndSendTokens(address payable recipient, uint256 amount) internal {
    // Calls to colony
  }

  function sendEtherToRewardsPot(uint256 amount) internal {
    // Calls to colony
  }

}
