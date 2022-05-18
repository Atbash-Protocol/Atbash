import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { CONTRACTS } from '../../constants';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const uniswapV2FactoryDeployment = await deployments.get(CONTRACTS.UniswapV2Factory);
    const wethDeployment = await deployments.get(CONTRACTS.WETH);

    console.warn("!!! In rinkeby and mainnet forking - assert not deployed, and the factory is reused from mainnet");
    console.log("Setting up mock UniswapV2Router used for BASH DAI swaps");
    await deploy(CONTRACTS.UniswapV2Router, {
        from: deployer,
        args: [uniswapV2FactoryDeployment.address, wethDeployment.address],
        log: true,
        skipIfAlreadyDeployed: true,
    });
};

func.tags = [CONTRACTS.UniswapV2Router];
func.dependencies = [CONTRACTS.bash, CONTRACTS.DAI, CONTRACTS.WETH, CONTRACTS.UniswapV2Factory];
export default func;
