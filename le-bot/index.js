const web3 = require('web3');
const express = require('express');
const tx = require('ethereumjs-tx');
const package = require('./package.json');
const cron = require('node-cron');

const app = express();

const NETWORK = process.env.NETWORK || 'goerli';
const INFURA_KEY = process.env.INFURA_KEY;
const CRON_SCHEDULE = process.env.CRONTAB || '0 * * * *';
const MANUAL_TRIGGER_URL = '/manualnoms';

if (!INFURA_KEY) {
  console.error('Please specify the env INFURA_KEY');
  process.exit(1);
}

const web3Provider = new web3(new web3.providers.HttpProvider(`https://${NETWORK}.infura.io/${INFURA_KEY}`));

const sendNoms = () => {
  // var myAddress = 'ADDRESS_THAT_SENDS_TRANSACTION';
  // var privateKey = Buffer.from('YOUR_PRIVATE_KEY', 'hex')
  // var toAddress = 'ADRESS_TO_SEND_TRANSACTION';

  // //contract abi is the array that you can get from the ethereum wallet or etherscan
  // var contractABI = YOUR_CONTRACT_ABI;
  // var contractAddress = "YOUR_CONTRACT_ADDRESS";
  // //creating contract object
  // var contract = new web3js.eth.Contract(contractABI, contractAddress);

  // var count;
  // // get transaction count, later will used as nonce
  // web3js.eth.getTransactionCount(myAddress).then(function (v) {
  //   console.log("Count: " + v);
  //   count = v;
  //   var amount = web3js.utils.toHex(1e16);
  //   //creating raw tranaction
  //   var rawTransaction = { "from": myAddress, "gasPrice": web3js.utils.toHex(20 * 1e9), "gasLimit": web3js.utils.toHex(210000), "to": contractAddress, "value": "0x0", "data": contract.methods.transfer(toAddress, amount).encodeABI(), "nonce": web3js.utils.toHex(count) }
  //   console.log(rawTransaction);
  //   //creating tranaction via ethereumjs-tx
  //   var transaction = new Tx(rawTransaction);
  //   //signing transaction with private key
  //   transaction.sign(privateKey);
  //   //sending transacton via web3js module
  //   web3js.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'))
  //     .on('transactionHash', console.log);

  //   contract.methods.balanceOf(myAddress).call()
  //     .then(function (balance) { console.log(balance) });
  // })
};

cron.schedule(CRON_SCHEDULE, () => {

  console.log('Sending nom nom noms now ...');

  sendNoms();

});

app.get(MANUAL_TRIGGER_URL, function (req, res) {

  res.send('Sending nom nom noms manually...');

  sendNoms();

});

app.listen(3000, () => {
  console.log(`${package.name} started!`);
  console.log('Listening on http://127.0.0.1:3000');
});
