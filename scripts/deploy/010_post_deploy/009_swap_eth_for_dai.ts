import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { BASH_STARTING_MARKET_VALUE_IN_DAI, CONTRACTS, INITIAL_BASH_LIQUIDITY_IN_DAI, INITIAL_DAI_RESERVES_AMOUNT, INITIAL_INDEX, STAKING_REWARD_RATE, TREASURY_TIMELOCK } from '../../constants';

import { DAI__factory, Distributor__factory, SBASH__factory, UniswapV2Pair__factory, UniswapV2Router02__factory } from '../../../types'
import { waitFor } from '../../txHelper'
import { isLiveMainnet, isLocalHardhatFork, isLocalTestingNetwork, isNotLocalHardhatFork, isNotLocalTestingNetwork } from '../../network';
import { BigNumber, ethers, getDefaultProvider, utils } from 'ethers';
import { getCurrentBlockTime } from '../../../test/utils/blocktime';
import { UniswapV2Factory__factory } from '../../../types/factories/contracts/uniswap';
import { assert } from 'chai';
import '../../extensions';
import { mainNetConfirm } from '../../confirm';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);
   
    console.log("Swapping ETH for DAI for deployer wallet...");

    // todo: Consider allowing automatic swap
    if (isNotLocalHardhatFork(hre.network)) {
        console.error("Swapping ETH for DAI deposits are only for hardhat when forked");
        throw "ERROR: Network configuration";
    }
    const daiDeployment = await deployments.get(CONTRACTS.DAI);
    const uniswapRouterDeployment = await deployments.get(CONTRACTS.UniswapV2Router);
    const uniswapRouter = await UniswapV2Router02__factory.connect(uniswapRouterDeployment.address, signer);
    const uniswapFactoryDeployment = await deployments.get(CONTRACTS.UniswapV2Factory);
    const uniswapFactory = await UniswapV2Factory__factory.connect(uniswapFactoryDeployment.address, signer);
    const dai = await DAI__factory.connect(daiDeployment.address, signer);
    
    console.log(`DAI balance: ${(await dai.balanceOf(deployer)).toEtherComma()}, ETH: ${(await ethers.provider.getBalance(deployer)).toEtherComma()}`);
    
    const ethDaiAddress = await uniswapFactory.getPair(await uniswapRouter.WETH(), daiDeployment.address);
    const ethDai = await UniswapV2Pair__factory.connect(ethDaiAddress, signer);
    const reserves = await ethDai.getReserves();
    
    const initialBashLiquidityInDai = INITIAL_BASH_LIQUIDITY_IN_DAI.toString().parseUnits(18);
    var bashStartingMarketValueInDai = BASH_STARTING_MARKET_VALUE_IN_DAI.toString().toBigNumber();
    var initialDaiReservesAmount = INITIAL_DAI_RESERVES_AMOUNT.toString().parseUnits(18);

    var daiNeededForMint = initialBashLiquidityInDai.div(bashStartingMarketValueInDai);
    var daiWanted = daiNeededForMint.add(initialBashLiquidityInDai).add(initialDaiReservesAmount); 

    // todo: remove guard
    var daiWanted2 = BigNumber.from("30312" + "500000000000000000"); // todo use calculation
    assert(daiWanted.eq(daiWanted2));

    const ethNeeded = await uniswapRouter.getAmountIn(daiWanted, reserves._reserve1, reserves._reserve0);
    console.log(`DAI wanted: ${daiWanted.toEtherComma()}, ETH needed for swap: ${ethNeeded.toEtherComma()}`);
    await mainNetConfirm(hre.network, `Are you sure you want to spend ${ethNeeded.toEtherComma()} ETH for swap? `);

    const path = [await uniswapRouter.WETH(), daiDeployment.address];   // eth->dai
    const deadline = await getCurrentBlockTime() + (5 * 60);
    await uniswapRouter.swapETHForExactTokens(daiWanted, path, deployer, deadline, { value: ethNeeded });
    const daiBalance = await dai.balanceOf(deployer);
    const ethBalance = await ethers.provider.getBalance(deployer);
    console.log(`Swapped ETH for DAI, new deployer balance DAI: ${daiBalance.toEtherComma()}, ETH: ${ethBalance.toEtherComma()}`);
};

func.skip = async (env: HardhatRuntimeEnvironment) => isNotLocalHardhatFork(env.network);

func.id = "2022-launch-swap-eth-for-dai"
func.dependencies = [CONTRACTS.DAI, 
                    CONTRACTS.UniswapV2Factory, CONTRACTS.UniswapV2Router];
func.tags = ["Launch"];
export default func;

