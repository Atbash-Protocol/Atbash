import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS } from '../constants';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const bashDaiLpPairDeployment = await deployments.get(CONTRACTS.bashDaiLpPair);
    
    await deploy(CONTRACTS.bashDaiBondingCalculator, {
        contract: CONTRACTS.bondingCalculator, // reuse existing contract but instantiate with new name
        from: deployer,
        args: [bashDaiLpPairDeployment.address],
        log: true,
        skipIfAlreadyDeployed: true,
    });
};

func.dependencies = [];
func.tags = [CONTRACTS.bashDaiBondingCalculator, "BashDaiBond", CONTRACTS.bashDaiLpPair];
export default func;
