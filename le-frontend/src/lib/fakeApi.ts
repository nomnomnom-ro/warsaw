import { TOKENS } from './tokens';

export class FakeApi {
  balances: { [tokenAddress: string]: string };

  constructor() {
    // Create random balances
    this.balances = Object.keys(TOKENS).reduce(
      (acc, tokenAddress) => ({
        ...acc,
        [tokenAddress]: String(
          Math.floor(Math.random() * 123456789123456789123),
        ),
      }),
      {},
    );
  }

  async getTokenBalance(tokenAddress: string) {
    return new Promise(resolve => {
      setTimeout(() => {
        const balance = this.balances[tokenAddress];
        resolve(balance || '0');
      }, 500);
    });
  }

  async transfer(tokenAddress: string, value: string) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const balanceNum = parseInt(this.balances[tokenAddress], 10);
        const valueNum = parseInt(value, 10);

        if (valueNum > balanceNum) {
          reject('Insufficient balance for transfer');
          return;
        }

        this.balances[tokenAddress] = String(balanceNum - valueNum);

        resolve(this.balances[tokenAddress]);
      }, 500);
    });
  }
}
