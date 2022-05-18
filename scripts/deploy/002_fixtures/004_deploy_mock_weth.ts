import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS } from '../../constants';

import { DAI__factory, MockERC20__factory } from '../../../types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = await ethers.provider.getSigner(deployer);

    console.warn("!!! In rinkeby and mainnet forking - assert not deployed, and the factory is reused from mainnet");
    const result = await deploy(CONTRACTS.WETH, {
        contract: CONTRACTS.MockERC20, // Reuse contract, different deployment name
        from: deployer,
        args: [ "Wrapped ETH", "WETH", "10000000000000000000000000000" ],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    if (!result.newlyDeployed) return;

    const mockWeth = await MockERC20__factory.connect(result.address, signer);
    
    const wethAmount = "150000000000000000000000000000000000000000000";
    await mockWeth.mint(wethAmount);
    console.log(`Minted WETH Amount: ${wethAmount}`);
    await mockWeth.approve(deployer, wethAmount);
};

func.skip = async (hre: HardhatRuntimeEnvironment) => {
    const skipping = hre.network.name.toLowerCase() != "hardhat";
    if (skipping) 
        console.warn("Skipping WETH deployment for non-hardhat networks");
    return skipping;
};

func.tags = [CONTRACTS.WETH, "Token"];
export default func;
