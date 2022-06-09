const {deployments} = require('hardhat');
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import chai, { expect } from "chai";
import { ethers, network } from "hardhat";
const { BigNumber } = ethers;
import { FakeContract, smock } from "@defi-wonderland/smock";
import { CONTRACTS } from "../../scripts/constants";


describe('Launch', () => {
  it('testing 1 2 3', async function () {
    await deployments.fixture(['Token']);
    const Token = await deployments.get(CONTRACTS.bash); // Token is available because the fixture was executed
    console.log(Token.address);
  });
});