// @ts-ignore
import Web3 from 'web3';

import { ERC20_ABI } from './erc20';
import { ETH, TOKENS } from './tokens';
import { FakeApi } from './fakeApi';

export class TokenProvider {
  wallet: any;
  web3: Web3;
  fakeApi: FakeApi;

  constructor(wallet: any) {
    this.wallet = wallet;
    this.web3 = new Web3(Web3.givenProvider);
    this.fakeApi = new FakeApi();
  }

  async transfer(tokenAddress: string, value: string) {
    console.log(`Send ${value} of ${tokenAddress}`);
    return this.fakeApi.transfer(tokenAddress, value);
  }

  async getTokenBalance(tokenAddress: string): Promise<string> {
    // const contract = new this.web3.eth.Contract(ERC20_ABI, tokenAddress);
    // return contract.methods.balanceOf(this.wallet.address).call();
    const balance = await this.fakeApi.getTokenBalance(tokenAddress);
    return Number(Web3.utils.fromWei(balance, 'ether')).toFixed(1);
  }

  async getAllTokenBalances(): Promise<
    {
      balance: string;
      decimals: number;
      name: string;
      symbol: string;
      tokenAddress: string;
    }[]
  > {
    return Promise.all(
      Object.entries(TOKENS).map(async ([tokenAddress, token]) => ({
        ...token,
        tokenAddress,
        balance: await this.getTokenBalance(tokenAddress),
      })),
    );
  }
}
