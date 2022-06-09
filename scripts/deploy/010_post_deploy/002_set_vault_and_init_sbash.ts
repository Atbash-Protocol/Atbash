import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS, INITIAL_INDEX, STAKING_REWARD_RATE, TREASURY_TIMELOCK } from '../../constants';

import { ATBASHStaking__factory, BASHERC20Token__factory, DAI__factory, Distributor__factory, SBASH__factory } from '../../../types'
import { waitFor } from '../../txHelper'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const bashDeployment = await deployments.get(CONTRACTS.bash);

    const daiDeployment = await deployments.get(CONTRACTS.DAI);
    const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
    
    const bash = await BASHERC20Token__factory.connect(bashDeployment.address, signer);

    // Set vault for bash
    
    console.log("Setting BASH vault to treasury");
    await waitFor(bash.setVault(treasuryDeployment.address));

    // Initialize sbash

    const stakingDeployment = await deployments.get(CONTRACTS.staking);
    const staking = await ATBASHStaking__factory.connect(stakingDeployment.address, signer);
    const sBashDeployment = await deployments.get(CONTRACTS.sBash);
    const sBash = await SBASH__factory.connect(sBashDeployment.address, signer);

    console.log("Initialize sBASH with staking contract & set initial index");
    await waitFor(sBash.initialize(staking.address));
    await waitFor(sBash.setIndex(INITIAL_INDEX));

    return true;    // don't run again
};

func.id = "2022-launch-set-vault-and-init-sbash"
func.dependencies = [CONTRACTS.bash, CONTRACTS.DAI, 
                    CONTRACTS.sBash, CONTRACTS.staking
                    ];
func.tags = ["Launch"];
export default func;

