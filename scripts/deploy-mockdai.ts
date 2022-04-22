// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account: " + deployer.address);

    const MIM = await hre.ethers.getContractFactory("MockERC20");
    const mim = await MIM.deploy("dai", "dai", "10000000000000000000000000000")
    await mim.deployed()
    console.log(`dai:  ${mim.address}`)

    var tx = await mim.mint("150000000000000000000000000000000000000000000")
    await tx.wait(1)
    console.log("Minted dai ");
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
