export const WarsawABI = [
  {
    inputs: [
      {
        name: 'colonyAddress',
        type: 'address',
      },
      {
        name: 'oneTxPaymentAddress',
        type: 'address',
      },
      {
        name: 'uniswapFactoryAddress',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwner',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'interval',
        type: 'uint256',
      },
    ],
    name: 'setSalePeriod',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'wad',
        type: 'uint256',
      },
    ],
    name: 'setSaleAmount',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'wad',
        type: 'uint256',
      },
    ],
    name: 'setDailyMint',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'token',
        type: 'address',
      },
      {
        name: 'wad',
        type: 'uint256',
      },
    ],
    name: 'depositTokens',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'token',
        type: 'address',
      },
    ],
    name: 'sellTokens',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'getCurrentPeriod',
    outputs: [
      {
        name: 'period',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'getDailyIncome',
    outputs: [
      {
        name: 'total',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];
