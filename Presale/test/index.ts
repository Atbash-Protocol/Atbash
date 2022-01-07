import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Presale } from "../typechain";

describe("Presale.sol", function () {

  let deployer: SignerWithAddress;
  let presale: Presale;

  beforeEach(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];

    const Presale = await ethers.getContractFactory("Presale");
    presale = await Presale.deploy(deployer.address);
    await presale.deployed();

    
  });

  it("Should be owned by the deployer", async function () {
    expect(await presale.owner()).to.be.equal(deployer.address)
  });

  it("Should set rate per one token", async  () => {
    presale.setRate(1000);
  })
});
