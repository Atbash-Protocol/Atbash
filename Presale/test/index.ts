import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Presale.sol", function () {

  let deployer: SignerWithAddress;

  beforeEach(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
  });

  it("Should be owned by the deployer", async function () {
    const Presale = await ethers.getContractFactory("Presale");
    const presale = await Presale.deploy();
    await presale.deployed();


    expect(await presale.owner()).to.be.equal(deployer.address)
  });
});
