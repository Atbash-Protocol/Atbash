import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { CONTRACTS, getConfig } from '../../constants';

import { AtbashBondDepository__factory } from '../../../types';
import { waitFor } from '../../txHelper';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    console.log("Setting up BASH-DAI LP Bond");

    var bashDaiBondDeployment = await deployments.get(CONTRACTS.bashDaiBondDepository);
    const config = getConfig(hre.network.name);

    // todo: what are the bashdai terms?
    const bashDaiBondBCV = '120';               // DAI bond BCV         // Halsey: So then the start should be 120
    const bondVestingLength = config.bondVestingLength; // '864000';     // Bond vesting length seconds
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
    return true;
};

func.id = "2022-launch-bashdai-bond";
func.dependencies = [
                    CONTRACTS.bashDaiBondDepository, 
                    CONTRACTS.stakingHelper
                    ];
func.tags = ["Launch"];
export default func;
