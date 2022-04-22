
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS } from '../constants';

import { BashTreasury__factory, DAI__factory, BASHERC20Token__factory, UniswapV2Pair__factory } from '../../types';
import { waitFor } from '../txHelper';

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    console.log("test");

    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const bash = BASHERC20Token__factory.connect(bashDeployment.address, signer);

    const daiDeployment = await deployments.get(CONTRACTS.DAI);
    const dai = DAI__factory.connect(daiDeployment.address, signer);

    // const uniswapV2FactoryDeployment = await deploy("UniswapV2Factory", {
    //     from: deployer,
    //     args: [deployer],
    //     log: true,
    //     skipIfAlreadyDeployed: true,
    // });

    // const uniswapV2Factor = UniswapV2Factory__factory.connect(uniswapV2FactoryDeployment.address, signer);
    // const bashDaiAddress = await uniswapV2Factor.callStatic.createPair(bash.address, dai.address);

    const bashDaiArtifact = await deployments.get(CONTRACTS.bashDaiLpPair);
    console.log(`BashDaiLP Address: ${bashDaiArtifact.address}`);
    // await deployments.save(CONTRACTS.bashDaiLpPair, {
    //     address: bashDaiAddress,
    //     abi: bashDaiArtifact.abi,
    //     bytecode: bashDaiArtifact.deployedBytecode,
    // });
    const bashDai = UniswapV2Pair__factory.connect(bashDaiArtifact.address, signer);
    // const bashDaiContract = await ethers.getContractFactory("UniswapV2Pair");

    // const bashDai = await bashDaiContract.attach(bashDaiAddress);
    console.log("BASH-DAI contract");
    const balance = await bashDai.balanceOf(deployer);
    console.log(`BASH-DAI balanceOf: ${balance}`);

    console.log(`Token 0: ${await bashDai.token0()}`);
    console.log(`Token 1: ${await bashDai.token1()}`);
};

func.tags = ["testa"];
func.dependencies = [CONTRACTS.DAI, CONTRACTS.BASH];
export default func;
