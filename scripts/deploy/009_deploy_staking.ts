import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS, EPOCH_LENGTH_IN_SECONDS, FIRST_EPOCH_NUMBER, FIRST_EPOCH_TIME } from '../constants';
import { INITIAL_INDEX } from '../constants';

import { BASHERC20Token__factory, SBASH__factory } from '../../types'
import { waitFor } from '../txHelper'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const bash = await BASHERC20Token__factory.connect(bashDeployment.address, signer);

    const sBashDeployment = await deployments.get(CONTRACTS.sBash);
    const sbash = await SBASH__factory.connect(sBashDeployment.address, signer);

    // Staking
    const staking = await deploy(CONTRACTS.staking, {
        from: deployer,
        args: [bash.address, sbash.address, EPOCH_LENGTH_IN_SECONDS, FIRST_EPOCH_NUMBER, FIRST_EPOCH_TIME],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    console.log(`
        epochLength      ${EPOCH_LENGTH_IN_SECONDS} seconds
        firstEpochNumber ${FIRST_EPOCH_NUMBER}
        firstEpochTime   ${FIRST_EPOCH_TIME}
    `);

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

    if (!staking.newlyDeployed && !stakingHelper.newlyDeployed && !stakingWarmup.newlyDeployed) return;

    console.log("Initialize sBASH with staking & set index");
    await waitFor(sbash.initialize(staking.address));
    await waitFor(sbash.setIndex(INITIAL_INDEX));
};

func.dependencies = [CONTRACTS.bash, CONTRACTS.sBash, "Token"];
func.tags = [CONTRACTS.stakingWarmup, "Staking"];
export default func;
