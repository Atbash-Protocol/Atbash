import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS } from '../../constants';


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const aBASHDeployment = await deploy(CONTRACTS.aBash, {
        from: deployer,
        args: [ethers.utils.parseUnits("100000", 18)],   
        log: true,
        skipIfAlreadyDeployed: true,
    });
};

func.tags = [CONTRACTS.aBash, "Token"];
export default func;
