import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS, ZERO_ADDRESS, MANAGING } from '../../constants';

import { SBASH__factory, BashTreasury__factory, AtbashBondDepository__factory, Distributor__factory,  } from '../../../types'
import { waitFor } from '../../txHelper'

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
    const treasury = BashTreasury__factory.connect(treasuryDeployment.address, signer);

    console.log("Setting up treasury for deployer management and sbash as a reserve token");
    // Queues
    // Deployer
    await waitFor(treasury.queue(MANAGING.RESERVEDEPOSITOR, deployer)); 
    await waitFor(treasury.queue(MANAGING.RESERVEMANAGER, deployer)); 
    await waitFor(treasury.queue(MANAGING.LIQUIDITYDEPOSITOR, deployer)); 
    await waitFor(treasury.queue(MANAGING.LIQUIDITYMANAGER, deployer)); 
    await waitFor(treasury.queue(MANAGING.DEBTOR, deployer)); 
    await waitFor(treasury.queue(MANAGING.REWARDMANAGER, deployer));    // todo: should this be distributor?

    // sBash
    const sbashDeployment = await deployments.get(CONTRACTS.sBash);
    const sbash = SBASH__factory.connect(sbashDeployment.address, signer);
    await waitFor(treasury.queue(MANAGING.SBASH, sbash.address));

    // Toggles
    // Deployer
    await waitFor(treasury.toggle(MANAGING.RESERVEDEPOSITOR, deployer, ZERO_ADDRESS));
    await waitFor(treasury.toggle(MANAGING.RESERVEMANAGER, deployer, ZERO_ADDRESS));
    await waitFor(treasury.toggle(MANAGING.LIQUIDITYDEPOSITOR, deployer, ZERO_ADDRESS));
    await waitFor(treasury.toggle(MANAGING.LIQUIDITYMANAGER, deployer, ZERO_ADDRESS));
    await waitFor(treasury.toggle(MANAGING.DEBTOR, deployer, ZERO_ADDRESS));
    await waitFor(treasury.toggle(MANAGING.REWARDMANAGER, deployer, ZERO_ADDRESS));

    // sBash
    await waitFor(treasury.toggle(MANAGING.SBASH, sbash.address, ZERO_ADDRESS));

    console.log("Treasury init completed");
    return true;
};

func.id = "2022-launch-treasury";
func.tags = ["Launch"];
func.dependencies = [ 
                    CONTRACTS.treasury, 
                    CONTRACTS.sBash];
export default func;
