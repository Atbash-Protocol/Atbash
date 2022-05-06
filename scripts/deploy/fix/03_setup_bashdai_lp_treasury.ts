import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
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
    const bashDaiBondingCalculatorDeployment = await deployments.get(CONTRACTS.bashDaiBondingCalculator);

    // Liquidity Manager is deployer
    if (!await treasury.isLiquidityManager(deployer)) {
        await waitFor(treasury.queue(MANAGING.LIQUIDITYMANAGER, deployer));
        await waitFor(treasury.toggle(MANAGING.LIQUIDITYMANAGER, deployer, ZERO_ADDRESS)); 
        console.log("deployer enabled as liquidity manager");
    }

    const bashDaiLpPairDeployment = await deployments.get(CONTRACTS.bashDaiLpPair);
    if (await treasury.isLiquidityToken(bashDaiLpPairDeployment.address)) {
        // If already liquidity token, remove, and re-add so the bonding calculator can be set        
        console.log("Resetting bashDai as liquidty token for treasury...");
        await waitFor(treasury.queue(MANAGING.LIQUIDITYTOKEN, bashDaiLpPairDeployment.address));
        await waitFor(treasury.toggle(MANAGING.LIQUIDITYTOKEN, bashDaiLpPairDeployment.address, bashDaiBondingCalculatorDeployment.address));
    }
    await waitFor(treasury.queue(MANAGING.LIQUIDITYTOKEN, bashDaiLpPairDeployment.address));
    await waitFor(treasury.toggle(MANAGING.LIQUIDITYTOKEN, bashDaiLpPairDeployment.address, bashDaiBondingCalculatorDeployment.address));
    console.log(`bashDai enabled as liquidity token with bashDaiBondingCalculator ${bashDaiBondingCalculatorDeployment.address}`);
    
    // BashDaiBond is a depositor
    const bashDaiBondDepositoryDeployment = await deployments.get(CONTRACTS.bashDaiBondDepository);
    console.log(`Setting bashDaiDepository at address ${bashDaiBondDepositoryDeployment.address} as liquidity depositor`);
    if (!await treasury.isLiquidityDepositor(bashDaiBondDepositoryDeployment.address)) {
        await waitFor(treasury.queue(MANAGING.LIQUIDITYDEPOSITOR, bashDaiBondDepositoryDeployment.address));
        await waitFor(treasury.toggle(MANAGING.LIQUIDITYDEPOSITOR, bashDaiBondDepositoryDeployment.address, ZERO_ADDRESS));
        console.log(`bashDaiBondDepository (${bashDaiBondDepositoryDeployment.address}) enabled as liquidity depositor`);
    }

    // Allow deployer as depositor of LP
    if (!await treasury.isLiquidityDepositor(deployer)) { 
        await waitFor(treasury.queue(MANAGING.LIQUIDITYDEPOSITOR, deployer));
        await waitFor(treasury.toggle(MANAGING.LIQUIDITYDEPOSITOR, deployer, ZERO_ADDRESS));
        console.log("deployer enabled as liquidity depositor");
    }

    console.log("Treasury setup completed for BASH-DAI");
};

func.tags = ["fix-rinkeby-bashdai-treasury-setup", "setup-treasury-for-bashdai"];
func.dependencies = [CONTRACTS.treasury, CONTRACTS.bashDaiBondingCalculator, CONTRACTS.bashDaiBondDepository, CONTRACTS.bashDaiLpPair];
export default func;
