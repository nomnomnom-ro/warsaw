const HDWalletProvider = require("truffle-hdwallet-provider");

const GWEI = 1000000000;

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    mainnet: {
      provider: () => {
        return new HDWalletProvider(
          "replace-with-private-key-when-using",
          "https://mainnet.infura.io/v3/e21146aa267845a2b7b4da025178196d"
        );
      },
      gasPrice: 8 * GWEI,
      gasLimit: 200000,
      network_id: "1"
    }
  },
  mocha: {
    reporter: "eth-gas-reporter",
    options: {
      currency: "USD",
      gasPrice: 5,
    }
  },
  compilers: {
    solc: {
      version: "0.5.8",
      docker: true
    }
  },
};
