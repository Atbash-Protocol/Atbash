import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction, Deployment} from 'hardhat-deploy/types';
import { CONTRACTS, MANAGING, ZERO_ADDRESS } from '../../constants';
import { BashTreasury__factory } from '../../../types';
import { waitFor } from '../../txHelper';

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
    const treasury = BashTreasury__factory.connect(treasuryDeployment.address, signer);
    const bondingCalculatorDeployment = await deployments.get(CONTRACTS.bondingCalculator);

    // Liquidity Manager is deployer
    if (!await treasury.isLiquidityManager(deployer)) {
        await waitFor(treasury.queue(MANAGING.LIQUIDITYMANAGER, deployer));
        await waitFor(treasury.toggle(MANAGING.LIQUIDITYMANAGER, deployer, ZERO_ADDRESS)); 
        console.log("deployer enabled as liquidity manager");
    }

    let bashDaiLpPairDeployment: Deployment;
    try {
        bashDaiLpPairDeployment = await deployments.get(CONTRACTS.bashDaiLpPair);
    }
    catch (e: any) {
        console.error(`BASH-DAI LP deployment not found for network: ${hre.network.name}, Exception: ${e}`);
        throw "BASH-DAI LP deployment not found";
    }

    if (!await treasury.isLiquidityToken(bashDaiLpPairDeployment.address)) {
        await waitFor(treasury.queue(MANAGING.LIQUIDITYTOKEN, bashDaiLpPairDeployment.address));
        await waitFor(treasury.toggle(MANAGING.LIQUIDITYTOKEN, bashDaiLpPairDeployment.address, bondingCalculatorDeployment.address));
        console.log(`bashDai enabled as liquidity token with bondingCalculator ${bondingCalculatorDeployment.address}`);
    }
    
    // BashDaiBond is a depositor
    const bashDaiBondDepositoryDeployment = await deployments.get(CONTRACTS.bashDaiBondDepository);
    if (!await treasury.isLiquidityDepositor(bashDaiBondDepositoryDeployment.address)) {
        await waitFor(treasury.queue(MANAGING.LIQUIDITYDEPOSITOR, bashDaiBondDepositoryDeployment.address));
        await waitFor(treasury.toggle(MANAGING.LIQUIDITYDEPOSITOR, bashDaiBondDepositoryDeployment.address, ZERO_ADDRESS));
        console.log("bashDaiBondDepository enabled as liquidity depositor");
    }

    // Allow deployer as depositor of LP
    if (!await treasury.isLiquidityDepositor(deployer)) { 
        await waitFor(treasury.queue(MANAGING.LIQUIDITYDEPOSITOR, deployer));
        await waitFor(treasury.toggle(MANAGING.LIQUIDITYDEPOSITOR, deployer, ZERO_ADDRESS));
        console.log("deployer enabled as liquidity depositor");
    }

    console.log("Treasury setup completed for BASH-DAI");
    return true;
    
    // reward minting is only needed for BASH
    // const distributorDeployment = await deployments.get(CONTRACTS.stakingDistributor);
    // await waitFor(treasury.queue(MANAGING.REWARDMANAGER, distributorDeployment.address));
    // await waitFor(treasury.toggle(MANAGING.REWARDMANAGER, distributorDeployment.address, ZERO_ADDRESS));

    // const bashDaiLpPairDeployment = await deployments.get(CONTRACTS.bashDaiLpPair);
    // const bashDai = new Contract(BASHDAI_LP_TOKEN_ADDRESS, bashDaiLpPairDeployment.abi, ethers.provider);
    // const balance = await bashDai.balanceOf(deployer);
    // console.log(`Current deployer BASH-DAI balance: ${balance}`);
    // const profit = 0;    
    // await waitFor(treasury.deposit(balance, BASHDAI_LP_TOKEN_ADDRESS, profit));
    // console.log(`Deposited ${balance} BASH-DAI to treasury`);
};

func.id = "2022-launch-treasury-for-bashdai";
func.tags = ["Launch"];
func.dependencies = [CONTRACTS.treasury, 
                        CONTRACTS.bondingCalculator, 
                        CONTRACTS.bashDaiBondDepository, 
                        CONTRACTS.bashDaiLpPair];
export default func;
