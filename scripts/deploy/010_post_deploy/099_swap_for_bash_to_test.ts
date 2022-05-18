import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { BASH_STARTING_MARKET_VALUE_IN_DAI, CONTRACTS } from '../../constants';

import { DAI__factory, UniswapV2Router02__factory } from '../../../types'
import { getCurrentBlockTime } from '../../../test/utils/blocktime';
import { BigNumber } from 'ethers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = await ethers.provider.getSigner(deployer);

    console.log("Swapping DAI for BASH to test with to deployer...");
    console.warn("!!! In rinkeby and mainnet forking - assert not deployed, and the factory is reused from mainnet");

    const daiDeployment = await deployments.get(CONTRACTS.DAI);
    const bashDeployment = await deployments.get(CONTRACTS.bash);    
    const uniswapRouterDeployment = await deployments.get(CONTRACTS.UniswapV2Router);

    const uniswapRouter = await UniswapV2Router02__factory.connect(uniswapRouterDeployment.address, signer);

    var bashWanted = BigNumber.from(10);
    var daiMax = bashWanted.mul(BASH_STARTING_MARKET_VALUE_IN_DAI).add(100);  // rough estimate, more accurate would be using pair to get marketvalue
    
    bashWanted = bashWanted.mul(BigNumber.from(10).pow(9));
    daiMax = daiMax.mul(BigNumber.from(10).pow(18));

    // const bashWanted2 = parseUnits("10", 9); // at least 10 bash

    const dai = await DAI__factory.connect(daiDeployment.address, signer);
    // const daiMax2 = parseUnits("1000", 18);   // 10 worth of bash at 1:80
    await dai.approve(uniswapRouterDeployment.address, daiMax);

    const path = [daiDeployment.address, bashDeployment.address];

    const deadline = await getCurrentBlockTime() + 1000;
    await uniswapRouter.swapTokensForExactTokens(bashWanted, daiMax, path, deployer, deadline);
    console.log("Added BASH for deployer");
};

func.skip = async (hre: HardhatRuntimeEnvironment) => {
    const skipping = hre.network.name.toLowerCase() != "hardhat";
    if (skipping) 
        console.warn("Skipping swapping DAI to BASH used for testing for local hardhat network.");
    return skipping;
};

func.tags = ["Fixture"];
func.dependencies = [CONTRACTS.DAI, CONTRACTS.bash, CONTRACTS.UniswapV2Router]
export default func;
