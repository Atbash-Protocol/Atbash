import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS, STAKING_REWARD_RATE } from '../../constants';

import { Distributor__factory } from '../../../types'
import { waitFor } from '../../txHelper'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const stakingDeployment = await deployments.get(CONTRACTS.staking);

    // Distributor staking reward rate
    const distributorDeployment = await deployments.get(CONTRACTS.stakingDistributor);
    const distributor = await Distributor__factory.connect(distributorDeployment.address, signer);
    await waitFor(distributor.addRecipient(stakingDeployment.address, STAKING_REWARD_RATE));
    console.log(`Distributor added staking contract as recipient with reward rate: ${STAKING_REWARD_RATE}`);
    return true;    // don't run again
};

func.id = "2022-launch-init-distributor"
func.dependencies = [CONTRACTS.staking, CONTRACTS.stakingDistributor];
func.tags = ["Launch"];
export default func;

