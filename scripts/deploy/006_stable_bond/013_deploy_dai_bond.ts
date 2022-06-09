import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS, ZERO_ADDRESS } from '../../constants';

import { BASHERC20Token__factory, DAI__factory, BashTreasury__factory, AtbashBondDepository__factory, StakingHelper__factory } from '../../../types';
import { waitFor } from '../../txHelper';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const bash = BASHERC20Token__factory.connect(bashDeployment.address, signer);

    const daiDeployment = await deployments.get(CONTRACTS.DAI);
    const dai = DAI__factory.connect(daiDeployment.address, signer);

    const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
    const treasury = BashTreasury__factory.connect(treasuryDeployment.address, signer);

    const daoAddress = deployer;
    console.log(`Using deployer address as DAO Address: DAO Address ${daoAddress}`)
    const daiBondDeployment = await deploy(CONTRACTS.bondDepository, {
        contract: CONTRACTS.bondDepository,
        from: deployer,
        args: [bash.address, dai.address, treasury.address, daoAddress, ZERO_ADDRESS],
        log: true,
        skipIfAlreadyDeployed: true,
    });
};


func.dependencies = [CONTRACTS.bash, CONTRACTS.DAI, CONTRACTS.treasury]; // , CONTRACTS.stakingHelper];
func.tags = ["StableBond", CONTRACTS.bondDepository];
export default func;
