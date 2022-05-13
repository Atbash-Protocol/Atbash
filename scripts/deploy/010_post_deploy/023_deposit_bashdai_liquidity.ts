import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { BASH_STARTING_MARKET_VALUE_IN_DAI, CONTRACTS, INITIAL_BASH_LIQUIDITY_IN_DAI } from '../../constants';

import { BASHERC20Token__factory, DAI__factory, UniswapV2Factory__factory, UniswapV2Pair__factory } from '../../../types'
import { BigNumber, providers } from 'ethers';

import { waitFor } from '../../txHelper';
import { getAddress, getContractAddress, isAddress, parseEther, parseUnits } from 'ethers/lib/utils';

// This fixture can't run until BASH has been minted, that's why it's this late in post deploy
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    console.warn("!!! Assert BASH-DAI LP Pair setup in Fork");
    console.log("Contributing liquidity to mock BASH-DAI LP");

    const uniswapV2FactoryDeployment = await deployments.get(CONTRACTS.UniswapV2Factory);

    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const bash = BASHERC20Token__factory.connect(bashDeployment.address, signer);

    const daiDeployment = await deployments.get(CONTRACTS.DAI);
    const dai = DAI__factory.connect(daiDeployment.address, signer);

    const uniswapV2Factory = await UniswapV2Factory__factory.connect(uniswapV2FactoryDeployment.address, signer);
    const bashDaiAddress = await uniswapV2Factory.getPair(bash.address, dai.address);
    if (bashDaiAddress == ethers.constants.AddressZero) {
        console.error(`No BASH-DAI LP pair (${bash.address}, ${dai.address}) was found using Uniswapv2Factory (${uniswapV2FactoryDeployment.address})`);
        throw "No BASH-DAI LP pair found for this network";
    }

    const bashDai = UniswapV2Pair__factory.connect(bashDaiAddress, signer);
    console.log(`BASH-DAI LP (Token 0: ${await bashDai.token0()}, Token 1: ${await bashDai.token1()}`);

    console.log(`Current bash amount: ${await bash.balanceOf(deployer)}`);
    const bashLiquidityNeededAtMarketLaunchPricing = INITIAL_BASH_LIQUIDITY_IN_DAI / BASH_STARTING_MARKET_VALUE_IN_DAI;
    const bashAmountInGwei = parseUnits(bashLiquidityNeededAtMarketLaunchPricing.toString(), "gwei"); // bash decimals
    
    // const bashAmount =  INITIAL_BASH_LP_AMOUNT; // BigNumber.from("312" + "500000000"); // 312.5 bash
    await bash.approve(deployer, bashAmountInGwei);
    await bash.transferFrom(deployer, bashDai.address, bashAmountInGwei);  
    
    console.log(`Current deployer DAI amount: ${await dai.balanceOf(deployer)}`);
    // const daiAmount = BigNumber.from("100000" + "000000000000000000");
    const bashAmountInWei = parseEther(bashLiquidityNeededAtMarketLaunchPricing.toString());
    const daiAmount = bashAmountInWei.mul(BASH_STARTING_MARKET_VALUE_IN_DAI);
    await dai.approve(deployer, daiAmount);
    await dai.transferFrom(deployer, bashDai.address, daiAmount); 
    console.log(`Check deposit bashdai liquidity: Bash Amount ${bashAmountInGwei}, Dai Amount: ${daiAmount}`);

    await bashDai.mint(deployer);
    const balance = await bashDai.balanceOf(deployer);
    console.log(`BASH-DAI balanceOf: ${balance}`);
    console.log("BASH-DAI Pair setup");
    return true;
};

func.skip = async (hre: HardhatRuntimeEnvironment) => {
    const skipping = hre.network.name.toLowerCase() != "hardhat";
    if (skipping)
        console.warn("Skipping mock BASH-DAI LP deployment for non-hardhat network");
    return skipping;
};

func.id = "2022-launch-bashdai-liquidity";
func.tags = ["Launch"];
// func.tags = [CONTRACTS.bashDaiLpPair];
func.dependencies = [CONTRACTS.bash, CONTRACTS.DAI, CONTRACTS.bashDaiLpPair];
export default func;
