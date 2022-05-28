import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS, STAKING_REWARD_RATE, WARMUP_PERIOD } from '../../constants';

import { Distributor__factory, ATBASHStaking__factory } from '../../../types'
import { waitFor } from '../../txHelper'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const stakingDeployment = await deployments.get(CONTRACTS.staking);
    const staking = ATBASHStaking__factory.connect(stakingDeployment.address, signer);

    const distributorDeployment = await deployments.get(CONTRACTS.stakingDistributor);

    // Staking setup
    const stakingWarmupDeployment = await deployments.get(CONTRACTS.stakingWarmup);
    await waitFor(staking.setContract("1", stakingWarmupDeployment.address));
    console.log("Set staking warmup");

    await waitFor(staking.setContract("0", distributorDeployment.address));
    console.log("Set staking distributor");

    await waitFor(staking.setWarmup(WARMUP_PERIOD));
    console.log(`Warmup Period: ${WARMUP_PERIOD}`);

    return true;
};

func.id = "2022-launch-staking";
func.tags = ["Launch"];

func.dependencies = [CONTRACTS.stakingDistributor, 
                        CONTRACTS.staking, 
                        CONTRACTS.stakingWarmup];
export default func;
