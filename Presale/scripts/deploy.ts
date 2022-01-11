// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";

async function main() {

  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');
  console.log("Deploying presale contract");
  const Presale = await ethers.getContractFactory("Presale");
  const presale = await Presale.deploy(process.env.BENEF as string);
  await presale.deployed();

  // await hre.run("verify:verify", {
  //   address: presale.address,
  //   constructorArguments: [
  //     '0x31940eE01803476a970ec6DF1094a53F80e6827b'
  //   ],
    // });
  console.log("Deploying token contract")
  const ERC20 = await ethers.getContractFactory("ERC20Token");
  const tokenPresale = await ERC20.deploy(ethers.utils.parseUnits("100000", 18));
  await tokenPresale.deployed();

  // await hre.run("verify:verify", {
  //   address: tokenPresale.address,
  //   constructorArguments: [ethers.utils.parseUnits("100000", 9)],
  // });

  console.log(`Presale contract was deployed to ${presale.address}`);

  console.log(`ERC20 token contract was deployed to ${tokenPresale.address}`)

  console.log("Initial setup")

  await presale.setPresaleToken(tokenPresale.address);
  await presale.setRate(50);

  console.log('Update deployed contract addresses in .env and run verify script.')
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
