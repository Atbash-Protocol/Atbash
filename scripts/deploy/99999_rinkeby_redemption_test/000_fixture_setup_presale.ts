import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { CONTRACTS } from '../../constants';

import { ABASHERC20__factory, Presale__factory } from '../../../types'
import { isNotLocalTestingNetwork } from '../../network';
import { waitFor } from '../../txHelper';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;

    const { deploy } = deployments;
    const { deployer, testWallet } = await getNamedAccounts();
    const deployerSigner = await ethers.provider.getSigner(deployer);
    const testWalletSigner = await ethers.provider.getSigner(testWallet);

    const abashDeployment = await deployments.get(CONTRACTS.aBash);
    const abash = await ABASHERC20__factory.connect(abashDeployment.address, deployerSigner);
    const presaleDeployment = await deployments.get(CONTRACTS.atbashPresale);
    const presale = await Presale__factory.connect(presaleDeployment.address, deployerSigner);
    
    console.log("Overriding presale for testing purposes...");
    const originalPresaleRate = await presale.rate();
    await waitFor(presale.setRate(80*4));

    await waitFor(deployerSigner.sendTransaction({ 
        to: presaleDeployment.address,
        value: ethers.utils.parseEther("0.5")
    }));
    // await testWalletSigner.sendTransaction({
    //     to: presaleDeployment.address,
    //     value: ethers.utils.parseEther("0.5")
    // });

    console.log(`Transfered ${(await abash.balanceOf(deployer)).toEtherComma()} aBash to deployer`);
    console.log(`Transfered ${(await abash.balanceOf(testWallet)).toEtherComma()} aBash to testWallet`);

    await waitFor(presale.setRate(originalPresaleRate));
    console.log(`Restored presale rate to ${originalPresaleRate}`);
    return true;
};

// only deploy to hardhat local
func.skip = async (hre: HardhatRuntimeEnvironment) => true;

func.id = "2022-rinkeby-redemption-test-fixture-setup-presale";
func.tags = ["RedemptionTesting"];
func.dependencies = [CONTRACTS.Presale, CONTRACTS.aBash]
export default func;
