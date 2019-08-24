import Web3 from 'web3';
import { getDefaultProvider, utils } from 'ethers';
import { getNetworkClient } from '@colony/colony-js-client';
import EthersWrappedWallet from '@colony/colony-js-client/lib/lib/EthersWrappedWallet';

import { WarsawABI } from './warsaw';

// @todo replace me when the contract is live
const WARSAW_ADDRESS = '0xb8c77482e45f1f44de1745f52c74426c631bdd52';

const COLONY_ADDRESS = '0xAb3476792b86b5A80C27b0D5dE20787492024aF9';

const EXAMPLE_AMBER_RESPONSE = {
  status: 200,
  title: 'OK',
  description: 'Successful request',
  payload: {
    records: [
      {
        address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
        holder: '0x6dec3e1d475de47515fa5d798400372d9d7067b4',
        amount: '1000000000000000000',
        decimals: '18',
        name: 'Basic Attention Token',
        symbol: 'BAT',
        isERC20: true,
        isERC721: false,
        isERC777: false,
        isERC884: false,
        isERC998: false,
        price: {
          amount: {
            currency: 'usd',
            quote: '0.201228322087',
            total: '0.20122832208700000000000000000000',
          },
        },
      },
    ],
    totalRecords: '1',
  },
};

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
  warsaw: any;
  network: any;
  colony: any;
  web3: Web3;

  constructor(wallet: any) {
    this.wallet = wallet;
    this.web3 = new Web3(Web3.givenProvider);
    this.warsaw = new this.web3.eth.Contract(WarsawABI, WARSAW_ADDRESS);
    this.getColony().catch((error: Error) => console.error(error));
  }

  private async getColony() {
    this.network = await getNetworkClient(
      'mainnet',
      new EthersWrappedWallet(this.wallet, getDefaultProvider('mainnet')),
    );
    this.colony = await this.network.getColonyClientByAddress(COLONY_ADDRESS);
  }

  private async sendTx(tx: any) {
    console.log(tx);
    console.log(this.wallet);
    const result = await this.wallet.sign(tx);
    console.log(result);
  }

  async transfer(tokenAddress: string, value: string) {
    // @todo ensure value has the correct decimals when this fn is called
    console.log(`Send ${value} of ${tokenAddress}`);
    const tx = this.warsaw.methods.depositTokens(tokenAddress, value);
    return this.sendTx(tx);
  }

  async getAllTokens(): Promise<
    {
      address: string;
      balance: string;
      composted: string;
      decimals: number;
      deposited: string;
      name: string;
      symbol: string;
    }[]
  > {
    const balances = await this.getAllTokenBalances();
    return Promise.all(
      balances.map(async token => ({
        ...token,
        ...(await this.getCompostTotals(token.address)),
      })),
    );
  }

  async getCompostTotals(tokenAddress: string) {
    const options = {
      fromBlock: 8414879,
      filter: {
        depositor: this.wallet.address,
        token: tokenAddress,
      },
    };

    const events = await this.warsaw.getPastEvents('allEvents', options);

    return events.reduce(
      (acc, { event, returnValues: { amount } }) => {
        if (event === 'TokensDeposited') {
          acc.deposited += amount;
        } else if (event === 'TokensComposited') {
          acc.deposited -= amount;
          acc.composted += amount;
        }
        return acc;
      },
      { deposited: 0, composted: 0 },
    );
  }

  async getEnzymes() {
    if (!this.colony) return;

    const response = await this.colony.getReputation({
      skillId: 1,
      address: this.wallet.address,
    });
    console.log(response);
    return response;
  }

  async getTimeToPayout() {
    // const timeToPayout = await this.warsaw.methods.getTimeToPayout().call();
    // console.log(timeToPayout);
    // return timeToPayout;
    return '23:45:45';
  }

  async getNoms(): Promise<string> {
    if (!this.colony) return;

    const { amount } = this.colony.tokenClient.getBalanceOf.call({
      sourceAddress: this.wallet.address,
    });
    return utils.formatUnits(amount, 18);
  }

  async getCurrentPeriod(): Promise<string> {
    return this.warsaw.methods.getCurrentPeriod().call();
  }

  async getDailyIncome(): Promise<string> {
    return this.warsaw.methods.getDailyIncome().call();
  }

  async trigger() {
    // @todo
    const tx = this.warsaw.methods.initiateRewardPayout();
    return this.sendTx(tx);
  }

  async claim() {
    await this.colony.claimColonyFunds.send({
      tokenAddress: this.colony.tokenClient.address,
    });
  }

  async getAllTokenBalances() {
    // const response = await fetch(
    //   `https://web3api.io/api/v1/addresses/${this.wallet.address}/tokens?includePrice=true&currency=usd`,
    //   {
    //     headers: {
    //       'x-amberdata-blockchain-id': '1c9c969065fcd1cf',
    //       'x-api-key': 'UAKa48047567512ffdee01a2ee1f4fef95c',
    //     },
    //   },
    // );
    // const json: AmberResponse = await response.json();
    const json = EXAMPLE_AMBER_RESPONSE;

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
        balance: utils.formatUnits(amount, parseInt(decimals, 10)),
        deposited: '0',
        composted: '0',
        // price,
      }));
  }
}
