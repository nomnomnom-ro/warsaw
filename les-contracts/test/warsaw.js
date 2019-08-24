const ethers = require("ethers");

const Warsaw = artifacts.require("WarsawBase");
const Token = artifacts.require("Token");

contract("Warsaw", async accounts => {
  const ZERO = ethers.constants.AddressZero;
  const WAD = ethers.constants.WeiPerEther;

  const USER1 = accounts[0];
  const USER2 = accounts[1];

  let warsaw;
  let token;

  beforeEach(async () => {
    warsaw = await Warsaw.new(ZERO, ZERO, ZERO);
    token = await Token.new("Token", "TOKN", 18);
  });

  describe("expected behavior", () => {
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

      const numDeposits = await warsaw.getNumDeposits(token.address);
      assert.equal(numDeposits.toString(), "2")
    });
  });
});

