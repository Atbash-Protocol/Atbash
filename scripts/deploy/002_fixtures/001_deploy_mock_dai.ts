import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { CONTRACTS } from '../../constants';

import { DAI__factory } from '../../../types'
import { isLiveMainnet, isNotLocalTestingNetwork } from '../../network';
import { BigNumber } from 'ethers';

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
    
    // const daiWanted = "150000000000000000000000000000000000000000000".parseUnits();
    var daiWanted = BigNumber.from("30312" + "500000000000000000"); // todo use calculation
    daiWanted = daiWanted.add("300000" + "000000000000000000"); // spending money for test wallets

    await mockDai.mint(daiWanted);
    console.log(`Minted DAI Amount: ${daiWanted.toEtherComma()}`);
    await mockDai.approve(deployer, daiWanted);
};

// todo: remove
// only deploy to testnets and hardhat
// func.skip = async (hre: HardhatRuntimeEnvironment) => isLiveMainnet(hre.network);

// only for local hardhat testing
func.skip = async (hre: HardhatRuntimeEnvironment) => isNotLocalTestingNetwork(hre.network); 

func.tags = [CONTRACTS.DAI, "Token"];
export default func;

