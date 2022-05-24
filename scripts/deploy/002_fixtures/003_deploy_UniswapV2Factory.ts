import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { CONTRACTS } from '../../constants';
import { abi, bytecode } from '@uniswap/v2-core/build/UniswapV2Factory.json';
import { isLocalTestingNetwork, isNotLocalTestingNetwork } from '../../network';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    
    console.log("Setting up mock UniswapV2Factory used for BASH-DAI LP");
    
    // guard
    if (isNotLocalTestingNetwork(hre.network)) {
        console.error(`This UniswapV2Factory is only used for local hardhat testing`);
        throw "ERROR: Network configuration error";
    }
    
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

// only deploy to hardhat local
func.skip = async (hre: HardhatRuntimeEnvironment) => !isLocalTestingNetwork(hre.network);

func.tags = [CONTRACTS.UniswapV2Factory];
func.dependencies = [CONTRACTS.bash, CONTRACTS.DAI];
export default func;
