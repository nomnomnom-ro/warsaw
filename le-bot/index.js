const web3 = require('web3');
const express = require('express');
const tx = require('ethereumjs-tx');
const package = require('./package.json');

const app = express();

const NETWORK = process.env.NETWORK || 'goerli';
const INFURA_KEY = process.env.INFURA_KEY;

if (!INFURA_KEY) {
  console.error('Please specify the env INFURA_KEY');
  process.exit(1);
}

const web3Provider = new web3(new web3.providers.HttpProvider(`https://${NETWORK}.infura.io/${INFURA_KEY}`));

app.listen(3000, () => {
  console.log(`${package.name} started!`);
  console.log('Listening on http://127.0.0.1:3000');
});
