import hre, { ethers, getChainId } from "hardhat";
import * as dotenv from "dotenv";
import { CONTRACTS } from "./constants";
import { BASHERC20Token__factory, DAI__factory } from "../types";

dotenv.config();

async function main() {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);
    
    console.log(`Network: ${hre.network.name}, live: ${hre.network.live}, chain: ${await getChainId()}`);
    
    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const bash = await BASHERC20Token__factory.connect(bashDeployment.address, signer);
    const bashBalance = await bash.balanceOf(deployer);
    console.log(`Bash balance: ${bashBalance}`);

    const daiDeployment = await deployments.get(CONTRACTS.DAI);
    const dai = await DAI__factory.connect(daiDeployment.address, signer);
    console.log(`DAI balance: ${await dai.balanceOf(deployer)}`);
    
    // bash dai testing

    // const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
    // const treasury = BashTreasury__factory.connect(treasuryDeployment.address, signer);

    // const bashDaiLpPairDeployment = await deployments.get(CONTRACTS.bashDaiLpPair);


    // const bashDai = await UniswapV2Pair__factory.connect(bashDaiLpPairDeployment.address, signer);
    // const balance = await bashDai.balanceOf(deployer);

    // var t2 = await ethers.getContractAt("BashTreasury", treasuryDeployment.address);
    // var r2 = await t2.tokenValue(bashDaiLpPairDeployment.address, 1);
    // // var t3 = await t2.valueOf(bashDaiLpPairDeployment.address, 1);

    // const result = await treasury.tokenValue(bashDaiLpPairDeployment.address, balance);
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });