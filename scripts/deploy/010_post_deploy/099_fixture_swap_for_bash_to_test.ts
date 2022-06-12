import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction, Deployment } from 'hardhat-deploy/types';
import { BASH_STARTING_MARKET_VALUE_IN_DAI, CONTRACTS, INITIAL_BASH_LIQUIDITY_IN_DAI } from '../../constants';

import { BashTreasury__factory, BASHERC20Token__factory, DAI__factory, ISwapRouter02__factory, UniswapV2Factory__factory, UniswapV2Pair__factory, UniswapV2Router02__factory, ABASHERC20__factory } from '../../../types'
import { getCurrentBlockTime } from '../../../test/utils/blocktime';
import { BigNumber, providers } from 'ethers';
import { isLocalHardhatFork, isLocalTestingNetwork, isNotLocalTestingNetwork } from '../../network';
// import { BASHERC20Token__factory } from '../../../types/factories/contracts/bashERC20.sol';
import { waitFor } from '../../txHelper';
import { deployments } from 'hardhat';
// import { BashTreasury__factory } from '../../../types/factories/contracts/Treasury.sol';
import { parseEther, parseUnits } from 'ethers/lib/utils';

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
    const dai = await DAI__factory.connect(daiDeployment.address, signer);

    const bashWanted = "10".parseUnits(9);
    let daiNeeded: BigNumber;
    const pathDaiBash = [daiDeployment.address, bashDeployment.address];   // dai->bash
    const deadline = await getCurrentBlockTime() + 1000;

    // straight DAI->BASH quote for localhost hardhat with mock DAI
    const amountsIn = await uniswapRouter.getAmountsIn(bashWanted, pathDaiBash);
    daiNeeded = amountsIn[0];

    // swaps
    // 1. dai->bash
    // 2. eth->dai
    // 3. bash, dai -> bash-dai lp

    const uniswapV2FactoryDeployment = await deployments.get(CONTRACTS.UniswapV2Factory);
    const uniswapV2Factory = await UniswapV2Factory__factory.connect(uniswapV2FactoryDeployment.address, signer);
    const bash = await BASHERC20Token__factory.connect(bashDeployment.address, signer);
    const bashDaiAddress = await uniswapV2Factory.getPair(bash.address, dai.address);
    const bashDai = await UniswapV2Pair__factory.connect(bashDaiAddress, signer);    

    const ethDaiAddress = await uniswapV2Factory.getPair(await uniswapRouter.WETH(), dai.address);
    const ethDai = await UniswapV2Pair__factory.connect(ethDaiAddress, signer);
    if (isLocalHardhatFork(hre.network) || hre.network.name.toLowerCase() == "localhost") {
        // swap eth->dai on networks that need to use eth-dai swapping (instead of DAI minting)
        // const ethDaiBashPath = [await uniswapRouter.WETH(), daiDeployment.address, bashDeployment.address];   // eth->dai->bash
        const ethDaiPath = [await uniswapRouter.WETH(), daiDeployment.address]; //, bashDeployment.address];   // eth->dai->bash

        // get quotes
        daiNeeded = daiNeeded.add("250".parseUnits(18)); // .add("1000".parseUnits(18)); // add some test spending DAI
        const reserves = await ethDai.getReserves();
        // const ethNeeded = await uniswapRouter.getAmountIn(daiNeeded, reserves[1], reserves[0]);
        const ethDaiAmounts = await uniswapRouter.getAmountsIn(daiNeeded, ethDaiPath);
        var ethNeeded = ethDaiAmounts[0].add(".25".parseUnits(18)); // .25 ETH // todo: fix
        var daiBalance = await dai.balanceOf(deployer);
        console.log(`Deployer current ETH balance: ${(await ethers.provider.getBalance(deployer)).toEtherComma()}, DAI: ${daiBalance.toEtherComma()}`);
        console.log(`ETH required ${ethNeeded.toEtherComma()} for DAI wanted ${daiNeeded.toEtherComma()}`)
        // v2 multiswap doesn't work because of rinkeby
        // await uniswapRouter.swapETHForExactTokens(bashWanted, path, deployer, deadline, {value: ethNeeded});
        
        // v3 using swap router
        const swapRouter02Deployment = await deployments.get(CONTRACTS.SwapRouter02);
        const swapRouter02 = await ISwapRouter02__factory.connect(
            swapRouter02Deployment.address,
            signer
        );
        const wethDeployment = await deployments.get(CONTRACTS.WETH);
        const poolFee = 3000;


        // v3 swap
        // for exactOutput - but this doesn't work probably b/c bash-dai is in v2 pool
        // const pathEncoded = ethers.utils.solidityPack(
        //     ["address","uint24", "address", "uint24", "address"],  
        //     // [wethDeployment.address, poolFee, daiDeployment.address, poolFee, bashDeployment.address],
        //     [bashDeployment.address, poolFee, daiDeployment.address, poolFee, wethDeployment.address]
        // );
        await waitFor(swapRouter02.exactOutputSingle({
                amountOut: daiNeeded,
                recipient: deployer,
                amountInMaximum: ethNeeded,
                tokenIn: wethDeployment.address,
                tokenOut: daiDeployment.address,
                sqrtPriceLimitX96: 0,
                fee: poolFee
            }, 
            { 
                value: ethNeeded 
            }
        ));
    }
    else {
        // straight DAI->BASH quote for localhost hardhat with mock DAI
        // const amountsIn = await uniswapRouter.getAmountsIn(bashWanted, pathDaiBash);
        // daiNeeded = amountsIn[0];
    }

    // v2 DAI->BASH
    console.log(`DAI needed for swap: ${daiNeeded.toEtherComma()}`)
    console.log(`BASH wanted: ${bashWanted.toGweiComma()} gwei, DAI needed: ${daiNeeded.toEtherComma()}, Current DAI balance: ${(await dai.balanceOf(deployer)).toEtherComma()}`)

    await dai.approve(uniswapRouterDeployment.address, daiNeeded);
    await uniswapRouter.swapTokensForExactTokens(bashWanted, daiNeeded, pathDaiBash, deployer, deadline);


    // BASH-DAI LP
    /////////////////////////

    if (true) {
        

        console.log(`Creating liquidity for BASH-DAI`);
        console.log(`BASH-DAI LP Pair (Token 0: ${await bashDai.token0()}, Token 1: ${await bashDai.token1()}`);

        console.log(`Current deployer bash amount: ${(await bash.balanceOf(deployer)).toGweiComma()}`);
        const bashLiquidityInDai = 250;
        const bashLiquidityNeededAtMarketLaunchPricing = bashLiquidityInDai / BASH_STARTING_MARKET_VALUE_IN_DAI;
        const bashAmountInGwei = parseUnits(bashLiquidityNeededAtMarketLaunchPricing.toString(), "gwei"); // bash decimals
        
        await bash.approve(deployer, bashAmountInGwei);
        await bash.transferFrom(deployer, bashDai.address, bashAmountInGwei);  
        
        console.log(`Current deployer DAI amount: ${(await dai.balanceOf(deployer)).toEtherComma()}`);
        const bashAmountInWei = parseEther(bashLiquidityNeededAtMarketLaunchPricing.toString());
        const daiAmount = bashAmountInWei.mul(BASH_STARTING_MARKET_VALUE_IN_DAI);

        console.log(`Check deposit bashdai liquidity: Bash Amount ${bashAmountInGwei.toGweiComma()}, Dai Amount: ${daiAmount.toEtherComma()}`);

        await dai.approve(deployer, daiAmount);
        await dai.transferFrom(deployer, bashDai.address, daiAmount); 

        await bashDai.mint(deployer);
        const balance = await bashDai.balanceOf(deployer);
        console.log(`BASH-DAI balanceOf: ${balance.toEtherComma()}`);
    }

    ///////////////////////

    // Divide up for local testing
    if (isLocalTestingNetwork(hre.network) || isLocalHardhatFork(hre.network)) {
        const bashBalance = await bash.balanceOf(deployer);
        var transferAmount = bashBalance.div(2);
        await bash.approve(deployer, transferAmount);
        await bash.transferFrom(deployer, testWallet, transferAmount);

        var transferAmount = (await dai.balanceOf(deployer)).div(2);
        await dai.approve(deployer, transferAmount);
        await dai.transferFrom(deployer, testWallet, transferAmount);

        // var transferAmount = (await bashDai.balanceOf(deployer));
        // await bashDai.approve(deployer, transferAmount);
        // await bashDai.transferFrom(deployer, testWallet, transferAmount);
    }

    console.log(`Added BASH for deployer ${deployer} and testWallet ${testWallet}`);
    // console.log(`Deployer BASH: ${(await bash.balanceOf(deployer)).toGweiComma()}`);
    await displayAllBalances(ethers.provider, [deployer, testWallet]);
};

// only deploy to hardhat local
func.skip = async (hre: HardhatRuntimeEnvironment) => isNotLocalTestingNetwork(hre.network);
// func.skip = async (hre: HardhatRuntimeEnvironment) => true;
func.tags = ["PostLaunchTesting"];
func.dependencies = [CONTRACTS.DAI, CONTRACTS.bash, CONTRACTS.UniswapV2Router]
export default func;

async function displayAllBalances(provider: providers.JsonRpcProvider, addresses: string[]) {
    const signer = provider.getSigner(addresses[0]);
    const daiDeployment = await deployments.get(CONTRACTS.DAI);
    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const bash = await BASHERC20Token__factory.connect(bashDeployment.address, signer);
    const dai = await DAI__factory.connect(daiDeployment.address, signer);
    const bashDaiDeployment = await deployments.get(CONTRACTS.bashDaiLpPair);
    const bashDai = await UniswapV2Pair__factory.connect(bashDaiDeployment.address, signer);
    const abashDeployments = await deployments.get(CONTRACTS.aBash);
    const abash = await ABASHERC20__factory.connect(abashDeployments.address, signer);

    for(var index = 0; index < addresses.length; index++) {
        const address = addresses[index];
        const bashBalance = (await bash.balanceOf(address)).toGweiComma(); // 9 decimals
        const daiBalance = (await dai.balanceOf(address)).toEtherComma();
        const bashDaiBalance = (await bashDai.balanceOf(address)).toEtherComma();
        const abashBalance = (await abash.balanceOf(address)).toEtherComma();
        if (index == 0) 
            console.log(`Deployer Balances:`);
        else
            console.log(`Account ${index} ${address} Balances: `);

        displayBalances(bashBalance, daiBalance, bashDaiBalance, abashBalance);
    };
}

function displayBalances(bashBalance: string, daiBalance: string, bashDaiBalance: string, abashBalance: string) {
    console.log(`\tBASH: ${bashBalance}`);
    console.log(`\tDAI: ${daiBalance}`);
    console.log(`\tBASH-DAI: ${bashDaiBalance}`);
    console.log(`\tABASH: ${abashBalance}`);
}

