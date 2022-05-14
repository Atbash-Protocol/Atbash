import hre, { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { CONTRACTS } from "./constants";
import { BashTreasury__factory, UniswapV2Pair__factory } from "../types";

dotenv.config();

async function main() {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);
    
    const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
    const treasury = BashTreasury__factory.connect(treasuryDeployment.address, signer);

    const bashDaiLpPairDeployment = await deployments.get(CONTRACTS.bashDaiLpPair);


    const bashDai = await UniswapV2Pair__factory.connect(bashDaiLpPairDeployment.address, signer);
    const balance = await bashDai.balanceOf(deployer);

    var t2 = await ethers.getContractAt("BashTreasury", treasuryDeployment.address);
    var r2 = await t2.tokenValue(bashDaiLpPairDeployment.address, 1);
    // var t3 = await t2.valueOf(bashDaiLpPairDeployment.address, 1);

    const result = await treasury.tokenValue(bashDaiLpPairDeployment.address, balance);
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });