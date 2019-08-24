const ethers = require("ethers");
const truffleAssert = require("truffle-assertions");

const Warsaw = artifacts.require("WarsawBase");
const Token = artifacts.require("Token");

contract("Warsaw", async accounts => {
  const ZERO = ethers.constants.AddressZero;
  const WAD = ethers.constants.WeiPerEther;
  const MINUTE = 60; // 60 seconds

  const USER1 = accounts[0];
  const USER2 = accounts[1];

  let warsaw;
  let token;

  beforeEach(async () => {
    warsaw = await Warsaw.new(ZERO, ZERO, ZERO);
    token = await Token.new("Token", "TOKN", 18);
  });

  describe("expected behavior", () => {
    it("should calculate the number of periods per day", async () => {
      await warsaw.setSalePeriod(30 * MINUTE);
      const numPeriodsPerDay = await warsaw.getNumPeriodsPerDay();
      assert.equal(numPeriodsPerDay.toNumber(), 48);

      await truffleAssert.reverts(
        warsaw.setSalePeriod(24 * 60 * MINUTE + 1), "interval-too-long");
    });

    it("should let users deposit tokens", async () => {
      await token.mint(WAD);
      await token.approve(warsaw.address, WAD);
      await warsaw.depositTokens(token.address, WAD);
    });

    it("should track the number of deposits", async () => {
      await token.mint(USER1, WAD);
      await token.mint(USER2, WAD);

      await token.approve(warsaw.address, WAD, { from: USER1});
      await token.approve(warsaw.address, WAD, { from: USER2});

      await warsaw.depositTokens(token.address, WAD, { from: USER1});
      await warsaw.depositTokens(token.address, WAD, { from: USER2});

      let numDeposits = await warsaw.getNumDeposits(token.address);
      assert.equal(numDeposits.toNumber(), 2)

      await warsaw.sellTokens(token.address);
      numDeposits = await warsaw.getNumDeposits(token.address);
      assert.equal(numDeposits.toNumber(), 1)
    });

    it("can sell tokens once per period, while deposits last", async () => {
      await token.mint(WAD.mul(2));
      await token.approve(warsaw.address, WAD.mul(2));
      await warsaw.depositTokens(token.address, WAD.mul(2));

      await warsaw.sellTokens(token.address);
      await truffleAssert.reverts(
        warsaw.sellTokens(token.address), "sale-too-soon");

      await forwardTime(60 * MINUTE);
      await warsaw.sellTokens(token.address);

      await truffleAssert.reverts(
        warsaw.sellTokens(token.address), "no-token-deposits");
    });

    it("can round up for irregular deposits", async () => {
      await token.mint(WAD.mul(3));
      await token.approve(warsaw.address, WAD.mul(3));
      await warsaw.depositTokens(token.address, WAD.mul(3).div(2));

      await warsaw.sellTokens(token.address);
      const numDeposits = await warsaw.getNumDeposits(token.address);
      assert.equal(numDeposits.toNumber(), 0)
    });

    it("can correctly track income over time", async () => {
      const numPeriods = 30;
      await token.mint(WAD.mul(numPeriods));
      await token.approve(warsaw.address, WAD.mul(numPeriods));

      for (let i = 0; i < numPeriods / 2; i++) {
        await warsaw.depositTokens(token.address, WAD.mul(2));
      }

      for (let i = 0; i < numPeriods / 2; i++) {
        await warsaw.sellTokens(token.address);
        await forwardTime(60 * MINUTE);
      }

      // Tally for first 15 periods minus one (current period is not included)
      let dailyIncome = await warsaw.getDailyIncome();
      assert.equal(dailyIncome.toString(), WAD.mul(numPeriods / 2 - 1).toString());

      for (let i = 0; i < numPeriods / 2; i++) {
        await warsaw.sellTokens(token.address);
        await forwardTime(60 * MINUTE);
      }

      // Income tracks only last 24 periods
      dailyIncome = await warsaw.getDailyIncome();
      assert.equal(dailyIncome.toString(), WAD.mul(24).toString());

      const periodIncomes = await warsaw.getPeriodIncomes();
      assert.equal(periodIncomes[0].toString(), WAD.toString());
    });
  });
});

async function forwardTime(time) {
  const id = Date.now();
  const cmd1 = { jsonrpc: '2.0', method: 'evm_increaseTime', params: [time], id: id }
  const cmd2 = { jsonrpc: '2.0', method: 'evm_mine', id: id+1 }

  return new Promise((resolve, reject) => {
    web3.currentProvider.send(cmd1, err1 => {
      if (err1) return reject(err1);
      web3.currentProvider.send(cmd2, (err2, res) => {
        return err2 ? reject(err2) : resolve(res);
      });
    });
  });
};
