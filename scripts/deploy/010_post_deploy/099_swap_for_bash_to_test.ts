import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { BASH_STARTING_MARKET_VALUE_IN_DAI, CONTRACTS } from '../../constants';

import { DAI__factory, ISwapRouter02__factory, UniswapV2Factory__factory, UniswapV2Pair__factory, UniswapV2Router02__factory } from '../../../types'
import { getCurrentBlockTime } from '../../../test/utils/blocktime';
import { BigNumber, providers } from 'ethers';
import { isLocalHardhatFork, isLocalTestingNetwork, isNotLocalTestingNetwork } from '../../network';
import { BASHERC20Token__factory } from '../../../types/factories/contracts/bashERC20.sol';
import { AbiCoder, defaultAbiCoder } from 'ethers/lib/utils';
import { waitFor } from '../../txHelper';
import { deployments } from 'hardhat';

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

    if (isLocalHardhatFork(hre.network)) {
        // multi route swap eth->bash first
        const ethDaiBashPath = [await uniswapRouter.WETH(), daiDeployment.address, bashDeployment.address];   // eth->dai->bash

        // get quotes
        const ethDaiBashAmounts = await uniswapRouter.getAmountsIn(bashWanted, ethDaiBashPath);
        var ethNeeded = ethDaiBashAmounts[0].add("0.05".parseUnits(18)); // .25 ETH // todo: fix
        daiNeeded = ethDaiBashAmounts[1]; //.add("1000".parseUnits(18)); // add some test spending DAI
        var daiBalance = await dai.balanceOf(deployer);
        console.log(`Deployer current ETH balance: ${(await ethers.provider.getBalance(deployer)).toEtherComma()}, DAI: ${daiBalance.toEtherComma()}`);
        
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
        dai.approve(uniswapRouter.address, ethDaiBashAmounts[1]);   // dai needed

        // v3 swap
        // for exactOutput - but this doesn't work probably b/c bash-dai is in v2 pool
        // const pathEncoded = ethers.utils.solidityPack(
        //     ["address","uint24", "address", "uint24", "address"],  
        //     // [wethDeployment.address, poolFee, daiDeployment.address, poolFee, bashDeployment.address],
        //     [bashDeployment.address, poolFee, daiDeployment.address, poolFee, wethDeployment.address]
        // );
        await waitFor(swapRouter02.exactOutputSingle(
            {
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
        const amountsIn = await uniswapRouter.getAmountsIn(bashWanted, pathDaiBash);
        daiNeeded = amountsIn[0];
    }

    // v2 DAI->BASH
    console.log(`DAI needed for swap: ${daiNeeded.toEtherComma()}`)
    console.log(`BASH wanted: ${bashWanted.toGweiComma()} gwei, DAI needed: ${daiNeeded.toEtherComma()}, Current DAI balance: ${(await dai.balanceOf(deployer)).toEtherComma()}`)

    await dai.approve(uniswapRouterDeployment.address, daiNeeded);
    await uniswapRouter.swapTokensForExactTokens(bashWanted, daiNeeded, pathDaiBash, deployer, deadline);

    // Divide up for local
    const bash = await BASHERC20Token__factory.connect(bashDeployment.address, signer);
    if (isLocalTestingNetwork(hre.network) || isLocalHardhatFork(hre.network)) {
        const bashBalance = await bash.balanceOf(deployer);
        const transferAmount = bashBalance.div(2);
        await bash.approve(deployer, transferAmount);
        await bash.transferFrom(deployer, testWallet, transferAmount);
        console.log(`Test wallet (${testWallet}) BASH: ${(await bash.balanceOf(testWallet)).toGweiComma()}`);
    }
    console.log(`Added BASH for deployer ${deployer} and testWallet ${testWallet}`);
    // console.log(`Deployer BASH: ${(await bash.balanceOf(deployer)).toGweiComma()}`);
    await displayAllBalances(ethers.provider, [deployer, testWallet]);
    
};

// only deploy to hardhat local
func.skip = async (hre: HardhatRuntimeEnvironment) => isNotLocalTestingNetwork(hre.network);

func.tags = ["Fixture"];
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
    for(var index = 0; index < addresses.length; index++) {
        const address = addresses[index];
        const bashBalance = (await bash.balanceOf(address)).toGweiComma();
        const daiBalance = (await dai.balanceOf(address)).toEtherComma();
        const bashDaiBalance = (await bashDai.balanceOf(address)).toEtherComma();
        if (index == 0) 
            console.log(`Deployer Balances:`);
        else
            console.log(`Account ${index} ${address} Balances: `);

        displayBalances(bashBalance, daiBalance, bashDaiBalance);
    };
}

function displayBalances(bashBalance: string, daiBalance: string, bashDaiBalance: string) {
    console.log(`\tBASH: ${bashBalance}`);
    console.log(`\tDAI: ${daiBalance}`);
    console.log(`\tBASH-DAI: ${bashDaiBalance}`);
}

