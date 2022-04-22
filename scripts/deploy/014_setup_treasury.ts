import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS, ZERO_ADDRESS, MANAGING } from '../constants';

import { SBASH__factory, BashTreasury__factory, AtbashBondDepository__factory, Distributor__factory,  } from '../../types'
import { waitFor } from '../txHelper'

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
    const treasury = BashTreasury__factory.connect(treasuryDeployment.address, signer);

    // todo: how to make idempotent

    // Queues
    // Deployer
    await waitFor(treasury.queue(MANAGING.RESERVEDEPOSITOR, deployer)); 
    await waitFor(treasury.queue(MANAGING.RESERVEMANAGER, deployer)); 
    await waitFor(treasury.queue(MANAGING.LIQUIDITYDEPOSITOR, deployer)); 
    await waitFor(treasury.queue(MANAGING.LIQUIDITYMANAGER, deployer)); 
    await waitFor(treasury.queue(MANAGING.DEBTOR, deployer)); 
    await waitFor(treasury.queue(MANAGING.REWARDMANAGER, deployer));    // todo: should this be distributor?

    // DAI Bond
    const daiBondDeployment = await deployments.get(CONTRACTS.bondDepository);
    const daiBond = AtbashBondDepository__factory.connect(daiBondDeployment.address, signer);
    await waitFor(treasury.queue(MANAGING.RESERVEDEPOSITOR, daiBond.address));
    await waitFor(treasury.queue(MANAGING.LIQUIDITYDEPOSITOR, daiBond.address));
    await waitFor(treasury.queue(MANAGING.REWARDMANAGER, daiBond.address));  // todo: should this be distributor?
    //await treasury.queue(0, ethBond.address);
    //await treasury.queue(4, ethBond.address);
    //await treasury.queue(8, ethBond.address);
    
    // todo: rdr- this doesn't make sense, bonding Calculator doesn't deposit to treasury
    // Bonding calculator
    // const bondingCalculatorDeployment = await deployments.get(CONTRACTS.bondingCalculator);
    // const bondingCalculator = ATBASHBondingCalculator__factory.connect(bondingCalculatorDeployment.address, signer);
    // await waitFor(treasury.queue(MANAGING.LIQUIDITYDEPOSITOR, bondingCalculator.address));
    // await waitFor(treasury.queue(MANAGING.REWARDMANAGER, bondingCalculator.address)); // todo: should this be distributor?

    // Distributor
    const distributorDeployment = await deployments.get(CONTRACTS.stakingDistributor);
    const distributor = Distributor__factory.connect(distributorDeployment.address, signer);
    await waitFor(treasury.queue(MANAGING.REWARDMANAGER, distributor.address)); 

    // sBash
    const sbashDeployment = await deployments.get(CONTRACTS.sBash);
    const sbash = SBASH__factory.connect(sbashDeployment.address, signer);
    await waitFor(treasury.queue(MANAGING.SOHM, sbash.address));

    console.log("QUEUES done");

    // Toggles
    // Deployer
    await waitFor(treasury.toggle(MANAGING.RESERVEDEPOSITOR, deployer, ZERO_ADDRESS));
    await waitFor(treasury.toggle(MANAGING.RESERVEMANAGER, deployer, ZERO_ADDRESS));
    await waitFor(treasury.toggle(MANAGING.LIQUIDITYDEPOSITOR, deployer, ZERO_ADDRESS));
    await waitFor(treasury.toggle(MANAGING.LIQUIDITYMANAGER, deployer, ZERO_ADDRESS));
    await waitFor(treasury.toggle(MANAGING.DEBTOR, deployer, ZERO_ADDRESS));
    await waitFor(treasury.toggle(MANAGING.REWARDMANAGER, deployer, ZERO_ADDRESS));

    // DAI Bond
    await waitFor(treasury.toggle(MANAGING.RESERVEDEPOSITOR, daiBond.address, ZERO_ADDRESS));
    await waitFor(treasury.toggle(MANAGING.LIQUIDITYDEPOSITOR, daiBond.address, ZERO_ADDRESS));
    await waitFor(treasury.toggle(MANAGING.REWARDMANAGER, daiBond.address, ZERO_ADDRESS));
    //await treasury.toggle(0, ethBond.address, ZERO_ADDRESS);
    //await treasury.toggle(4, ethBond.address, ZERO_ADDRESS);
    //await treasury.toggle(8, ethBond.address, ZERO_ADDRESS);
    
    // Bonding Calculator
    // todo: rdr- this doesn't make sense, bonding Calculator doesn't deposit to treasury
    // await waitFor(treasury.toggle(MANAGING.LIQUIDITYDEPOSITOR, bondingCalculator.address, ZERO_ADDRESS));
    // await waitFor(treasury.toggle(MANAGING.REWARDMANAGER, bondingCalculator.address, ZERO_ADDRESS));

    // Distributor - Mints Rewards
    await waitFor(treasury.toggle(MANAGING.REWARDMANAGER, distributor.address, ZERO_ADDRESS));

    // sBash
    await waitFor(treasury.toggle(MANAGING.SOHM, sbash.address, ZERO_ADDRESS));

    console.log("ALL TOGGLES DONE");
};

func.dependencies = ["Tokens", "Staking", "Bonds", CONTRACTS.treasury, CONTRACTS.bondDepository, CONTRACTS.stakingDistributor, CONTRACTS.sBash];
export default func;
