import Web3 from 'web3';
import { formatUnits } from 'ethers/utils/units';

// import { ERC20_ABI } from './erc20';

export interface AmberToken {
  address: string;
  amount: string;
  decimals: string;
  holder: string;
  isERC20: boolean;
  isERC721: boolean;
  isERC777: boolean;
  isERC884: boolean;
  isERC998: boolean;
  name: string;
  symbol: string;
  price: {
    amount: string;
    currency: string;
    quote: string;
    total: string;
  };
}

export interface AmberResponse {
  description: string;
  payload: {
    records: AmberToken[];
  };
}

export class TokenProvider {
  wallet: any;
  web3: Web3;

  constructor(wallet: any) {
    this.wallet = wallet;
    this.web3 = new Web3(Web3.givenProvider);
  }

  async transfer(tokenAddress: string, value: string) {
    console.log(`Send ${value} of ${tokenAddress}`);
  }

  async getAllTokenBalances() {
    const response = await fetch(
      `https://web3api.io/api/v1/addresses/${this.wallet.address}/tokens?includePrice=true&currency=usd`,
      {
        headers: {
          'x-amberdata-blockchain-id': '1c9c969065fcd1cf',
          'x-api-key': 'UAKa48047567512ffdee01a2ee1f4fef95c',
        },
      },
    );
    const json: AmberResponse = await response.json();

    if (json.description !== 'Successful request') {
      throw new Error(`Bad response: \n${JSON.stringify(json, null, 2)}`);
    }

    return json.payload.records
      .filter(item => item.isERC20)
      .map(({ amount, name, address, decimals, symbol, price }) => ({
        name,
        symbol,
        address,
        decimals: parseInt(decimals, 10),
        balance: formatUnits(amount, parseInt(decimals, 10)),
        // price,
      }));
  }
}
