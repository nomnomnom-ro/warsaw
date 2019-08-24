const HDWalletProvider = require("truffle-hdwallet-provider");

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
      network_id: "1"
    }
  },
  compilers: {
    solc: {
      version: "0.5.8",
      docker: true,
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "petersburg"
      }
    }
  },
};
