import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC20, ERC20Token, Presale } from "../typechain";

describe("Presale.sol", function () {

  let deployer: SignerWithAddress;
  let presale: Presale;
  let tokenPresale: ERC20Token;
  let buyer1: SignerWithAddress;
  let buyer2: SignerWithAddress;
  let buyer3: SignerWithAddress;
  let buyer4: SignerWithAddress;

  beforeEach(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    buyer1 = signers[1]
    buyer2 = signers[2]
    buyer3 = signers[3]
    buyer4 = signers[4]

    const Presale = await ethers.getContractFactory("Presale");
    presale = await Presale.deploy(deployer.address);
    await presale.deployed();

    const ERC20 = await ethers.getContractFactory("ERC20Token");
    tokenPresale = await ERC20.deploy(ethers.utils.parseUnits("10000", 18));
    await tokenPresale.deployed();

  });

  it("presale mock token decimals is 9", async () => {
    expect(await tokenPresale.decimals()).is.equal(9);
  });

  it("presale is not active after deployment", async () => {
    expect(await presale.getPresaleStatus()).to.be.false;
  });

  it("owned by the deployer", async function () {
    expect(await presale.owner()).to.be.equal(deployer.address)
  });

  it("set token decimals", async () => {
    await expect(presale.connect(buyer1).setTokenDecimals(15)).is.revertedWith("Ownable: caller is not the owner");
    expect(await presale.getTokenDecimals()).is.equal(9);
    await presale.connect(deployer).setTokenDecimals(18);
    expect(await presale.getTokenDecimals()).is.equal(18);
  })

  it("set rate per one token", async () => {
    await presale.setRate(1000);


    expect(await presale.rate()).is.equal(1000);
  });

  it("set presale token", async () => {
    await presale.setPresaleToken(tokenPresale.address);

    expect(await presale.presaleToken()).is.equal(tokenPresale.address);
  });

  it("receive presale tokens to the balance from owner", async () => {
    await presale.setPresaleToken(tokenPresale.address);

    await tokenPresale.connect(deployer).transfer(presale.address, ethers.utils.parseUnits("10000", 9));

    expect(await tokenPresale.balanceOf(presale.address)).is.equal(ethers.utils.parseUnits("10000", 9));
  });

  it("recover tokens back", async () => {

    expect(await tokenPresale.balanceOf(deployer.address)).is.equal(await tokenPresale.totalSupply())

    await tokenPresale.connect(deployer).transfer(presale.address, ethers.utils.parseUnits("500", 9));

    expect(await tokenPresale.balanceOf(presale.address)).is.equal(ethers.utils.parseUnits("500", 9));

    expect(await tokenPresale.balanceOf(deployer.address)).is.equal(
      (await tokenPresale.totalSupply()).sub(ethers.utils.parseUnits("500", 9))
    );

    await expect(presale.removeERC20(tokenPresale.address)).to.be.not.reverted;

    expect(await tokenPresale.balanceOf(deployer.address)).is.equal(await tokenPresale.totalSupply())

    expect(await tokenPresale.balanceOf(presale.address)).is.equal(ethers.utils.parseUnits("0", 9));
  });


  it("presale process", async () => {
    expect(await ethers.provider.getBalance(presale.address)).is.equal(ethers.utils.parseUnits("0", 18));

    await expect(deployer.sendTransaction({ to: presale.address, value: ethers.utils.parseEther("5") })).to.be.revertedWith("Presale is stopped");

    await presale.connect(deployer).setPresaleActive()

    expect(await presale.getPresaleStatus()).to.be.true;

    await expect(deployer.sendTransaction({ to: presale.address, value: ethers.utils.parseEther("5") })).to.be.revertedWith("Token not set");

    await presale.connect(deployer).setPresaleToken(tokenPresale.address);

    await expect(deployer.sendTransaction({ to: presale.address, value: ethers.utils.parseEther("5") })).to.be.revertedWith("Rate could not be 0");

    await presale.connect(deployer).setRate(1000);

    await expect(deployer.sendTransaction({ to: presale.address, value: ethers.utils.parseEther("5") })).to.be.revertedWith("Not enough tokens to sale");

    // fill up balance

    await tokenPresale.connect(deployer).transfer(presale.address, ethers.utils.parseUnits("10000", 9));

    expect(await tokenPresale.balanceOf(presale.address)).is.equal(ethers.utils.parseUnits("10000", 9));

    // make sure we don't have tokens

    expect(await tokenPresale.balanceOf(buyer1.address)).is.equal(ethers.utils.parseUnits("0", 9));
    expect(await tokenPresale.balanceOf(buyer2.address)).is.equal(ethers.utils.parseUnits("0", 9));

    await expect(buyer1.sendTransaction({to: presale.address, value: ethers.utils.parseEther("5")})).to.be.not.reverted;

    // if we have rate 1000 tokens per 1 eth , so let's check what we have then

    expect(await tokenPresale.balanceOf(buyer1.address)).is.equal(ethers.utils.parseUnits("5000", 9));

    await expect(buyer2.sendTransaction({to: presale.address, value: ethers.utils.parseEther("0.5")})).to.emit(presale, 'Bought');
    
    expect(await tokenPresale.balanceOf(buyer2.address)).is.equal(ethers.utils.parseUnits("500", 9));

    await expect(buyer3.sendTransaction({to: presale.address, value: ethers.utils.parseEther("0.1")})).to.emit(presale, 'Bought');
    
    expect(await tokenPresale.balanceOf(buyer3.address)).is.equal(ethers.utils.parseUnits("100", 9));

    await expect(buyer4.sendTransaction({to: presale.address, value: ethers.utils.parseEther("0.047")})).to.emit(presale, 'Bought');
    expect(await tokenPresale.balanceOf(buyer4.address)).is.equal(ethers.utils.parseUnits("47", 9));
  });
});
