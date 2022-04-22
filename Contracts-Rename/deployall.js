// @dev. This script will deploy this V1.1 of Olympus. It will deploy the whole ecosystem except for the LP tokens and their bonds. 
// This should be enough of a test environment to learn about and test implementations with the Olympus as of V1.1.
// Not that the every instance of the Treasury's function 'valueOf' has been changed to 'valueOfToken'... 
// This solidity function was conflicting w js object property name

const { ethers } = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();
    MockDAO = {address: "0x31940eE01803476a970ec6DF1094a53F80e6827b"};
    console.log('Deploying contracts with the account: ' + deployer.address);

    // Initial staking index
    const initialIndex = '7675210820';

    // First block epoch occurs
    const firstEpochBlock = '8961000';

    // What epoch will be first epoch
    const firstEpochNumber = '338';

    // How many blocks are in each epoch
    const epochLengthInBlocks = '2200';

    // Initial reward rate for epoch
    const initialRewardRate = '3000';

    // Ethereum 0 address, used when toggling changes in treasury
    const zeroAddress = '0x0000000000000000000000000000000000000000';

    // Large number for approval for Frax and DAI
    const largeApproval = '100000000000000000000000000000000000000000000000';

    // Initial mint for Frax and DAI (10,000,000)
    const initialMint = '100000000000000000000000000000000';

    // DAI bond BCV
    const daiBondBCV = '369';

    // Frax bond BCV
    const fraxBondBCV = '690';

    // Bond vesting length in blocks. 33110 ~ 5 days
    const bondVestingLength = '33110';

    // Min bond price
    const minBondPrice = '50000';

    // Max bond payout
    const maxBondPayout = '50'

    // DAO fee for bond
    const bondFee = '10000';

    // Max debt bond can take on
    const maxBondDebt = '1000000000000000';

    // Initial Bond debt
    const intialBondDebt = '0'

    // Deploy OHM
    const OHM = await ethers.getContractFactory('OlympusERC20Token');
    const ohm = await OHM.deploy();

    // Deploy DAI
    const DAI = await ethers.getContractFactory('DAI');
    const dai = await DAI.deploy( 0 );

    // Deploy Frax
    const Frax = await ethers.getContractFactory('FRAX');
    const frax = await Frax.deploy( 0 );

    // Deploy 10,000,000 mock DAI and mock Frax
    await dai.mint( deployer.address, initialMint );
    await frax.mint( deployer.address, initialMint );

    console.log("// Deploy treasury")
    //@dev changed function in treaury from 'valueOf' to 'valueOfToken'... solidity function was coflicting w js object property name
    const Treasury = await ethers.getContractFactory('MockOlympusTreasury'); 
    const treasury = await Treasury.deploy( ohm.address, dai.address, frax.address, 0 );
    await treasury.deployed()

    console.log("// Deploy bonding calc")
    const OlympusBondingCalculator = await ethers.getContractFactory('OlympusBondingCalculator');
    const olympusBondingCalculator = await OlympusBondingCalculator.deploy( ohm.address );
    await olympusBondingCalculator.deployed()

    console.log("// Deploy staking distributor")
    const Distributor = await ethers.getContractFactory('Distributor');
    const distributor = await Distributor.deploy(treasury.address, ohm.address, epochLengthInBlocks, firstEpochBlock);
    await distributor.deployed()

    console.log("// Deploy sOHM")
    const SOHM = await ethers.getContractFactory('sOlympus');
    const sOHM = await SOHM.deploy();
    await sOHM.deployed()

    console.log("// Deploy Staking")
    const Staking = await ethers.getContractFactory('OlympusStaking');
    const staking = await Staking.deploy( ohm.address, sOHM.address, epochLengthInBlocks, firstEpochNumber, firstEpochBlock );
    await staking.deployed()

    console.log("// Deploy staking warmpup")
    const StakingWarmpup = await ethers.getContractFactory('StakingWarmup');
    const stakingWarmup = await StakingWarmpup.deploy(staking.address, sOHM.address);
    await stakingWarmup.deployed()

    console.log("// Deploy staking helper")
    const StakingHelper = await ethers.getContractFactory('StakingHelper');
    const stakingHelper = await StakingHelper.deploy(staking.address, ohm.address);
    await stakingHelper.deployed()

    console.log("// Deploy DAI bond")
    //@dev changed function call to Treasury of 'valueOf' to 'valueOfToken' in BondDepository due to change in Treausry contract
    const DAIBond = await ethers.getContractFactory('MockOlympusBondDepository');
    const daiBond = await DAIBond.deploy(ohm.address, dai.address, treasury.address, MockDAO.address, zeroAddress);
    await daiBond.deployed()

    console.log("// Deploy Frax bond")
    //@dev changed function call to Treasury of 'valueOf' to 'valueOfToken' in BondDepository due to change in Treausry contract
    const FraxBond = await ethers.getContractFactory('MockOlympusBondDepository');
    const fraxBond = await FraxBond.deploy(ohm.address, frax.address, treasury.address, MockDAO.address, zeroAddress);
    await fraxBond.deployed()

    console.log("// queue and toggle DAI and Frax bond reserve depositor")
    console.log(`queue dai`)
    var tx = await treasury.queue('0', daiBond.address);
    await tx.wait(10)
    console.log(`queue frax`)
    tx = await treasury.queue('0', fraxBond.address);
    await tx.wait(10)

    const delme = await treasury.reserveDepositorQueue(daiBond.address)
    console.log(`AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA ${delme}`)

    console.log(`toggle dai zeroAddress`)
    await treasury.toggle('0', daiBond.address, zeroAddress);       
    console.log(`toggle frax zeroAddress`)
    await treasury.toggle('0', fraxBond.address, zeroAddress);

    console.log("// Set DAI and Frax bond terms")
    await daiBond.initializeBondTerms(daiBondBCV, bondVestingLength, minBondPrice, maxBondPayout, bondFee, maxBondDebt, intialBondDebt);
    await fraxBond.initializeBondTerms(fraxBondBCV, bondVestingLength, minBondPrice, maxBondPayout, bondFee, maxBondDebt, intialBondDebt);

    console.log("// Set staking for DAI and Frax bond")
    await daiBond.setStaking(staking.address, stakingHelper.address);
    await fraxBond.setStaking(staking.address, stakingHelper.address);

    console.log("// Initialize sOHM and set the index")
    await sOHM.initialize(staking.address);
    await sOHM.setIndex(initialIndex);

    console.log("// set distributor contract and warmup contract")
    await staking.setContract('0', distributor.address);
    await staking.setContract('1', stakingWarmup.address);

    console.log("// Set treasury for OHM token")
    await ohm.setVault(treasury.address);

    console.log("// Add staking contract as distributor recipient")
    await distributor.addRecipient(staking.address, initialRewardRate);

    console.log("// queue and toggle reward manager")
    tx = await treasury.queue('8', distributor.address);
    await tx.wait(10)
    await treasury.toggle('8', distributor.address, zeroAddress);

    console.log("// queue and toggle deployer reserve depositor")
    tx = await treasury.queue('0', deployer.address);
    await tx.wait(10)
    await treasury.toggle('0', deployer.address, zeroAddress);

    console.log("// queue and toggle liquidity depositor")
    tx = await treasury.queue('4', deployer.address, );
    await tx.wait(10)
    await treasury.toggle('4', deployer.address, zeroAddress);

    console.log("// Approve the treasury to spend DAI and Frax")
    await dai.approve(treasury.address, largeApproval );
    await frax.approve(treasury.address, largeApproval );

    console.log("// Approve dai and frax bonds to spend deployer's DAI and Frax")
    await dai.approve(daiBond.address, largeApproval );
    await frax.approve(fraxBond.address, largeApproval );

    console.log("// Approve staking and staking helper contact to spend deployer's OHM")
    await ohm.approve(staking.address, largeApproval);
    tx = await ohm.approve(stakingHelper.address, largeApproval);
    await tx.wait(10)

    console.log("// Deposit 9,000,000 DAI to treasury, 600,000 OHM gets minted to deployer and 8,400,000 are in treasury as excesss reserves")
    await treasury.deposit('9000000000000000000000000', dai.address, '8400000000000000');

    console.log("// Deposit 5,000,000 Frax to treasury, all is profit and goes as excess reserves")
    tx = await treasury.deposit('5000000000000000000000000', frax.address, '5000000000000000');
    await tx.wait(10)

    console.log("// Stake OHM through helper")
    await stakingHelper.stake('100000000000');

    console.log("// Bond 1,000 OHM and Frax in each of their bonds")
    await daiBond.deposit('1000000000000000000000', '60000', deployer.address );
    await fraxBond.deposit('1000000000000000000000', '60000', deployer.address );

    console.log( "OHM: " + ohm.address );
    console.log( "DAI: " + dai.address );
    console.log( "Frax: " + frax.address );
    console.log( "Treasury: " + treasury.address );
    console.log( "Calc: " + olympusBondingCalculator.address );
    console.log( "Staking: " + staking.address );
    console.log( "sOHM: " + sOHM.address );
    console.log( "Distributor " + distributor.address);
    console.log( "Staking Warmup " + stakingWarmup.address);
    console.log( "Staking Helper " + stakingHelper.address);
    console.log("DAI Bond: " + daiBond.address);
    console.log("Frax Bond: " + fraxBond.address);
}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
})
