
const hre = require("hardhat");
//https://github.com/wasif28/contracts/blob/main/hardhat/scripts/deployOnRinkeby.ts
//https://github.com/OlympusDAO/olympus-contracts/blob/fc60fac80b48aca3336e75cbe1edddef82711f3b/scripts/deployAll.js
//https://github.com/SnowbankDAO/snowbank-contracts/blob/main/Treasury.sol
async function main() {

    const [deployer] = await ethers.getSigners();
    console.log(`deployer:   ${deployer.address}`)
    
    const DAI  = "0x623a9e4941f4c2beed8d87beffe9d0d947683a8c"
    const FRAX = '0x131c1276e25f8d0bc2c157804b0a843bef525bc0'
    const LUSD = '0xebdbc642b806a288904bb2a973c744d2aea0afaa'
    const dead = '0x000000000000000000000000000000000000dead'
    const zeroAddress = '0x0000000000000000000000000000000000000000'
    var tx

    ////// deploy tokens ////////////////

    const mockfrax = await hre.ethers.getContractFactory("MockERC20");
    const frax = await mockfrax.deploy("frax", "frax", "1000000000000000000000000000")
    await frax.deployed()
    console.log(`frax:  ${frax.address}`)

    console.log(`deploy bash`)
    const BASH = await hre.ethers.getContractFactory("BASHERC20Token");
    const bash = await BASH.deploy();
    await bash.deployed()

    console.log(`deploy sbash`)
    const SBASH = await hre.ethers.getContractFactory("sBASH");
    const sbash = await SBASH.deploy();
    await sbash.deployed()

    console.log(`deploy wsbash`)
    const WSBASH = await hre.ethers.getContractFactory("wsBASH");
    const wsbash = await WSBASH.deploy(sbash.address);
    await wsbash.deployed()

  ///////////////////////////////////////

  ////// deploy treasury, ohm staking, distributor, stakinghelper, staking warmup, bondcalc //////////

    const epochLength = 10 //28800
    const firstEpochTime = 1644702870
    const firstEpochNumber = 0
    const nextEpochTime = firstEpochTime + epochLength

    console.log(`deploy bashtreasury`)
    const Treasury = await ethers.getContractFactory('BashTreasury'); 
    const treasury = await Treasury.deploy( 
      bash.address, 
      frax.address, 
      0 
    );
    await treasury.deployed()

    console.log(`deploy bashstaking`)
    const Staking = await ethers.getContractFactory("ATBASHStaking");
    const staking = await Staking.deploy(
      bash.address,
      sbash.address,
      epochLength,
      firstEpochNumber,
      firstEpochTime
    );
    await staking.deployed()

    console.log(`deploy distributor`)
    const Distributor = await ethers.getContractFactory("Distributor");
    const distributor = await Distributor.deploy(
        treasury.address,
        bash.address,
        epochLength,
        nextEpochTime
    );
    await distributor.deployed()

    console.log(`deploy stakinghelper`)
    const SH = await hre.ethers.getContractFactory("StakingHelper");
    const sh = await SH.deploy(staking.address, bash.address);
    await sh.deployed()

    console.log(`deploy stakingwarmup`)
    const StakingWarmpup = await ethers.getContractFactory('StakingWarmup');
    const stakingWarmup = await StakingWarmpup.deploy(staking.address, sbash.address);
    await stakingWarmup.deployed()

    console.log(`deploy ATBASHBondingCalculator`)
    const TimeBondingCalculator = await ethers.getContractFactory('ATBASHBondingCalculator');
    const ATBASHBondingCalculator = await TimeBondingCalculator.deploy(bash.address);
    await ATBASHBondingCalculator.deployed()

    ////////////////////////////////////////////////////////////////////////////////////

    //TEMP
    var daoAddress = deployer.address;
    var principleAddress = frax.address;

    console.log(`deploy atbashBondDepository`)
    const BondDepository = await ethers.getContractFactory("atbashBondDepository"); 
    const bondDepository = await BondDepository.deploy(
        bash.address,
        principleAddress,
        treasury.address,
        daoAddress,
        zeroAddress,
    );
    await bondDepository.deployed()

    

    const index = "1";
    const warmupPeriod = "0";

    tx = await bash.setVault(treasury.address);
    await tx.wait(5)
    console.log("set vault");

    tx = await sbash.setIndex(index);
    await tx.wait(5)
    console.log("set Index");

    tx = await sbash.initialize(staking.address);
    await tx.wait(5)
    console.log("initialize sblkd");

    tx = await staking.setContract("1", stakingWarmup.address); // Set Warmup Contract ( Later set up LP Staking too )
    await tx.wait(5)
    console.log("setDistributor for warmup:", stakingWarmup.address);

    await staking.setContract("0", distributor.address); // Set distributor Contract ( Later set up LP Staking too )
    console.log("setDistributor for Staking:", distributor.address);

    tx = await staking.setWarmup(warmupPeriod);
    await tx.wait(5)
    console.log("setDistributor for Staking:", warmupPeriod);

    //await dai.mint(deployer.address, "10000000000000000000000000000000000000000000000000")
    //console.log("Minted DAI: ", "10000000000000000000000000000000");

    tx = await distributor.addRecipient(staking.address, "4000");
    await tx.wait(5)
    console.log("Distributor Add Recipient:", 4000);



    
    tx = await treasury.queue(8, distributor.address);               // Allows distributor to mint BLKD.
    await tx.wait(5)
    tx = await treasury.toggle(8, distributor.address, zeroAddress); // Allows distributor to mint BLKD.
    await tx.wait(5)
    console.log("Treasury.enable(8):  distributor enabled to mint ohm on treasury");

    tx = await treasury.queue(8, deployer.address); // Allows deployer to mint BLKD.
    await tx.wait(5)
    tx = await treasury.toggle(8, deployer.address, zeroAddress); // Allows deployer to mint BLKD.
    await tx.wait(5)
    console.log("Treasury.enable(8):  Deployer enabled to mint ohm on treasury");

     // Treasury Actions
     tx = await treasury.queue(0, deployer.address); // Enable the deployer to deposit reserve tokens
     await tx.wait(5)
     tx = await treasury.toggle(0, deployer.address, zeroAddress); // Enable the deployer to deposit reserve tokens
     await tx.wait(5)
     console.log("Deployer Enabled on Treasury(0): ", deployer.address);
     
     //await treasury.queue(2, frax.address); // Enable DAI as a reserve Token
     //await treasury.toggle(2, frax.address, zeroAddress); // Enable DAI as a reserve Token
     console.log("frax Enabled on Treasury(2) as reserve: ", frax.address);
     // Deposit and Mint blkd
     const fraxAmount = "1000000000000000000000"
     tx = await frax.approve(treasury.address, fraxAmount); // Approve treasury to use the DAI
     await tx.wait(5)
     console.log("frax Approved to treasury :", fraxAmount);



     tx = await treasury.deposit(fraxAmount, frax.address, "0"); // Deposit DAI into treasury
     await tx.wait(5)
     console.log("frax Deposited in treasury :", fraxAmount);
     const blkdMintedAgainstDai = await bash.balanceOf(deployer.address);
     console.log("Time minted against FRAX: ", blkdMintedAgainstDai.toString());

    console.log(`
    {
      deployer/dao?: ${deployer.address}
      DAO_ADDRESS: "0x000000000000000000000000000000000000dead",
      frax: "${frax.address}",
    
      bash: "${bash.address}",
      sbash: "${sbash.address}",
      wsbash: "${wsbash.address}"
      treasury: ${treasury.address}
      distributor  ${distributor.address}
      staking  ${staking.address}
      stakinghelper: ${sh.address}
      ATBASHBondingCalculator  ${ATBASHBondingCalculator.address}
      frax bondDepositoy  ${bondDepository.address}
    }
    `)
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
