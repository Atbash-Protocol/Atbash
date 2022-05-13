import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS, ZERO_ADDRESS } from '../../constants';

import { BASHERC20Token__factory, DAI__factory, BashTreasury__factory, AtbashBondDepository__factory, StakingHelper__factory } from '../../../types';
import { waitFor } from '../../txHelper';
import { Guid } from 'guid-typescript';

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
    
    console.log("Setting up DAI Stable Bond");

    // todo: get dai bond
    var daiBondDeployment = await deployments.get(CONTRACTS.bondDepository);
    
    const daiBondBCV = '120';               // DAI bond BCV         // Halsey: So then the start should be 120
    const bondVestingLength = '864000';     // Bond vesting length seconds
    const minBondPrice = '8000';            // Min bond price (cents)
    const maxBondPayout = '4'               // Max bond payout     /
    const bondFee = '0';                    // DAO fee for bond
    const maxBondDebt = '1000000000000000'; // Max debt bond can take on
    const intialBondDebt = '0'              // Initial Bond debt

    const daiBond = AtbashBondDepository__factory.connect(daiBondDeployment.address, signer);
    await waitFor(daiBond.initializeBondTerms(
        daiBondBCV,          // _controlVariable
        minBondPrice,        // _minimumPrice
        maxBondPayout,       // _maxPayout
        bondFee,             // _fee
        maxBondDebt,         // _maxDebt
        intialBondDebt,      // _initialDebt
        bondVestingLength,   // _vestingTerm
    ));

    console.log("Initialize for dai BOND: ");
    console.log(`
        daiBondBCV        ${daiBondBCV}
        minBondPrice      ${minBondPrice}
        maxBondPayout     ${maxBondPayout}
        bondFee           ${bondFee}
        maxBondDebt       ${maxBondDebt}
        intialBondDebt    ${intialBondDebt}
        bondVestingLength ${bondVestingLength} seconds
    `);

    const stakingHelperDeployment = await deployments.get(CONTRACTS.stakingHelper);
    const stakingHelper = StakingHelper__factory.connect(stakingHelperDeployment.address, signer);
    await waitFor(daiBond.setStaking(stakingHelper.address, true));
    console.log("Set staking helper for DAI bond");
    console.log("Stable bond setup complete");
    return true; // don't run again
};

func.id = "2022-launch-dai-bond";
func.dependencies = [CONTRACTS.bash, 
                    CONTRACTS.DAI, 
                    CONTRACTS.treasury, 
                    CONTRACTS.stakingHelper,
                    CONTRACTS.bondDepository];
func.tags = ["Launch"];

export default func;
