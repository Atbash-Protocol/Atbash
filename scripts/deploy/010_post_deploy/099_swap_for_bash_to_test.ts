import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { BASH_STARTING_MARKET_VALUE_IN_DAI, CONTRACTS } from '../../constants';

import { DAI__factory, UniswapV2Router02__factory } from '../../../types'
import { getCurrentBlockTime } from '../../../test/utils/blocktime';
import { BigNumber } from 'ethers';
import { isNotLocalTestingNetwork } from '../../network';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;

    const { deploy } = deployments;
    const { deployer, testWallet } = await getNamedAccounts();
    const signer = await ethers.provider.getSigner(deployer);

    console.log("Swapping DAI for BASH for testing accounts...");
    if (isNotLocalTestingNetwork(hre.network)) {
        console.error("Swapping DAI for BASH is only for local hardhat testing");
        throw "ERROR: Network configuration";
    }
    const daiDeployment = await deployments.get(CONTRACTS.DAI);
    const bashDeployment = await deployments.get(CONTRACTS.bash);    
    const uniswapRouterDeployment = await deployments.get(CONTRACTS.UniswapV2Router);

    const uniswapRouter = await UniswapV2Router02__factory.connect(uniswapRouterDeployment.address, signer);

    var bashWanted = BigNumber.from(10);
    var daiMax = bashWanted.mul(BASH_STARTING_MARKET_VALUE_IN_DAI).add(100);  // rough estimate, more accurate would be using pair to get marketvalue
    
    bashWanted = bashWanted.mul(BigNumber.from(10).pow(9));
    daiMax = daiMax.mul(BigNumber.from(10).pow(18));

    const dai = await DAI__factory.connect(daiDeployment.address, signer);
    await dai.approve(uniswapRouterDeployment.address, daiMax);

    const path = [daiDeployment.address, bashDeployment.address];
    const deadline = await getCurrentBlockTime() + 1000;
    await uniswapRouter.swapTokensForExactTokens(bashWanted, daiMax, path, deployer, deadline);

    await dai.approve(deployer, daiMax);
    await dai.transferFrom(deployer, testWallet, daiMax);
    await dai.approve(uniswapRouterDeployment.address, daiMax);
    await uniswapRouter.swapTokensForExactTokens(bashWanted, daiMax, path, testWallet, deadline);
    console.log("Added BASH for deployer and testWallet");
};

// only deploy to hardhat local
func.skip = async (hre: HardhatRuntimeEnvironment) => isNotLocalTestingNetwork(hre.network);

func.tags = ["Fixture"];
func.dependencies = [CONTRACTS.DAI, CONTRACTS.bash, CONTRACTS.UniswapV2Router]
export default func;
