import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { BASH_STARTING_MARKET_VALUE_IN_DAI, CONTRACTS, INITIAL_BASH_LIQUIDITY_IN_DAI, INITIAL_DAI_RESERVES_AMOUNT } from '../../constants';

import { BashTreasury__factory, DAI__factory, BASHERC20Token__factory } from '../../../types';
import { waitFor } from '../../txHelper';
import { BigNumber } from 'ethers';
import { parseEther, parseUnits } from 'ethers/lib/utils';

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
    const treasury = BashTreasury__factory.connect(treasuryDeployment.address, signer);

    const daiDeployment = await deployments.get(CONTRACTS.DAI);
    const dai = DAI__factory.connect(daiDeployment.address, signer);

    // todo: make idempotent?
    
    // const daiAmmount = "100000000000000000000000"    // 100k dai 100000e18
    //const daiAmmount = "5312" + "500000000000000000";   // halsey: toal 5,312.5 (5k initial + 312.5 for BASH-DAI LP)
    const bashLiquidityNeededAtMarketLaunchPricing = INITIAL_BASH_LIQUIDITY_IN_DAI / BASH_STARTING_MARKET_VALUE_IN_DAI;
    const bashLiquidityNeededAtMarketLaunchPricingInWei = parseEther(bashLiquidityNeededAtMarketLaunchPricing.toString());
    const initialDaiReserveAmountInWei = parseEther(INITIAL_DAI_RESERVES_AMOUNT.toString());

    const daiAmount = initialDaiReserveAmountInWei
                        .add(bashLiquidityNeededAtMarketLaunchPricingInWei); // in DAI decimals

    //const bashProfit = "10000000000000"       // deposit 10k bash and mint 90k back to depositor
    // const bashProfit = "312" + "500000000";    // bash used for LP, the rest for treasury 
    // const bashLiquidityNeededAtMarketLaunchPricingInGwei = 
    //                 parseUnits(bashLiquidityNeededAtMarketLaunchPricing.toString(), "gwei");

    const bashProfitInGwei = parseUnits(INITIAL_DAI_RESERVES_AMOUNT.toString(), "gwei"); // bash decimals
    console.log(`Check: treasury deposit:  DAI: ${daiAmount.toString()}, bashProfit: ${bashProfitInGwei}`);

    await waitFor(dai.approve(treasury.address, "1000000000000000000000000000000000000000")); // Approve treasury to use the dai
    console.log("DAI Approved to treasury :", daiAmount);
    await waitFor(treasury.deposit(daiAmount, dai.address, bashProfitInGwei));   // Deposit dai into treasury
    console.log("DAI deposited in treasury: ", daiAmount);

    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const bash = BASHERC20Token__factory.connect(bashDeployment.address, signer);
    const blkdMintedAgainstDai = await bash.balanceOf(deployer);
    console.log("BASH minted against DAI: ", blkdMintedAgainstDai.toString())
    return true;
};

func.id = "2022-launch-mint-bash";
func.dependencies = [CONTRACTS.treasury, CONTRACTS.DAI, CONTRACTS.BASH];
// func.tags = ["TreasuryDaiDeposit"];
func.tags = ["Launch"];

export default func;
