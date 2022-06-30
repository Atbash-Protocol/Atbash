import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction, Deployment} from 'hardhat-deploy/types';
import { CONTRACTS } from '../../constants';

import { BASHERC20Token__factory, BashTreasury__factory, UniswapV2Pair__factory } from '../../../types';
import { waitFor } from '../../txHelper';
import { BigNumber, Contract } from 'ethers';
import "../../string-extensions";
import '../../ethers-extensions';

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
    const treasury = BashTreasury__factory.connect(treasuryDeployment.address, signer);

    let bashDaiLpPairDeployment: Deployment;
    try {
        bashDaiLpPairDeployment = await deployments.get(CONTRACTS.bashDaiLpPair);
    }
    catch (e: any) {
        console.error(`BASH-DAI LP deployment not found for network: ${hre.network.name}, Exception: ${e}`);
        throw "BASH-DAI LP deployment not found";
    }

    console.log(`bashDaiLp Address: ${bashDaiLpPairDeployment.address}, num deployments: ${bashDaiLpPairDeployment.numDeployments}`);
    const bashDai = await UniswapV2Pair__factory.connect(bashDaiLpPairDeployment.address, signer);
    const balance = await bashDai.balanceOf(deployer);
    await waitFor(bashDai.approve(treasury.address, balance));
    console.log(`BASH-DAI LP: Token 0: ${await bashDai.token0()}, Token 1: ${await bashDai.token1()}`);
    console.log(`Current deployer BASH-DAI balance: ${balance.toEtherComma()}, address: ${bashDaiLpPairDeployment.address}`);

    const profit = await treasury.tokenValue(bashDaiLpPairDeployment.address, balance.toString());
    console.log(`${balance.toEtherComma()} of BASH-DAI is worth ${profit.toGweiComma()} BASH`);   
    await waitFor(treasury.deposit(balance, bashDaiLpPairDeployment.address, profit));
    console.log(`Deposited ${balance.toEtherComma()} BASH-DAI to treasury`);

    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const bash = await BASHERC20Token__factory.connect(bashDeployment.address, signer);
    console.log(`Deployer BASH balance: ${(await bash.balanceOf(deployer)).toGweiComma()}`);
    return true;
};

func.id = "2022-launch-deposit-bashdai";
func.tags = ["Launch"];
// func.tags = ["BashDaiBondDeposit"];

func.dependencies = [CONTRACTS.treasury, 
                        CONTRACTS.bashDaiBondDepository, 
                        CONTRACTS.bashDaiLpPair];
export default func;
