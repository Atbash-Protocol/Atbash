import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS, EPOCH_LENGTH_IN_SECONDS, getConfig, NEXT_EPOCH_TIME, STAKING_REWARD_RATE } from '../../constants';

import { BASHERC20Token__factory, SBASH__factory, Distributor__factory } from '../../../types'
import { waitFor } from '../../txHelper'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const bash = await BASHERC20Token__factory.connect(bashDeployment.address, signer);

    const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
    const treasury = await SBASH__factory.connect(treasuryDeployment.address, signer);

    const config = getConfig(hre.network.name);
    const distributorDeployment = await deploy(CONTRACTS.stakingDistributor, {
        from: deployer,
        args: [treasury.address, bash.address, config.EPOCH_LENGTH_IN_SECONDS, config.NEXT_EPOCH_TIME],
        log: true,
        skipIfAlreadyDeployed: true,
    });
};

func.dependencies = [CONTRACTS.treasury, CONTRACTS.bash];
func.tags = [CONTRACTS.stakingDistributor, "Staking"];
export default func;
