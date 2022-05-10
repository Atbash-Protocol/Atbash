import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { CONTRACTS } from '../constants';

import { BASHERC20Token__factory, DAI__factory, UniswapV2Factory__factory, UniswapV2Pair__factory } from '../../types'
import { BigNumber, providers } from 'ethers';

import { waitFor } from '../txHelper';
import { getAddress, getContractAddress, isAddress } from 'ethers/lib/utils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);


    const bashDaiDeployment = await deployments.getOrNull(CONTRACTS.bashDaiLpPair);
    if (bashDaiDeployment) return;

    console.log("Setting up new BASH-DAI LP");
    const uniswapV2FactoryDeployment = await deploy("UniswapV2Factory", {
        from: deployer,
        args: [deployer],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    if (!uniswapV2FactoryDeployment.newlyDeployed) return;

    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const bash = BASHERC20Token__factory.connect(bashDeployment.address, signer);

    const daiDeployment = await deployments.get(CONTRACTS.DAI);
    const dai = DAI__factory.connect(daiDeployment.address, signer);

    const uniswapV2Factory = UniswapV2Factory__factory.connect(uniswapV2FactoryDeployment.address, signer);
    await waitFor(uniswapV2Factory.createPair(bash.address, dai.address));
    const bashDaiAddress = await uniswapV2Factory.getPair(bash.address, dai.address);
    console.log(`BASH-DAI LP Address: ${bashDaiAddress}`);

    const bashDaiArtifact = await deployments.getExtendedArtifact("UniswapV2Pair");
    await deployments.save(CONTRACTS.bashDaiLpPair, {
        address: bashDaiAddress,
        abi: bashDaiArtifact.abi,
        bytecode: bashDaiArtifact.bytecode,
    });

    const bashDai = UniswapV2Pair__factory.connect(bashDaiAddress, signer);
    console.log("BASH-DAI contract");
    console.log(`Token 0: ${await bashDai.token0()}`);
    console.log(`Token 1: ${await bashDai.token1()}`);

    const daiAmount = BigNumber.from("100000" + "000000000000000000");
    await dai.approve(deployer, daiAmount);
    await dai.transferFrom(deployer, bashDai.address, daiAmount); 
    const bashAmount = BigNumber.from("1250" + "000000000");
    await bash.approve(deployer, bashAmount);
    await bash.transferFrom(deployer, bashDai.address, bashAmount);  

    await bashDai.mint(deployer);

    const balance = await bashDai.balanceOf(deployer);
    console.log(`BASH-DAI balanceOf: ${balance}`);

    console.log("BASH-DAI Pair setup");
};

func.tags = ["test-setup-bashdai", CONTRACTS.bashDaiLpPair];
func.dependencies = [CONTRACTS.bash, CONTRACTS.DAI];
export default func;
