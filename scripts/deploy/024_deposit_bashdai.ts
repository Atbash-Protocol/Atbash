import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS } from '../constants';

import { BashTreasury__factory, UniswapV2Pair__factory } from '../../types';
import { waitFor } from '../txHelper';
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
    const balance = await bashDai.balanceOf(deployer);
    await bashDai.approve(treasury.address, balance);
    console.log(`Token 0: ${await bashDai.token0()}, token 1: ${await bashDai.token1()}`);

    console.log(`Current deployer BASH-DAI balance: ${balance}, address: ${bashDaiLpPairDeployment.address}`);
    const profit = 0;    
    await waitFor(treasury.deposit(balance, bashDaiLpPairDeployment.address, profit));
    console.log(`Deposited ${balance} BASH-DAI to treasury`);
};

func.tags = ["bash-dai-bond", "deposit-bashdai"];
func.dependencies = [CONTRACTS.treasury, CONTRACTS.bashDaiBondingCalculator, CONTRACTS.bashDaiBondDepository, CONTRACTS.bashDaiLpPair];
export default func;
