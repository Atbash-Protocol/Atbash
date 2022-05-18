import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS } from '../../constants';

import { DAI__factory } from '../../../types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = await ethers.provider.getSigner(deployer);

    const result = await deploy(CONTRACTS.DAI, {
        from: deployer,
        args: [ "dai", "dai", "10000000000000000000000000000" ],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    if (!result.newlyDeployed) return;

    const mockDai = await DAI__factory.connect(result.address, signer);
    
    const daiAmount = "150000000000000000000000000000000000000000000";
    await mockDai.mint(daiAmount);
    console.log(`Minted DAI Amount: ${daiAmount}`);
    await mockDai.approve(deployer, daiAmount);
};

func.skip = async (hre: HardhatRuntimeEnvironment) => {
    const skipping = hre.network.name.toLowerCase() == "mainnet";
    if (skipping) 
        console.warn("Skipping DAI deployment for mainnet");
    return skipping;
};

func.tags = [CONTRACTS.DAI, "Token"];
export default func;
