import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { BASH_STARTING_MARKET_VALUE_IN_DAI, CONTRACTS } from '../../constants';

import { DAI__factory, UniswapV2Factory__factory, UniswapV2Pair__factory, UniswapV2Router02__factory } from '../../../types'
import { getCurrentBlockTime } from '../../../test/utils/blocktime';
import { BigNumber, providers } from 'ethers';
import { isLocalHardhatFork, isLocalTestingNetwork, isNotLocalTestingNetwork } from '../../network';
import { BASHERC20Token__factory } from '../../../types/factories/contracts/bashERC20.sol';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;

    const { deploy } = deployments;
    const { deployer, testWallet } = await getNamedAccounts();
    const signer = await ethers.provider.getSigner(deployer);

    console.log("Swapping DAI for BASH for testing accounts...");
    if (isNotLocalTestingNetwork(hre.network)) {
        console.error("Swapping DAI for BASH is only for local hardhat testing");
        throw "ERROR: Network configuration";
    }

    const daiDeployment = await deployments.get(CONTRACTS.DAI);
    const bashDeployment = await deployments.get(CONTRACTS.bash);    
    const uniswapRouterDeployment = await deployments.get(CONTRACTS.UniswapV2Router);
    const uniswapRouter = await UniswapV2Router02__factory.connect(uniswapRouterDeployment.address, signer);

    // var bashWanted = BigNumber.from(10);
    const bashWanted = "10".parseUnits(9);

    if (isLocalHardhatFork(hre.network)) {
        // multi route swap eth->bash
        const path = [await uniswapRouter.WETH(), daiDeployment.address, bashDeployment.address];   // eth->dai->bash

        const amountsIn = await uniswapRouter.getAmountsIn(bashWanted, path);
        var ethNeeded = amountsIn[0].add("0.25".parseUnits(18)); // .25 ETH
        const deadline = await getCurrentBlockTime() + 1000;
        console.log(`Deployer current ETH balance: ${(await ethers.provider.getBalance(deployer)).toEtherComma()}`);
        await uniswapRouter.swapETHForExactTokens(bashWanted, path, deployer, deadline, {value: ethNeeded});
    }
    else {
        // straight DAI->BASH
        const path = [daiDeployment.address, bashDeployment.address];   // dai->bash

        var amountsIn = await uniswapRouter.getAmountsIn(bashWanted, path);
        const daiNeeded = amountsIn[0];
        console.log(`DAI needed for swap: ${daiNeeded.toEtherComma()}`)
        const daiMax = daiNeeded.add("80" + "000000000000000000");  // add one token worth rougly

        const dai = await DAI__factory.connect(daiDeployment.address, signer);
        console.log(`Bash wanted: ${bashWanted.toGweiComma()} gwei, Dai Max: ${daiMax.toEtherComma()}, DAI balance: ${(await dai.balanceOf(deployer)).toEtherComma()}`)

        await dai.approve(uniswapRouterDeployment.address, daiMax);

        const deadline = await getCurrentBlockTime() + 1000;
        await uniswapRouter.swapTokensForExactTokens(bashWanted, daiMax, path, deployer, deadline);
    }

    const bash = await BASHERC20Token__factory.connect(bashDeployment.address, signer);

    if (isLocalTestingNetwork(hre.network)) {
        const bashBalance = await bash.balanceOf(deployer);
        await bash.transfer(testWallet, bashBalance.div(2));
        console.log(`Test wallet (${testWallet}) BASH: ${(await bash.balanceOf(testWallet)).toGweiComma()}`);
    }
    console.log(`Deployer BASH: ${(await bash.balanceOf(deployer)).toGweiComma()}`);
    console.log("Added BASH for deployer and testWallet");
};

// only deploy to hardhat local
func.skip = async (hre: HardhatRuntimeEnvironment) => isNotLocalTestingNetwork(hre.network);

func.tags = ["Fixture"];
func.dependencies = [CONTRACTS.DAI, CONTRACTS.bash, CONTRACTS.UniswapV2Router]
export default func;
