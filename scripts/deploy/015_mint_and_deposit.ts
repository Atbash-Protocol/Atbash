import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS } from '../constants';

import { BashTreasury__factory, DAI__factory, BASHERC20Token__factory } from '../../types';
import { waitFor } from '../txHelper';

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
    const treasury = BashTreasury__factory.connect(treasuryDeployment.address, signer);

    const daiDeployment = await deployments.get(CONTRACTS.DAI);
    const dai = DAI__factory.connect(daiDeployment.address, signer);

    // todo: make idempotent?
    
    const daiAmmount = "100000000000000000000000"   // 100k dai 100000e18
    const bashProfit = "10000000000000"              // deposit 10k bash and mint 90k back to depositor
    await waitFor(dai.approve(treasury.address, "1000000000000000000000000000000000000000")); // Approve treasury to use the dai
    console.log("DAI Approved to treasury :", daiAmmount);
    await waitFor(treasury.deposit(daiAmmount, dai.address, bashProfit)); // Deposit dai into treasury
    console.log("DAI deposited in treasury: ", daiAmmount);

    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const bash = BASHERC20Token__factory.connect(bashDeployment.address, signer);
    const blkdMintedAgainstDai = await bash.balanceOf(deployer);
    console.log("BASH minted against DAI: ", blkdMintedAgainstDai.toString())
};

func.dependencies = ["Tokens", "Staking", "Bonds", CONTRACTS.treasury, CONTRACTS.DAI, CONTRACTS.BASH];
func.tags = ["minting"];
export default func;
