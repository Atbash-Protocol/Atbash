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

    const aBashDeployment = await deployments.get(CONTRACTS.aBash);

    const presaleContract = Presale__factory.connect(presaleDeployment.address, signer);
    await presaleContract.setPresaleToken(aBashDeployment.address);
    await presaleContract.setRate(50);  
};

func.tags = ["Presale"];
func.dependencies = [CONTRACTS.aBash];
export default func;
