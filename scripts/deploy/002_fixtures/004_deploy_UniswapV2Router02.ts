import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { CONTRACTS } from '../../constants';
import { isLocalTestingNetwork, isNotLocalTestingNetwork } from '../../network';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const uniswapV2FactoryDeployment = await deployments.get(CONTRACTS.UniswapV2Factory);
    const wethDeployment = await deployments.get(CONTRACTS.WETH);

    console.log("Setting up mock UniswapV2Router used for BASH DAI swaps");
    // guard
    if (isNotLocalTestingNetwork(hre.network)) {
        console.error("The UniswapV2Router deployment is only used for local hardhat network testing.");
        throw "ERROR: Network configuration error";
    }
    await deploy(CONTRACTS.UniswapV2Router, {
        from: deployer,
        args: [uniswapV2FactoryDeployment.address, wethDeployment.address],
        log: true,
        skipIfAlreadyDeployed: true,
    });
};

// only deploy to hardhat local
func.skip = async (hre: HardhatRuntimeEnvironment) => !isLocalTestingNetwork(hre.network);

func.tags = [CONTRACTS.UniswapV2Router];
func.dependencies = [CONTRACTS.bash, CONTRACTS.DAI, CONTRACTS.WETH, CONTRACTS.UniswapV2Factory];
export default func;
