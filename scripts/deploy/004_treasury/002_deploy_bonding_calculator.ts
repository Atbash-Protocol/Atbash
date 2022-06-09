import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS } from '../../constants';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const bash = await deployments.get(CONTRACTS.bash);
    
    await deploy(CONTRACTS.bondingCalculator, {
        from: deployer,
        args: [bash.address],
        log: true,
        skipIfAlreadyDeployed: true,
    });
};

func.dependencies = [CONTRACTS.bash];
func.tags = [CONTRACTS.bondingCalculator, "Treasury"];
export default func;
