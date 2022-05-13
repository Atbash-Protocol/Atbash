import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS } from '../../constants';

import { BASHERC20Token__factory, BashTreasury__factory, AtbashBondDepository__factory } from '../../../types';
import { waitFor } from '../../txHelper';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const treasuryDeployment = await deployments.get(CONTRACTS.treasury);
    const bashDaiBondingCalculatorDeployment = await deployments.get(CONTRACTS.bashDaiBondingCalculator);
    const bashDaiLpPairDeployment = await deployments.get(CONTRACTS.bashDaiLpPair);

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

    if (!bashDaiBondDeployment.newlyDeployed) return;   // todo: idempotent?

    const bashDaiBondBCV = '120';               // DAI bond BCV         // Halsey: So then the start should be 120
    const bondVestingLength = '864000';     // Bond vesting length seconds
    const minBondPrice = '8000';            // Min bond price
    const maxBondPayout = '4'               // Max bond payout     /
    const bondFee = '0';                    // DAO fee for bond
    const maxBondDebt = '1000000000000000'; // Max debt bond can take on
    const intialBondDebt = '0'              // Initial Bond debt

    const bashDaiBond = AtbashBondDepository__factory.connect(bashDaiBondDeployment.address, signer);
    await waitFor(bashDaiBond.initializeBondTerms(
        bashDaiBondBCV,      // _controlVariable
        minBondPrice,        // _minimumPrice
        maxBondPayout,       // _maxPayout
        bondFee,             // _fee
        maxBondDebt,         // _maxDebt
        intialBondDebt,      // _initialDebt
        bondVestingLength,   // _vestingTerm
    ));

    console.log("Terms for BASH-DAI Bond: ");
    console.log(`
        bashDaiBondBCV    ${bashDaiBondBCV}
        minBondPrice      ${minBondPrice}
        maxBondPayout     ${maxBondPayout}
        bondFee           ${bondFee}
        maxBondDebt       ${maxBondDebt}
        intialBondDebt    ${intialBondDebt}
        bondVestingLength ${bondVestingLength} seconds
    `);

    const stakingHelperDeployment = await deployments.get(CONTRACTS.stakingHelper);
    await waitFor(bashDaiBond.setStaking(stakingHelperDeployment.address, true));
    console.log("Set staking helper for BASH-DAI bond");
};

func.skip = async (hre: HardhatRuntimeEnvironment) => {
    return true;    // skip this patch for rinkeby 
};

func.dependencies = [CONTRACTS.bash, CONTRACTS.treasury, CONTRACTS.stakingHelper, CONTRACTS.bashDaiBondingCalculator, CONTRACTS.bashDaiBondDepository];
func.tags = ["fix-rinkeby-bashdai-deploy"];
export default func;
