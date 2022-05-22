import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { CONTRACTS } from '../../constants';

import { BASHERC20Token__factory, DAI__factory, UniswapV2Factory__factory } from '../../../types'

import { waitFor } from '../../txHelper';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    console.log("Setting up BASH-DAI LP Pair");

    console.warn("!!! Assert that either 1) re-use existing network LP, or 2) newly created"); 
    const bashDaiDeployment = await deployments.getOrNull(CONTRACTS.bashDaiLpPair);
    if (bashDaiDeployment && bashDaiDeployment.address != '') { 
        console.warn("BASH-DAI already defined in deployment for this network, will use existing pair, and skipping."); 
        return; // no throw - just skip
    } 

    const uniswapV2FactoryDeployment = await deployments.get(CONTRACTS.UniswapV2Factory);
    const uniswapV2Factory = UniswapV2Factory__factory.connect(uniswapV2FactoryDeployment.address, signer);

    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const bash = BASHERC20Token__factory.connect(bashDeployment.address, signer);
    const daiDeployment = await deployments.get(CONTRACTS.DAI);
    const dai = DAI__factory.connect(daiDeployment.address, signer);

    // Double check if the pair already exists before attempting to create
    var bashDaiAddress = await uniswapV2Factory.getPair(bashDeployment.address, daiDeployment.address);
    if (bashDaiAddress != ethers.constants.AddressZero) {
        console.error(`BASH-DAI LP pair already exists, but no saved deployment found. Pair: (${bash.address}, ${dai.address}) was found using Uniswapv2Factory (${uniswapV2FactoryDeployment.address})`);
        console.error(`To fix, update the deployment json with the pair address ${bashDaiAddress} for the network ${hre.network.name}`);
        throw "BASH-DAI LP pair already exists on this network even though no prior deployment was found";
    }

    // Create the pair
    await waitFor(uniswapV2Factory.createPair(bash.address, dai.address));
    bashDaiAddress = await uniswapV2Factory.getPair(bash.address, dai.address);
    console.log(`BASH-DAI LP created at address: ${bashDaiAddress}`);

    // Save this as a deployment for BASH-DAI LP Pair
    const bashDaiArtifact = await deployments.getExtendedArtifact(CONTRACTS.UniswapV2Pair);
    await deployments.save(CONTRACTS.bashDaiLpPair, {
        address: bashDaiAddress,
        abi: bashDaiArtifact.abi,
        bytecode: bashDaiArtifact.bytecode,
    });

    console.log("BASH-DAI Pair created & deployment saved.");
};

func.tags = [CONTRACTS.bashDaiLpPair];
func.dependencies = [CONTRACTS.bash, CONTRACTS.DAI, CONTRACTS.UniswapV2Factory];
export default func;
