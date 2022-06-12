import { providers } from "ethers";
import { deployments } from "hardhat";
import { BASHERC20Token__factory, DAI__factory, UniswapV2Pair__factory, ABASHERC20__factory } from "../types";
import { CONTRACTS } from "./constants";
import "./extensions";
import { Address } from "hardhat-deploy/types";

import hre, { ethers, getChainId } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();


async function main() {
    const namedAccounts = await hre.getNamedAccounts();
    const provider = hre.ethers.provider;
    await displayAllBalances(provider, namedAccounts);
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error);
        process.exit(1);
});

async function displayAllBalances(provider: providers.JsonRpcProvider, accounts: { [name: string]: Address} ) {
    // const signer = provider.getSigner(accounts[0][1]);
    const signer = provider.getSigner();
    const daiDeployment = await deployments.get(CONTRACTS.DAI);
    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const bash = await BASHERC20Token__factory.connect(bashDeployment.address, signer);
    const dai = await DAI__factory.connect(daiDeployment.address, signer);
    const bashDaiDeployment = await deployments.get(CONTRACTS.bashDaiLpPair);
    const bashDai = await UniswapV2Pair__factory.connect(bashDaiDeployment.address, signer);
    const abashDeployments = await deployments.get(CONTRACTS.aBash);
    const abash = await ABASHERC20__factory.connect(abashDeployments.address, signer);

    for (const account of Object.entries(accounts)) {
        const address = account[1];
        const bashBalance = (await bash.balanceOf(address)).toGweiComma(); // 9 decimals
        const daiBalance = (await dai.balanceOf(address)).toEtherComma();
        const bashDaiBalance = (await bashDai.balanceOf(address)).toEtherComma();
        const abashBalance = (await abash.balanceOf(address)).toEtherComma();
        console.log(`Account ${account[0]} ${account[1]} Balances: `);

        displayBalances(bashBalance, daiBalance, bashDaiBalance, abashBalance);
    };
}

function displayBalances(bashBalance: string, daiBalance: string, bashDaiBalance: string, abashBalance: string) {
    console.log(`\tBASH: ${bashBalance}`);
    console.log(`\tDAI: ${daiBalance}`);
    console.log(`\tBASH-DAI: ${bashDaiBalance}`);
    console.log(`\tABASH: ${abashBalance}`);
}