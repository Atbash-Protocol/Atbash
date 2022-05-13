import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS } from '../../constants';

import { BashTreasury__factory, UniswapV2Pair__factory } from '../../../types';
import { waitFor } from '../../txHelper';
import { Contract } from 'ethers';

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
    const treasury = BashTreasury__factory.connect(treasuryDeployment.address, signer);

    const bashDaiLpPairDeployment = await deployments.get(CONTRACTS.bashDaiLpPair);
    console.log(`bashDaiLp Address: ${bashDaiLpPairDeployment.address}, num deployments: ${bashDaiLpPairDeployment.numDeployments}`);
    const bashDai = await UniswapV2Pair__factory.connect(bashDaiLpPairDeployment.address, signer);
    
    // Fixing bashdai bond - transfer out LP back to deployer
    console.log("Transfering BASH-DAI out of treasury to redposit");
    const treasuryBashDaiBalance = await bashDai.balanceOf(treasury.address);
    console.log(`Treasury currently holds ${treasuryBashDaiBalance} bash-dai LP`);
    await bashDai.approve(treasury.address, treasuryBashDaiBalance);
    await waitFor(treasury.manage(bashDai.address, treasuryBashDaiBalance));
    
    const deployerBashDaiBalance = await bashDai.balanceOf(deployer);
    console.log(`Current deployer BASH-DAI balance: ${deployerBashDaiBalance}, address: ${bashDaiLpPairDeployment.address}`);
    const profit = 0;    
    await waitFor(treasury.deposit(deployerBashDaiBalance, bashDaiLpPairDeployment.address, profit));
    console.log(`Deposited ${deployerBashDaiBalance} BASH-DAI to treasury`);
};

func.skip = async (hre: HardhatRuntimeEnvironment) => {
    return true;    // skip this patch for rinkeby 
};

func.tags = ["fix-rinkeby-bashdai-deploy-deposit"];
func.dependencies = [CONTRACTS.treasury, CONTRACTS.bashDaiBondingCalculator, CONTRACTS.bashDaiBondDepository, CONTRACTS.bashDaiLpPair];
export default func;
