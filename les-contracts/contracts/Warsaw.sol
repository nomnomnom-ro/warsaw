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

import "./WarsawBase.sol";


contract Warsaw is WarsawBase {

  function executeSale(address token, uint256 wad) internal returns(uint256 etherValue) {
    address uniswapExchangeAddress = uniswapFactory.getExchange(token);
    UniswapExchangeInterface uniswapExchange = UniswapExchangeInterface(uniswapExchangeAddress);
    etherValue = uniswapExchange.tokenToEthSwapInput(wad, 0, now + 1 days); // Conservative, don't want tx to fail
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

}
