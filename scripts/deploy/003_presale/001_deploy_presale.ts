import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS } from '../../constants';

import { ABASHERC20__factory, Presale__factory } from '../../../types'

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

    if (!presaleDeployment.newlyDeployed) {
        console.log("Presale already deployed, skipping setup");
        return;
    }

    const aBashDeployment = await deployments.get(CONTRACTS.aBash);
    const presaleContract = Presale__factory.connect(presaleDeployment.address, signer);
    await presaleContract.setPresaleToken(aBashDeployment.address);
    await presaleContract.setRate(50);  

    // fund the presale contract with abash
    const abash = await ABASHERC20__factory.connect(aBashDeployment.address, signer);
    const totalSupply = await abash.totalSupply();
    await abash.transfer(presaleDeployment.address, totalSupply);

    console.log(`Presale contract setup and funding complete`);
};

func.tags = [CONTRACTS.atbashPresale, "Presale"];
func.dependencies = [CONTRACTS.aBash];
export default func;
