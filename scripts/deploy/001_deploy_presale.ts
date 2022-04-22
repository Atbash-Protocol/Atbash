import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS } from '../constants';

import { Presale__factory } from '../../types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const presaleDeployment = await deploy(CONTRACTS.atbashPresale, {
        from: deployer,
        args: [deployer],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    const aBASHDeployment = await deploy(CONTRACTS.aBash, {
        from: deployer,
        args: [ethers.utils.parseUnits("100000", 18)],   
        log: true,
        skipIfAlreadyDeployed: true,
    });

    if (!aBASHDeployment.newlyDeployed) return;

    const presaleContract = Presale__factory.connect(presaleDeployment.address, signer);
    await presaleContract.setPresaleToken(aBASHDeployment.address);
    await presaleContract.setRate(50);  
};

func.tags = [CONTRACTS.aBash, "Presale", "Tokens"];
export default func;
