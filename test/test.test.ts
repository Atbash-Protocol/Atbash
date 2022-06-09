import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import chai, { expect } from "chai";
import { ethers, network } from "hardhat";
const { BigNumber } = ethers;
import { FakeContract, smock } from "@defi-wonderland/smock";
import {
    BashTreasury__factory,
    IDai,
    IBash,
    IStaking,
    IDistributor,
    IsBash, 
    IWarmup,
    // IsOHM,
    IERC20,
    ATBASHStaking,
    ATBASHStaking__factory,
    BashTreasury,
    ATBASHBondingCalculator,
    IUniswapV2Pair,
    IUniswapV2Pair__factory,
    // OlympusAuthority,
    // OlympusAuthority__factory,
} from "../types";
import { getCurrentBlockTime, advanceBlockTime } from "./utils/blocktime";
import { CONTRACTS, MANAGING, ZERO_ADDRESS } from "../scripts/constants";
import * as hre from 'hardhat';
import {DeployFunction} from 'hardhat-deploy/types';
import { parseEther, parseUnits } from 'ethers/lib/utils';

chai.should();
chai.use(smock.matchers);

const BASH_DECIMALS = 1;
const DAI_DECIMALS = (BASH_DECIMALS * 2).toFixed();
const BASHDAI_DECIMALS = DAI_DECIMALS;
const NO_LOCKING_TIMEOUT = 0;


describe("test", () => {
    let owner: SignerWithAddress;
    let reserveManager: SignerWithAddress;
    let depositor: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let other: SignerWithAddress;

    it("does things", async () => {
        const { deployments, getNamedAccounts, network, ethers } = hre;
        const { deploy } = deployments;
        const { deployer } = await getNamedAccounts();
        const signer = ethers.provider.getSigner(deployer);
        [owner, alice, bob, other, depositor] = await ethers.getSigners();
        
        const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
        const treasury = BashTreasury__factory.connect(treasuryDeployment.address, signer);

        const bashDaiLpPairDeployment = await deployments.get(CONTRACTS.bashDaiLpPair);


        const bashDai = await IUniswapV2Pair__factory.connect(bashDaiLpPairDeployment.address, signer);
        const balance = await bashDai.balanceOf(deployer);


        const result = await treasury.tokenValue(bashDaiLpPairDeployment.address, balance);


    });
});


// const { deployments, getNamedAccounts, network, ethers } = hre;
//     const { deploy } = deployments;
//     const { deployer } = await getNamedAccounts();
//     const signer = ethers.provider.getSigner(deployer);

//     const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
//     const treasury = BashTreasury__factory.connect(treasuryDeployment.address, signer);

//     let bashDaiLpPairDeployment: Deployment;
//     try {
//         bashDaiLpPairDeployment = await deployments.get(CONTRACTS.bashDaiLpPair);
//     }
//     catch (e: any) {
//         console.error(`BASH-DAI LP deployment not found for network: ${hre.network.name}, Exception: ${e}`);
//         throw "BASH-DAI LP deployment not found";
//     }

//     console.log(`bashDaiLp Address: ${bashDaiLpPairDeployment.address}, num deployments: ${bashDaiLpPairDeployment.numDeployments}`);
//     const bashDai = await UniswapV2Pair__factory.connect(bashDaiLpPairDeployment.address, signer);
//     const balance = await bashDai.balanceOf(deployer);
//     await bashDai.approve(treasury.address, balance);
//     console.log(`Token 0: ${await bashDai.token0()}, token 1: ${await bashDai.token1()}`);

//     console.log(`Current deployer BASH-DAI balance: ${balance}, address: ${bashDaiLpPairDeployment.address}`);
//     // const profit = 0;
//     // todo: what should we do with this profit? 
//     // todo: why double deposit 25k?
//     const profit = await treasury.callStatic.valueOf(bashDaiLpPairDeployment.address, balance.toString());
//     console.log(`${balance} of BASH-DAI is worth ${profit} BASH, ${typeof(profit)}`);   
//     await waitFor(treasury.deposit(balance, bashDaiLpPairDeployment.address, profit));
//     console.log(`Deposited ${balance} BASH-DAI to treasury`);
//     return true;