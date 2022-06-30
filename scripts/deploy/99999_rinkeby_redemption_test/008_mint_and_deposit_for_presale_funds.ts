import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { BASH_STARTING_MARKET_VALUE_IN_DAI, CONTRACTS, INITIAL_BASH_LIQUIDITY_IN_DAI, INITIAL_DAI_RESERVES_AMOUNT } from '../../constants';

import { BashTreasury__factory, DAI__factory, BASHERC20Token__factory, ABASHERC20__factory } from '../../../types';
import { waitFor } from '../../txHelper';
import { BigNumber } from 'ethers';
import { parseEther, parseUnits } from 'ethers/lib/utils';
import '../../string-extensions';
import '../../ethers-extensions';
import { liveNetworkConfirm } from '../../confirm';
import { isNotLocalTestingNetwork } from '../../network';


const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
    const treasury = BashTreasury__factory.connect(treasuryDeployment.address, signer);

    const daiDeployment = await deployments.get(CONTRACTS.DAI);
    const dai = DAI__factory.connect(daiDeployment.address, signer);
    
    const bashLiquidityNeededAtMarketLaunchPricing = INITIAL_BASH_LIQUIDITY_IN_DAI / BASH_STARTING_MARKET_VALUE_IN_DAI;
    const bashLiquidityNeededAtMarketLaunchPricingInWei = parseEther(bashLiquidityNeededAtMarketLaunchPricing.toString());
    const initialDaiReserveAmountInWei = parseEther(INITIAL_DAI_RESERVES_AMOUNT.toString());

    // DAI needed for redemption (that get's minted and sent to redemption contract)
    var presaleDeployment = await deployments.get(CONTRACTS.atbashPresale);
    var abashDeployment = await deployments.get(CONTRACTS.aBash);
    var abash = await ABASHERC20__factory.connect(abashDeployment.address, signer);
    
    // totalSupply - presale
    var amountForRedeemInWei = (await abash.totalSupply()).sub(await abash.balanceOf(presaleDeployment.address));
    console.log(`Bash redemption amount needed: ${amountForRedeemInWei.toEtherComma()}`);
    
    const daiAmount = amountForRedeemInWei; // ading redemption

    const bashProfitInGwei = BigNumber.from("0"); // zero to treasury all to deployer //parseUnits("0", "gwei"); // bash decimals
    console.log(`Check: treasury deposit:  DAI: ${daiAmount.toEtherComma()}, bashProfit (to treasury): ${bashProfitInGwei.toGweiComma()}`);
    await liveNetworkConfirm(hre.network, `Are you sure you want to deposit ${daiAmount.toEtherComma()} DAI to treasury? `);

    await waitFor(dai.approve(treasury.address, "1000000000000000000000000000000000000000")); // Approve treasury to use the dai
    console.log("DAI Approved to treasury :", daiAmount.toEtherComma());
    await waitFor(treasury.deposit(daiAmount, dai.address, bashProfitInGwei));   // Deposit dai into treasury
    console.log(`DAI deposited in treasury: ${daiAmount.toEtherComma()}`);
    console.log(`DAI deployer balance: ${ (await dai.balanceOf(deployer)).toEtherComma()}`);

    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const bash = BASHERC20Token__factory.connect(bashDeployment.address, signer);
    const bashBalance = await bash.balanceOf(deployer);
    console.log("BASH minted against DAI for deployer wallet: ", bashBalance.toGweiComma())
    return true;
};

func.skip = async (hre: HardhatRuntimeEnvironment) => true;

func.id = "2022-rinkeby-redemption-test-mint-and-deposit-for-presale-funds";
func.dependencies = [CONTRACTS.treasury, CONTRACTS.DAI, CONTRACTS.bash, CONTRACTS.aBash, CONTRACTS.atbashPresale];
func.tags = ["RedemptionTesting"];

export default func;
