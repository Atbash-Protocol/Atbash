// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";

async function main() {
    await hre.run("verify:verify", {
        address: process.env.PRESALE_ADDR,
        constructorArguments: [
            process.env.BENEF
        ],
    });

    await hre.run("verify:verify", {
        address: process.env.ERC20_ADDR,
        constructorArguments: [ethers.utils.parseUnits("100000", 9)],
    });

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
