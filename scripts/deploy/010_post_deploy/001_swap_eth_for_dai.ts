import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { BASH_STARTING_MARKET_VALUE_IN_DAI, CONTRACTS, INITIAL_BASH_LIQUIDITY_IN_DAI, INITIAL_DAI_RESERVES_AMOUNT, INITIAL_INDEX, STAKING_REWARD_RATE, TREASURY_TIMELOCK } from '../../constants';

import { DAI__factory, ISwapRouter02__factory, UniswapV2Router02__factory, UniswapV2Factory__factory, ABASHERC20__factory } from '../../../types'
import { waitFor } from '../../txHelper'
import { isLocalTestingNetwork } from '../../network';
import { BigNumber } from 'ethers';
import { getCurrentBlockTime } from '../../../test/utils/blocktime';
// import { UniswapV2Factory__factory } from '../../../types/factories/contracts/uniswap';
import { assert } from 'chai';
import '../../string-extensions';
import '../../ethers-extensions';
import { liveNetworkConfirm } from '../../confirm';

// acquire enough dai to setup reserves and LP
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);
   
    console.log("Swapping ETH for DAI for deployer wallet...");

    // todo: Consider allowing automatic swap
    // note: this requires deployer to have the necessary DAI funds already in wallet
    // if (isNotLocalHardhatFork(hre.network)) {
    //     console.error("Swapping ETH for DAI deposits are only for hardhat when forked");
    //     throw "ERROR: Network configuration";
    // }
    if (isLocalTestingNetwork(hre.network)) {
        console.error("Swapping ETH for DAI deposits are not setup for local hardhat non-forked networks");
        throw "ERROR: Network configuration";
    }

    const daiDeployment = await deployments.get(CONTRACTS.DAI);
    const uniswapRouterDeployment = await deployments.get(CONTRACTS.UniswapV2Router);
    const uniswapRouter = await UniswapV2Router02__factory.connect(uniswapRouterDeployment.address, signer);
    const dai = await DAI__factory.connect(daiDeployment.address, signer);
    
    var deployerDaiAmount = await dai.balanceOf(deployer);
    console.log(`Deployer current DAI balance: ${deployerDaiAmount.toEtherComma()}, ETH: ${(await ethers.provider.getBalance(deployer)).toEtherComma()}`);
    
    const initialBashLiquidityInDai = INITIAL_BASH_LIQUIDITY_IN_DAI.toString().parseUnits(18);
    var bashStartingMarketValueInDai = BASH_STARTING_MARKET_VALUE_IN_DAI.toString().toBigNumber();
    var initialDaiReservesAmount = INITIAL_DAI_RESERVES_AMOUNT.toString().parseUnits(18);

    var daiNeededForTreasuryMint = initialBashLiquidityInDai.div(bashStartingMarketValueInDai);
    var daiWanted = daiNeededForTreasuryMint.add(initialBashLiquidityInDai).add(initialDaiReservesAmount); 

    // get presale amount needed to cover redemptions, at 1:1:1 (bash:dai:eth)
    var presaleDeployment = await deployments.get(CONTRACTS.atbashPresale);
    var abashDeployment = await deployments.get(CONTRACTS.aBash);
    var abash = await ABASHERC20__factory.connect(abashDeployment.address, signer);
    // redeemable = totalSupply - presale
    var amountForRedeem = (await abash.totalSupply()).sub(await abash.balanceOf(presaleDeployment.address));
    console.log(`Amount DAI needed to cover for Presale redemption: ${amountForRedeem.toEtherComma()}`);
    daiWanted = daiWanted.add(amountForRedeem);

    console.log(`Using the existing deployer DAI funds available: ${deployerDaiAmount.toEtherComma()}`);
    if (daiWanted.lte(deployerDaiAmount)) {
      console.log("No need to swap ETH for DAI, deployer wallet is sufficient in funding.");
      return true;
    }
    else 
      daiWanted = daiWanted.sub(deployerDaiAmount);

    console.log(`Uniswap WETH address: ${await uniswapRouter.WETH()}, DAI address: ${dai.address}`);
    console.log(`DAI wanted: ${daiWanted}`);
    const path = [await uniswapRouter.WETH(), daiDeployment.address];   // eth->dai
    const amountsIn = await uniswapRouter.getAmountsIn(daiWanted, path);
    const ethNeeded = amountsIn[0];
    // const ethNeeded = await uniswapRouter.getAmountIn(daiWanted, reserves._reserve1, reserves._reserve0);
    console.log(`Total DAI wanted: ${daiWanted.toEtherComma()}, ETH needed for swap: ${ethNeeded.toEtherComma()}`);
    
    await liveNetworkConfirm(hre.network, `Are you sure you want to spend ${ethNeeded.toEtherComma()} ETH for swap? `);

    const deadline = await getCurrentBlockTime() + (2 * 60);
    // v2: eth->dai swaps don't work with rinkeby - overflow results 
    // v2: await uniswapRouter.swapETHForExactTokens(daiWanted, path, deployer, deadline, { value: ethNeeded });
    
    // v3 using swap router
    const swapRouter02Deployment = await deployments.get(CONTRACTS.SwapRouter02);
    const swapRouter02 = await ISwapRouter02__factory.connect(
        swapRouter02Deployment.address,
        signer
    );
    const wethDeployment = await deployments.get(CONTRACTS.WETH);

    await waitFor(
        swapRouter02.exactOutputSingle(
          {
            tokenIn: wethDeployment.address,
            tokenOut: daiDeployment.address,
            recipient: deployer,
            amountOut: daiWanted,
            // fee: 3000, // todo: how to determine this?
            fee: 500,
            amountInMaximum: ethNeeded, 
            sqrtPriceLimitX96: 0, // todo: put in a protection for production?
          },
          {
            value: ethNeeded,
          }
        )
      );

    // show balances
    var daiBalance = await dai.balanceOf(deployer);
    var ethBalance = await ethers.provider.getBalance(deployer);
    console.log(`Swapped ETH for DAI, new deployer balance DAI: ${daiBalance.toEtherComma()}, ETH: ${ethBalance.toEtherComma()}`);
    return true;
};

// func.skip = async (env: HardhatRuntimeEnvironment) => isNotLocalHardhatFork(env.network);
func.skip = async (env: HardhatRuntimeEnvironment) => skipWithMessage(isLocalTestingNetwork(env.network));

function skipWithMessage(result: boolean) :boolean {
    if (result) console.log("Skipping " + func.id);
    return result;
}

func.id = "2022-launch-swap-eth-for-dai"
func.dependencies = [CONTRACTS.DAI, CONTRACTS.WETH, CONTRACTS.SwapRouter02,
                    CONTRACTS.UniswapV2Factory, CONTRACTS.UniswapV2Router];
func.tags = ["Launch"];
export default func;

