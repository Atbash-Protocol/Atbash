import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS, TREASURY_TIMELOCK } from '../../constants';

import { BASHERC20Token__factory, DAI__factory } from '../../../types'
import { waitFor } from '../../txHelper'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const bashDeployment = await deployments.get(CONTRACTS.bash);

    const daiDeployment = await deployments.get(CONTRACTS.DAI);

    const treasury = await deploy(CONTRACTS.treasury, {
        from: deployer,
        args: [bashDeployment.address, daiDeployment.address, TREASURY_TIMELOCK],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    // if (!treasury.newlyDeployed) return;
    
    // const bash = await BASHERC20Token__factory.connect(bashDeployment.address, signer);

    // console.log("Setting BASH vault to treasury");
    // await waitFor(bash.setVault(treasury.address));
};

func.dependencies = [CONTRACTS.bash, CONTRACTS.DAI];
func.tags = [CONTRACTS.treasury, "Treasury"];
export default func;

