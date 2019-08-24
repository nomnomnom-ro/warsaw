/* eslint-disable */

const Web3 = require('web3');
const express = require('express');
const Tx = require('ethereumjs-tx');
const { open: openWallet } = require('@colony/purser-software');
const packageJson = require('./package.json');
const cron = require('node-cron');
const WarsawBaseArtifact = require('../les-contracts/build/WarsawBase.json');

const app = express();

/*
 * Optional
 */
const MODE_DEV = 'development';
const NODE_ENV = process.env.NODE_ENV || MODE_DEV;
const NETWORK = process.env.NETWORK || 'mainnet';
const CRON_SCHEDULE = process.env.CRONTAB || '0 * * * *';
const MANUAL_TRIGGER_URL = '/manualnoms';

/*
 * Required
 */
const INFURA_KEY = process.env.INFURA_KEY;
const MNEMONIC = process.env.MNEMONIC;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!INFURA_KEY) {
  console.error('Please specify the env INFURA_KEY');
  process.exit(1);
}

const INFURA_ENDPOINT = `https://${NETWORK}.infura.io/${INFURA_KEY}`;

if (!(MNEMONIC || PRIVATE_KEY)) {
  console.error('Please specify either a env MNEMONIC or an env PRIVATE_KEY');
  process.exit(1);
}

(async () => {
  const web3 = new Web3(new Web3.providers.HttpProvider(INFURA_ENDPOINT));

  const wallet = await openWallet({
    privateKey: PRIVATE_KEY,
    mnemonic: MNEMONIC,
  });

  const sendNoms = async () => {
    // @todo get the owner address and its private key
    const myAddress = 'ADDRESS_THAT_SENDS_TRANSACTION';
    const privateKey = Buffer.from('YOUR_PRIVATE_KEY', 'hex');

    // Mr Twaddles
    const toAddress = '0x6DEC3e1d475De47515FA5d798400372D9D7067B4';

    const contractABI = WarsawBaseArtifact.abi;

    // @todo get the deployed address
    const contractAddress = 'YOUR_CONTRACT_ADDRESS';

    //creating contract object
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    // get transaction count, later will used as nonce
    const count = await web3.eth.getTransactionCount(myAddress);
    const amount = web3.utils.toHex(1e16);

    //creating raw tranaction
    const rawTransaction = {
      from: myAddress,
      gasPrice: web3.utils.toHex(20 * 1e9),
      gasLimit: web3.utils.toHex(210000),
      to: contractAddress,
      value: '0x0',
      data: contract.methods.transfer(toAddress, amount).encodeABI(),
      nonce: web3.utils.toHex(count),
    };
    console.log(rawTransaction);

    //creating tranaction via ethereumjs-tx
    const transaction = new Tx(rawTransaction);

    //signing transaction with private key
    transaction.sign(privateKey);

    //sending transaction via web3 module
    web3.eth
      .sendSignedTransaction('0x' + transaction.serialize().toString('hex'))
      .on('transactionHash', console.log);

    const balance = await contract.methods.balanceOf(myAddress).call();
    console.log(balance);
  };

  cron.schedule(CRON_SCHEDULE, () => {
    console.log('Sending nom nom noms now ...');

    sendNoms();
  });

  if (NODE_ENV === MODE_DEV) {
    app.get(MANUAL_TRIGGER_URL, (req, res) => {
      res.send('Sending nom nom noms manually...');

      sendNoms();
    });
  }

  app.listen(3000, () => {
    console.log(`${packageJson.name} started!`);
    console.log('Listening on http://127.0.0.1:3000');
    console.log(`Using wallet ${wallet.address}`);
    console.log(`Using Infura Provider: ${INFURA_ENDPOINT}`);
  });
})();
