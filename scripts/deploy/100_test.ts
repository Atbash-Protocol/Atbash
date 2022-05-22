
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { BASH_STARTING_MARKET_VALUE_IN_DAI, CONTRACTS, INITIAL_BASH_LIQUIDITY_IN_DAI, INITIAL_DAI_RESERVES_AMOUNT } from '../constants';

import { BashTreasury__factory, DAI__factory, BASHERC20Token__factory, UniswapV2Pair__factory } from '../../types';
import { waitFor } from '../txHelper';
import { BigNumber, ethers } from 'ethers';
import { parseEther, parseUnits } from 'ethers/lib/utils';

import '../extensions';
import {mainNetConfirm} from"../confirm";




const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    console.log(`live: ${hre.network.live}, network: ${hre.network.name}`);
    const test = 18;
    var n = parseUnits("12345678", 18);
    n = "12345678".parseUnits(test);
    console.log(`toEther: ${n.toEther()}`);
    console.log(`toEther: ${n.toEtherComma()}`);

    await mainNetConfirm(hre.network, "Are you sure");
    await mainNetConfirm(hre.network, "Are you sure");


    // const answer = await question("Are you sure? (y/N) ")
    // .then(answer => answer.toLowerCase() == 'y')

return;

    // const bashLiquidityNeededAtMarketLaunchPricing = INITIAL_BASH_LIQUIDITY_IN_DAI / BASH_STARTING_MARKET_VALUE_IN_DAI;
    // const bashLiquidityNeededAtMarketLaunchPricingInWei = parseEther(bashLiquidityNeededAtMarketLaunchPricing.toString());
    // const initialDaiReserveAmountInWei = parseEther(INITIAL_DAI_RESERVES_AMOUNT.toString());

    // const daiAmount = initialDaiReserveAmountInWei
    //                     .add(bashLiquidityNeededAtMarketLaunchPricingInWei);

    // // const daiAmount = BigNumber.from(INITIAL_DAI_RESERVES_AMOUNT)
    // //                         .add(bashLiquidityNeededAtMarketLaunchPricing)
    // //                         .mul(BigNumber.from(10).pow(18));

    // //const bashProfit = "10000000000000"       // deposit 10k bash and mint 90k back to depositor
    // // const bashProfit = "312" + "500000000";    // bash used for LP, the rest for treasury 
    // const bashLiquidityNeededAtMarketLaunchPricingInGwei = 
    //                 parseUnits(bashLiquidityNeededAtMarketLaunchPricing.toString(), "gwei");
    // const bashProfit = bashLiquidityNeededAtMarketLaunchPricingInGwei;
    // console.log(`Check: treasury deposit:  DAI: ${daiAmount.toString()}, bashProfit: ${bashProfit}`);

    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const bash = await BASHERC20Token__factory.connect(bashDeployment.address, signer);
    const bashBalance = await bash.balanceOf(deployer);
    console.log(`Bash balance: ${bashBalance}`);

    const daiDeployment = await deployments.get(CONTRACTS.DAI);
    const dai = await DAI__factory.connect(daiDeployment.address, signer);
    console.log(`DAI balance: ${await dai.balanceOf(deployer)}`);
    
    // const bashProfit = BigNumber.from(bashLiquidityNeededAtMarketLaunchPricing)
    //                     .mul(BigNumber.from(10).pow(9));
                        
    console.log("test-100");
};

func.tags = ["test-math"];
export default func;
