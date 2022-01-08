import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC20, ERC20Token, Presale } from "../typechain";

describe("Presale.sol", function () {

  let deployer: SignerWithAddress;
  let presale: Presale;
  let tokenPresale : ERC20Token;
  let buyer1: SignerWithAddress;
  let buyer2: SignerWithAddress;

  beforeEach(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    buyer1 = signers[1]
    buyer2 = signers[2]

    const Presale = await ethers.getContractFactory("Presale");
    presale = await Presale.deploy(deployer.address);
    await presale.deployed();

    const ERC20 = await ethers.getContractFactory("ERC20Token");
    tokenPresale = await ERC20.deploy(ethers.utils.parseUnits("10000", 18));
    await tokenPresale.deployed();

  });

  it("owned by the deployer", async function () {
    expect(await presale.owner()).to.be.equal(deployer.address)
  });

  it("set rate per one token", async  () => {
    await presale.setRate(1000);


    expect(await presale.rate()).is.equal(1000);
  });

  it("set presale token", async () => {
    await presale.setPresaleToken(tokenPresale.address);

    expect(await presale.presaleToken()).is.equal(tokenPresale.address);
  });

  it("receive presale tokens to the balance from owner", async () => {
    await presale.setPresaleToken(tokenPresale.address);

    await tokenPresale.connect(deployer).transfer(presale.address, ethers.utils.parseUnits("10000", 18));

    expect(await tokenPresale.balanceOf(presale.address)).is.equal(ethers.utils.parseUnits("10000"));
  });
});
