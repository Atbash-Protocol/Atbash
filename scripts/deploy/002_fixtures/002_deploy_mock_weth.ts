import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { CONTRACTS } from '../../constants';

import { MockERC20__factory } from '../../../types'
import { isLocalTestingNetwork, isNotLocalTestingNetwork } from '../../network';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = await ethers.provider.getSigner(deployer);

    if (!isLocalTestingNetwork(hre.network)) {
        console.error("Mock WETH is only for local hardhat network testing.");
        throw "ERROR: Network configuration";
    }

    const result = await deploy(CONTRACTS.WETH, {
        contract: CONTRACTS.MockERC20, // Reuse contract, different deployment name
        from: deployer,
        args: ["Wrapped ETH", "WETH", "10000000000000000000000000000"],
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

// only deploy to hardhat local
func.skip = async (hre: HardhatRuntimeEnvironment) => !isLocalTestingNetwork(hre.network);

func.tags = [CONTRACTS.WETH, "Token"];
export default func;
