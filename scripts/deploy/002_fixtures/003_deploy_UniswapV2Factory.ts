import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { CONTRACTS } from '../../constants';
import { abi, bytecode } from '@uniswap/v2-core/build/UniswapV2Factory.json';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.warn("!!! In rinkeby and mainnet forking - assert not deployed, and the factory is reused from mainnet");
    console.log("Setting up mock UniswapV2Factory used for BASH-DAI LP");
    
    await deploy(CONTRACTS.UniswapV2Factory, {
        from: deployer,
        args: [deployer],
        log: true,
        skipIfAlreadyDeployed: true,
        contract: { 
                abi: abi,
                bytecode: bytecode, // required otherwise hash doesn't match for pairFor()
                deployedBytecode: bytecode
        }
    });
};

func.tags = [CONTRACTS.UniswapV2Factory];
func.dependencies = [CONTRACTS.bash, CONTRACTS.DAI];
export default func;
