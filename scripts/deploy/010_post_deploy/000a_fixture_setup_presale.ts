import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { CONTRACTS } from '../../constants';

import { ABASHERC20__factory, Presale__factory } from '../../../types'
import { isNotLocalTestingNetwork } from '../../network';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;

    const { deploy } = deployments;
    const { deployer, testWallet } = await getNamedAccounts();
    const deployerSigner = await ethers.provider.getSigner(deployer);
    const testWalletSigner = await ethers.provider.getSigner(testWallet);

    const abashDeployment = await deployments.get(CONTRACTS.aBash);
    const abash = await ABASHERC20__factory.connect(abashDeployment.address, deployerSigner);
    const presaleDeployment = await deployments.get(CONTRACTS.atbashPresale);
    const presale = await Presale__factory.connect(CONTRACTS.atbashPresale, deployerSigner);
    
    await deployerSigner.sendTransaction({ 
        to: presaleDeployment.address,
        value: ethers.utils.parseEther("20.0")
    });
    await testWalletSigner.sendTransaction({
        to: presaleDeployment.address,
        value: ethers.utils.parseEther("5.0")
    });

    console.log(`Transfered ${(await abash.balanceOf(deployer)).toEtherComma()} aBash to deployer`);
    console.log(`Transfered ${(await abash.balanceOf(testWallet)).toEtherComma()} aBash to testWallet`);
};

// only deploy to hardhat local
func.skip = async (hre: HardhatRuntimeEnvironment) => isNotLocalTestingNetwork(hre.network);
// func.skip = async (hre: HardhatRuntimeEnvironment) => true;
func.tags = ["PostLaunchTesting"];
func.dependencies = [CONTRACTS.Presale, CONTRACTS.aBash]
export default func;
