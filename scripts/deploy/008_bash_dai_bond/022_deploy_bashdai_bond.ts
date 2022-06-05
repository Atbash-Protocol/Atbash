import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction, Deployment} from 'hardhat-deploy/types';
import { CONTRACTS } from '../../constants';


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
    const bashDaiBondingCalculatorDeployment = await deployments.get(CONTRACTS.bashDaiBondingCalculator);

    let bashDaiLpPairDeployment: Deployment;
    try {
        bashDaiLpPairDeployment = await deployments.get(CONTRACTS.bashDaiLpPair);
    }
    catch (e: any) {
        console.error(`BASH-DAI LP deployment not found for network: ${hre.network.name}, Exception: ${e}`);
        throw "BASH-DAI LP deployment not found";
    }

    const daoAddress = deployer;
    console.log(`Using deployer address as DAO Address: DAO Address ${daoAddress}`)
    const bashDaiBondDeployment = await deploy(CONTRACTS.bashDaiBondDepository, {
        contract: CONTRACTS.bondDepository, // reusing existing contract, instantiate with new name
        from: deployer,
        args: [bashDeployment.address, 
                bashDaiLpPairDeployment.address, 
                treasuryDeployment.address,
                daoAddress, 
                bashDaiBondingCalculatorDeployment.address // used for LP Bonds
            ],
        log: true,
        skipIfAlreadyDeployed: true,
    });
};

func.dependencies = [CONTRACTS.bash, 
                    CONTRACTS.treasury, 
                    CONTRACTS.stakingHelper, 
                    CONTRACTS.bashDaiBondingCalculator, 
                    CONTRACTS.bashDaiLpPair];
func.tags = [CONTRACTS.bashDaiBondDepository, "BashDaiBond"];
export default func;
