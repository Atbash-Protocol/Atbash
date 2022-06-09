import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS, EPOCH_LENGTH_IN_SECONDS, FIRST_EPOCH_NUMBER, FIRST_EPOCH_TIME, getConfig } from '../../constants';
import { INITIAL_INDEX } from '../../constants';

import { BASHERC20Token__factory, SBASH__factory } from '../../../types'
import { waitFor } from '../../txHelper'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const bash = await BASHERC20Token__factory.connect(bashDeployment.address, signer);

    const sBashDeployment = await deployments.get(CONTRACTS.sBash);
    const sbash = await SBASH__factory.connect(sBashDeployment.address, signer);

    const config = getConfig(hre.network.name);
    
    // Staking
    const staking = await deploy(CONTRACTS.staking, {
        from: deployer,
        args: [bash.address, sbash.address, config.EPOCH_LENGTH_IN_SECONDS, config.FIRST_EPOCH_NUMBER, config.FIRST_EPOCH_TIME],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    if (staking.newlyDeployed) {
        console.log(`
            Staking Initialization:
            epochLength      ${config.EPOCH_LENGTH_IN_SECONDS} seconds
            firstEpochNumber ${config.FIRST_EPOCH_NUMBER}
            firstEpochTime   ${config.FIRST_EPOCH_TIME}
        `);
    }

    // Staking Helper
    const stakingHelper = await deploy(CONTRACTS.stakingHelper, {
        from: deployer,
        args: [staking.address, bash.address],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    // Staking Warmup
    const stakingWarmup = await deploy(CONTRACTS.stakingWarmup, {
        from: deployer,
        args: [staking.address, sbash.address],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    // if (!staking.newlyDeployed || !stakingHelper.newlyDeployed || !stakingWarmup.newlyDeployed) 
    // {
    //     console.warn("Some or all of the staking contracts were already deployed for this network, skipping setup");
    //     return;
    // }

    // console.log("Initialize sBASH with staking contract & set initial index");
    // await waitFor(sbash.initialize(staking.address));
    // await waitFor(sbash.setIndex(INITIAL_INDEX));
};

func.dependencies = [CONTRACTS.bash, CONTRACTS.sBash];
func.tags = [CONTRACTS.stakingWarmup, CONTRACTS.staking, CONTRACTS.stakingHelper, "Staking"];
export default func;
