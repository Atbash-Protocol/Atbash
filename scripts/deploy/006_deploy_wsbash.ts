import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS } from '../constants';
import { SBASH__factory } from '../../types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const sbashDeployment = await deployments.get(CONTRACTS.sBash);
    const sbash = SBASH__factory.connect(sbashDeployment.address, signer);

    await deploy(CONTRACTS.wsBash, {
        from: deployer,
        args: [sbash.address],
        log: true,
        skipIfAlreadyDeployed: true,
    });
};

func.dependencies = [CONTRACTS.sBash];
func.tags = [CONTRACTS.wsBash, "Token"];
export default func;

