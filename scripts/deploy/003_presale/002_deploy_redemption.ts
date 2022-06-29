import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS } from '../../constants';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const abashDeployment = await deployments.get(CONTRACTS.aBash);
    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const presaleDeployment = await deployments.get(CONTRACTS.atbashPresale);
    
    const presaleRedemption = await deploy(CONTRACTS.presaleRedemption,  {
        from: deployer,
        args: [abashDeployment.address, bashDeployment.address, presaleDeployment.address],
        log: true,
        skipIfAlreadyDeployed: true
    });
};

func.tags = [CONTRACTS.presaleRedemption, "PresaleRedemption"];
func.dependencies = [CONTRACTS.aBash, CONTRACTS.atbashPresale, CONTRACTS.bash];
export default func;
