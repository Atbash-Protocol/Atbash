// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import * as dotenv from "dotenv";

// const { ethers } = require("hardhat");
// const hre = require("hardhat");

/*
Dai
Eth
DAI/BASH LP
DAI/ETH LP
*/

dotenv.config();

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account: " + deployer.address);
    console.log("DAI_ADDRESS: %s", process.env.DAI_ADDRESS);
    
    const date = new Date().getTime();
    const timelock = "0";
    const epochLength =  60 * 10; // 28800;  // 28000seconds = 8 hours
    const firstEpochNumber = "0";
    const firstEpochTime = parseInt(JSON.stringify((date / 1000) + epochLength )); // in seconds
    const index = "1000000000"; // ohm "7675210820";// "1";
    var network = await hre.ethers.provider.getNetwork();
    const chainID = network.chainId;

    const warmupPeriod = "0";
    const nextEpochTime = parseInt( JSON.stringify((date / 1000) + epochLength ));
    let principleAddressBond1 = "";
    let principleAddressBond2 = "";
    let principleAddressBond3 = "";
    let principleAddressBond4 = "";
    let principleAddressBond5 = "";
    let daoAddress = deployer.address;
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const WETH = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
    const ETH_USD_Feed = "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e";
    var tx;
    // const MIM = "";
    
    console.log("Using chain ID: ", chainID, " ", network.name);
    // STABLE COINS 
    ////////////////////////////////////////////////////////////////

    //const MIM = await ethers.getContractFactory("DAI");
    //const mim = await MIM.deploy(chainID);
    //await mim.deployed();
    //console.log("MIM: ", mim.address);

    // const MIM = await hre.ethers.getContractFactory("MockERC20");
    const DAI_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"; // local: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
    const dai = await hre.ethers.getContractAt("MockERC20", DAI_ADDRESS);
    // const mim = await MIM.deploy("dai", "dai", "10000000000000000000000000000")
    // await mim.deployed()
    console.log(`dai:  ${dai.address}`)
    // return;
    ////////////////////////////////////////////////////////////////

    const BashContract = await ethers.getContractFactory("BASHERC20Token");
    const bash = await BashContract.deploy();
    await bash.deployed();
    console.log("bash: ", bash.address);

    const sBashContract = await ethers.getContractFactory("sBASH");
    const sBash = await sBashContract.deploy();
    await sBash.deployed();
    console.log("sBash: ", sBash.address);

    const BondingCalculator = await ethers.getContractFactory("ATBASHBondingCalculator");
    const bondingCalculator = await BondingCalculator.deploy(bash.address);
    await bondingCalculator.deployed();
    console.log("bondingCalculator: ", bondingCalculator.address);

    const Treasury = await ethers.getContractFactory("BashTreasury");
    const treasury = await Treasury.deploy(bash.address, dai.address, timelock);
    await treasury.deployed();
    console.log("treasury: ", treasury.address);

    tx = await bash.setVault(treasury.address);
    await tx.wait(1)
    console.log("set vault");

    const Staking = await ethers.getContractFactory("ATBASHStaking");
    const staking = await Staking.deploy(
        bash.address,
        sBash.address,
        epochLength,
        firstEpochNumber,
        firstEpochTime
    );
    await staking.deployed();
    console.log("staking: ", staking.address);
    console.log(`
        epochLength      ${epochLength} seconds
        firstEpochNumber ${firstEpochNumber}
        firstEpochTime   ${firstEpochTime}
    `)

    tx = await sBash.initialize(staking.address);
    await tx.wait(1)
    console.log("initialize sBASH");

    tx = await sBash.setIndex(index);
    await tx.wait(1)

    const Distributor = await ethers.getContractFactory("Distributor");
    const distributor = await Distributor.deploy(
        treasury.address,
        bash.address,
        epochLength,
        nextEpochTime
    );
    await distributor.deployed();
    console.log("distributor: ", distributor.address);

    const StakingHelper = await ethers.getContractFactory("StakingHelper");
    const stakingHelper = await StakingHelper.deploy(
        staking.address,
        bash.address,
    );
    await stakingHelper.deployed();
    console.log("stakingHelper: ", stakingHelper.address);

    const StakingWarmup = await ethers.getContractFactory("StakingWarmup");
    const stakingWarmup = await StakingWarmup.deploy(
        staking.address,
        sBash.address,
    );
    await stakingWarmup.deployed();
    console.log("stakingWarmup: ", stakingWarmup.address);

    tx = await distributor.addRecipient(staking.address, "5000"); // reward rate
    await tx.wait(1)
    console.log("Distributor Add Recipient:", 5000);

    tx = await staking.setContract("1", stakingWarmup.address); // Set Warmup Contract ( Later set up LP Staking too )
    await tx.wait(1)
    console.log("warmup for Staking:", stakingWarmup.address);

    tx = await staking.setContract("0", distributor.address); // Set distributor Contract ( Later set up LP Staking too )
    await tx.wait(1)
    console.log("setDistributor for Staking:", distributor.address);

    tx = await staking.setWarmup(warmupPeriod);
    await tx.wait(1)
    console.log("setWarmup for Staking:", warmupPeriod);

    const WrappedSBash = await ethers.getContractFactory("wsBASH");
    const wsBash = await WrappedSBash.deploy(
      sBash.address
    );
    await wsBash.deployed();
    console.log("wsBash: ", wsBash.address);

    // BONDS
    ////////////////////////////////////////////////////////////////
    // For A Single Bond (bondingCalculator 0 address for non LP bonds)

    // principleAddressBond1 = dai.address;

    const BondDepository = await ethers.getContractFactory("atbashBondDepository"); 
    const daiBond = await BondDepository.deploy(
        bash.address,
        dai.address,
        treasury.address,
        daoAddress,
        zeroAddress,    //zero addr for non LP bond
    );
    await daiBond.deployed();
    console.log("daiBond: ", daiBond.address);

    principleAddressBond2 = WETH;

    /*const EthBondDepository = await ethers.getContractFactory("TimeEthBondDepository")
    const ethBond = await EthBondDepository.deploy(
        time.address,
        principleAddressBond2,
        treasury.address,
        daoAddress,
        ETH_USD_Feed,
    );
    await ethBond.deployed();
    console.log("ethBond: ", ethBond.address);*/

    const daiBondBCV = '120';               // DAI bond BCV         // Halsey: So then the start should be 120
    const bondVestingLength = '864000';       // Bond vesting length seconds
    const minBondPrice = '8000';           // Min bond price
    const maxBondPayout = '4'              // Max bond payout     /
    const bondFee = '0';                // DAO fee for bond
    const maxBondDebt = '1000000000000000'; // Max debt bond can take on
    const intialBondDebt = '0'              // Initial Bond debt

    tx = await daiBond.initializeBondTerms(
        daiBondBCV,          // _controlVariable
        minBondPrice,        // _minimumPrice
        maxBondPayout,       // _maxPayout
        bondFee,             // _fee
        maxBondDebt,         // _maxDebt
        intialBondDebt,      // _initialDebt
        bondVestingLength,   // _vestingTerm
    );
    await tx.wait(1)
    console.log("Initialize for dai BOND: ");
    console.log(`
        daiBondBCV        ${daiBondBCV}
        minBondPrice      ${minBondPrice}
        maxBondPayout     ${maxBondPayout}
        bondFee           ${bondFee}
        maxBondDebt       ${maxBondDebt}
        intialBondDebt    ${intialBondDebt}
        bondVestingLength ${bondVestingLength} seconds
    `)


    tx = await daiBond.setStaking(
        stakingHelper.address,
        1
    )
    await tx.wait(1)
    console.log("Staking Helper for dai BOND");

    /*await ethBond.initializeBondTerms(
        1,
        1,
        1,
        "100",
        0,
        129600,
    );
    console.log("Initialize for ETH BOND");

    await ethBond.setStaking(
        stakingHelper.address,
        1
    )
    console.log("Staking Helper for ETH BOND");*/

    ////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////

    // tx = await mim.mint("150000000000000000000000000000000000000000000")
    // await tx.wait(1)
    // console.log("Minted dai: ", "10000000000000000000000000000000  (150000000000000000000000000000000000000000000 ?)");

    tx = await treasury.queue(0, deployer.address); 
    await tx.wait(1)
    tx = await treasury.queue(3, deployer.address); 
    await tx.wait(1)
    tx = await treasury.queue(4, deployer.address); 
    await tx.wait(1)
    tx = await treasury.queue(6, deployer.address); 
    await tx.wait(1)
    tx = await treasury.queue(7, deployer.address);
    await tx.wait(1)
    tx = await treasury.queue(8, deployer.address); 
    await tx.wait(1)

    tx = await treasury.queue(0, daiBond.address);
    await tx.wait(1)
    tx = await treasury.queue(4, daiBond.address);
    await tx.wait(1)
    tx = await treasury.queue(8, daiBond.address);
    await tx.wait(1)
    //await treasury.queue(0, ethBond.address);
    //await treasury.queue(4, ethBond.address);
    //await treasury.queue(8, ethBond.address);

    tx = await treasury.queue(4, bondingCalculator.address);
    await tx.wait(1)
    tx = await treasury.queue(8, bondingCalculator.address);
    await tx.wait(1)

    tx = await treasury.queue(8, distributor.address);
    await tx.wait(1)

    tx = await treasury.queue(9, sBash.address);
    await tx.wait(1)

    console.log("ALL QUEUES DONE");

    tx = await treasury.toggle(0, deployer.address, zeroAddress);
    await tx.wait(1)
    tx = await treasury.toggle(3, deployer.address, zeroAddress);
    await tx.wait(1)
    tx = await treasury.toggle(4, deployer.address, zeroAddress);
    await tx.wait(1)
    tx = await treasury.toggle(6, deployer.address, zeroAddress); 
    await tx.wait(1)
    tx = await treasury.toggle(7, deployer.address, zeroAddress);
    await tx.wait(1)
    tx = await treasury.toggle(8, deployer.address, zeroAddress);
    await tx.wait(1)

    tx = await treasury.toggle(0, daiBond.address, zeroAddress);
    await tx.wait(1)
    tx = await treasury.toggle(4, daiBond.address, zeroAddress);
    await tx.wait(1)
    tx = await treasury.toggle(8, daiBond.address, zeroAddress);
    await tx.wait(1)
    //await treasury.toggle(0, ethBond.address, zeroAddress);
    //await treasury.toggle(4, ethBond.address, zeroAddress);
    //await treasury.toggle(8, ethBond.address, zeroAddress);

    tx = await treasury.toggle(4, bondingCalculator.address, zeroAddress)
    await tx.wait(1)
    tx = await treasury.toggle(8, bondingCalculator.address, zeroAddress)
    await tx.wait(1)

    tx = await treasury.toggle(8, distributor.address, zeroAddress);
    await tx.wait(1)

    tx = await treasury.toggle(9, sBash.address, zeroAddress);
    await tx.wait(1)

    console.log("ALL TOGGLES DONE");


    // Deposit and Mint blkd
    const mimAmount = "100000000000000000000000"    // 100k dai 100000e18
    const mimProfit = "10000000000000"              // deposit 10k bash and mint 90k back to depositor
    tx = await dai.approve(treasury.address, "1000000000000000000000000000000000000000"); // Approve treasury to use the mim
    await tx.wait(1)
    console.log("mim Approved to treasury :", mimAmount);
    tx = await treasury.deposit(mimAmount, dai.address, mimProfit); // Deposit mim into treasury
    await tx.wait(1)
    console.log("mim Deposited in treasury :", mimAmount);
    const blkdMintedAgainstmim = await bash.balanceOf(deployer.address);
    console.log("Time minted against mim: ", blkdMintedAgainstmim.toString());
    /////////////////////////////////////////////////////////////////////////////////

    try {
        await hre.run("verify:verify", {
            address: bash.address, 
            constructorArguments: [],
        });
    } catch (error) {}

    try {
        await hre.run("verify:verify", {
            address: sBash.address,
            constructorArguments: [],
        });
    } catch (error) {}

    try {
        await hre.run("verify:verify", {
            address: treasury.address,
            constructorArguments: [bash.address, dai.address, timelock],
        });
    } catch (error) {}

    try {
        await hre.run("verify:verify", {
            address: staking.address,
            constructorArguments: [
              bash.address,
              sBash.address,
              epochLength,
              firstEpochNumber,
              firstEpochTime
            ],
        });
    } catch (error) {}

    try {
        await hre.run("verify:verify", {
            address: distributor.address,
            constructorArguments: [
              treasury.address,
              bash.address,
              epochLength,
              nextEpochTime
            ],
        });
    } catch (error) {}

    try {
      await hre.run("verify:verify", {
        address: stakingHelper.address,
        constructorArguments: [  
          staking.address,
          bash.address,
        ],
    });
    } catch (error) {
      
    }

    try {
      await hre.run("verify:verify", {
          address: stakingWarmup.address,
          constructorArguments: [    
            staking.address,
            sBash.address,],
      });
    } catch (error) {}

    try {
        await hre.run("verify:verify", {
            address: bondingCalculator.address,
            constructorArguments: [bash.address],
        });
    } catch (error) {}

    try {
        await hre.run("verify:verify", {
            address: daiBond.address,
            constructorArguments: [
              bash.address,
              principleAddressBond1,
              treasury.address,
              daoAddress,
              zeroAddress
            ],
        });
    } catch (error) {}

    // try {
    //     await hre.run("verify:verify", {
    //         address: ethBond.address,
    //         constructorArguments: [
    //             time.address,
    //             principleAddressBond2,
    //             treasury.address,
    //             daoAddress,
    //             ETH_USD_Feed
    //         ],
    //     });
    // } catch (error) {}

    try {
        await hre.run("verify:verify", {
            address: dai.address,
            constructorArguments: [
                chainID
            ],
        });
    } catch (error) {}

    try {
        await hre.run("verify:verify", {
            address: wsBash.address,
            constructorArguments: [
              sBash.address
            ],
        });
    } catch (error) {}

    console.log("All contracts deployed successfully");
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
