import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import chai, { expect } from "chai";
import { ethers, network } from "hardhat";
const { BigNumber } = ethers;
import { FakeContract, smock } from "@defi-wonderland/smock";
import {
    AtbashBondDepository,
    BashTreasury__factory,
    IDai,
    IBash,
    IStaking,
    IDistributor,
    IsBash, 
    IWarmup,
    // IsOHM,
    IERC20,
    ATBASHStaking,
    ATBASHStaking__factory,
    BashTreasury,
    StakingHelper,
    ATBASHBondingCalculator,
    IUniswapV2Pair,
    AtbashBondDepository__factory,
    ITreasury,
    IStakingHelper,
    // OlympusAuthority,
    // OlympusAuthority__factory,
} from "../../types";
import { getCurrentBlockTime, advanceBlockTime } from "../utils/blocktime";
import { CONTRACTS, MANAGING, ZERO_ADDRESS } from "../../scripts/constants";

chai.should();
chai.use(smock.matchers);

const BASH_DECIMALS = 1;
const DAI_DECIMALS = (BASH_DECIMALS * 2).toFixed();
const BASHDAI_DECIMALS = DAI_DECIMALS;

describe("AtbashBondDepository", () => {
    let owner: SignerWithAddress;
    let reserveManager: SignerWithAddress;
    let depositor: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let other: SignerWithAddress;
    
    let bashFake: FakeContract<IBash>;
    let daiFake: FakeContract<IDai>;
    let treasuryFake: FakeContract<ITreasury>;
    let stakingHelperFake: FakeContract<IStakingHelper>;
    let stakingFake: FakeContract<IStaking>;

    let bondingCalculatorFake: FakeContract<ATBASHBondingCalculator>;
    let bashDaiFake: FakeContract<IUniswapV2Pair>;

    const bondControlVariable = 120;              
    const vestingLength = 864000;    
    const minimumPrice = 8000;           
    const maxPayout = 4;              
    const bondFee = 0;                
    const maxDebt = 1000000000000000; 
    const initialDebt = 0;  

    beforeEach(async () => {
        [owner, alice, bob, other, depositor] = await ethers.getSigners();
        bashFake = await smock.fake<IBash>("IBash");
        daiFake = await smock.fake<IDai>("IDai");
        treasuryFake = await smock.fake<ITreasury>(CONTRACTS.treasury);
        bondingCalculatorFake = await smock.fake<ATBASHBondingCalculator>(CONTRACTS.bondingCalculator);
        bashDaiFake = await smock.fake<IUniswapV2Pair>("IUniswapV2Pair");
        stakingHelperFake = await smock.fake<IStakingHelper>(CONTRACTS.stakingHelper);
        stakingFake = await smock.fake<IStaking>(CONTRACTS.staking);
    });

    describe("construction", () => {
        it("can be constructed", async () => {
            const bondDepository = await new AtbashBondDepository__factory(owner).deploy(
                bashFake.address,
                daiFake.address,
                treasuryFake.address,
                owner.address,
                ZERO_ADDRESS
            );
            (await bondDepository.isLiquidityBond()).should.be.false;
            (await bondDepository.Bash()).should.be.equal(bashFake.address);

        });

        it("does not allow 0x0 Bash token address", async () => { 
            (new AtbashBondDepository__factory(owner).deploy(
                ZERO_ADDRESS,
                daiFake.address,
                treasuryFake.address,
                owner.address,
                bondingCalculatorFake.address
            )).should.be.reverted;
        });

        it("does not allow 0x0 principle token address", async () => { 
            (new AtbashBondDepository__factory(owner).deploy(
                bashFake.address,
                ZERO_ADDRESS,
                treasuryFake.address,
                owner.address,
                bondingCalculatorFake.address
            )).should.be.reverted;
        });

        it("does not allow 0x0 treasury address", async () => { 
            (new AtbashBondDepository__factory(owner).deploy(
                bashFake.address,
                daiFake.address,
                ZERO_ADDRESS,
                owner.address,
                bondingCalculatorFake.address
            )).should.be.reverted;
        });

        it("does not allow 0x0 DAO address", async () => { 
            (new AtbashBondDepository__factory(owner).deploy(
                bashFake.address,
                daiFake.address,
                treasuryFake.address,
                ZERO_ADDRESS,
                bondingCalculatorFake.address
            )).should.be.reverted;
        });

        it("configures as liquidity bond if bonding calculator provided", async () => { 
            const bondDepository = await new AtbashBondDepository__factory(owner).deploy(
                bashFake.address,
                daiFake.address,
                treasuryFake.address,
                owner.address,
                bondingCalculatorFake.address
            );
            (await bondDepository.connect(owner).isLiquidityBond()).should.be.true;
        });
    });

    describe("initialize terms", () => {
        let bondDepository: AtbashBondDepository;

        beforeEach(async () => {
            bondDepository = await new AtbashBondDepository__factory(owner).deploy(
                bashFake.address,
                daiFake.address,
                treasuryFake.address,
                owner.address,
                ZERO_ADDRESS
            );
        });

        it("only allowed when current terms control variable at zero", async () => {
            await bondDepository.initializeBondTerms(
                100, 0, 0, 0, 0, 0, 0
            );
            
            bondDepository.initializeBondTerms(
                100, 0, 0, 0, 0, 0, 0
            ).should.be.revertedWith("Bonds must be initialized from 0");
        });

        it("can only be intialized by owner", async () => {
            bondDepository.connect(alice).initializeBondTerms(
                100, 0, 0, 0, 0, 0, 0
            ).should.be.revertedWith("Ownable: caller is not the owner");
        });

        it("sets total debt to initial debt", async () => {
            const initialDebt = 100;
            await bondDepository.initializeBondTerms(
                100, 0, 0, 0, 0, initialDebt, 0
            );

            (await bondDepository.totalDebt()).should.be.equal(initialDebt);
        });

        it("sets initial bond terms", async () => {
            await bondDepository.initializeBondTerms(
                bondControlVariable, minimumPrice, maxPayout, bondFee, maxDebt, initialDebt, vestingLength
            );

            const terms = await bondDepository.terms();
            terms.controlVariable.should.be.equal(bondControlVariable);
            terms.minimumPrice.should.be.equal(minimumPrice);
            terms.maxPayout.should.be.equal(maxPayout);
            terms.fee.should.be.equal(bondFee);
            terms.maxDebt.should.be.equal(maxDebt);
            terms.vestingTerm.should.be.equal(vestingLength);
        });

        it("sets last decay to current block time", async () => {
            const currentBlockTime = await getCurrentBlockTime();
            await bondDepository.initializeBondTerms(
                bondControlVariable, minimumPrice, maxPayout, bondFee, maxDebt, initialDebt, vestingLength
            );
            (await bondDepository.lastDecay()).should.be.greaterThanOrEqual(currentBlockTime);
        });

        it("only allows owner to set staking contract", async () => {
            bondDepository.connect(other).setStaking(stakingFake.address, false)
                .should.be.revertedWith("Ownable: caller is not the owner");
        });

        it("only allows owner to set staking helper contract", async () => {
            bondDepository.connect(other).setStaking(stakingHelperFake.address, true)
                .should.be.revertedWith("Ownable: caller is not the owner");
        });
    });
    
    describe("bond - standard stable reserve", () => {
        describe("deposit", async () => {
            let bondDepository: AtbashBondDepository;
    
            beforeEach(async () => {
                bondDepository = await new AtbashBondDepository__factory(owner).deploy(
                    bashFake.address,
                    daiFake.address,
                    treasuryFake.address,
                    owner.address,
                    ZERO_ADDRESS
                );
                await bondDepository.initializeBondTerms(
                    bondControlVariable, minimumPrice, maxPayout, bondFee, maxDebt, initialDebt, vestingLength
                );

                daiFake.decimals.returns(DAI_DECIMALS);
            });
    
            it("must provide valid depositor address", async () => {
                bondDepository.deposit(0, 0, ZERO_ADDRESS).should.be.revertedWith("Invalid address")
            });
    
            it("decays existing debt", async () => {
                // todo: set initial debt for first pass debt decay
                //true.should.be.false;
            });
        });

        describe("bond - LP", () => {
            describe("depositx", async () => {
                let bondDepository: AtbashBondDepository;
        
                beforeEach(async () => {
                    bondDepository = await new AtbashBondDepository__factory(owner).deploy(
                        bashFake.address,
                        daiFake.address,
                        treasuryFake.address,
                        owner.address,
                        ZERO_ADDRESS
                    );
                    await bondDepository.initializeBondTerms(
                        bondControlVariable, minimumPrice, maxPayout, bondFee, maxDebt, initialDebt, vestingLength
                    );
                });
        
                it("xmust provide valid depositor address", async () => {
                    bondDepository.deposit(0, 0, ZERO_ADDRESS).should.be.revertedWith("Invalid address")
                });
        
                it("xx", async () => {
        
                });
        
                it("xdecays existing debt", async () => {
                    // todo: set initial debt for first pass debt decay
                    //true.should.be.false;
                });
            });
        });
    });
});

// describe("Treasury OHM", async () => {
//     const LARGE_APPROVAL = "100000000000000000000000000000000";
//     const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
//     // Initial mint for Frax and DAI (10,000,000)
//     const initialMint = "10000000000000000000000000";
//     // Reward rate of .1%
//     const initialRewardRate = "1000";
//     // Debt limit of 10
//     const debtLimit = "10000000000";

//     const mineBlock = async () => {
//         await network.provider.request({
//             method: "evm_mine",
//             params: [],
//         });
//     };

//     // Calculate index after some number of epochs. Takes principal and rebase rate.
//     // TODO verify this works
//     const calcIndex = (principal: number, rate: number, epochs: number) => principal * (1 + rate) ** epochs;

//     let deployer: SignerWithAddress, alice: SignerWithAddress, bob: SignerWithAddress, carol: SignerWithAddress;
//     let erc20Factory;
//     let stakingFactory;
//     let ohmFactory;
//     let sOhmFactory;
//     let gOhmFactory;
//     let treasuryFactory;
//     let distributorFactory;
//     let authFactory;
//     let mockSOhmFactory;

//     let auth;
//     let dai;
//     let lpToken;
//     let ohm;
//     let sOhm;
//     let staking: FakeContract<IStaking>;
//     let gOhm;
//     let treasury;
//     let distributor;

//     // TODO needs cleanup. use Bignumber.
//     // Mine block and rebase. Returns the new index.
//     const triggerRebase = async () => {
//         mineBlock();
//         await staking.rebase();

//         return await sOhm.index();
//     };


//     /**
//      * Everything in this block is only run once before all tests.
//      * This is the home for setup methodss
//      */
//     before(async () => {
//         [deployer, alice, bob, carol] = await ethers.getSigners();

//         //owner = await ethers.getSigner("0x763a641383007870ae96067818f1649e5586f6de")

//         //erc20Factory = await ethers.getContractFactory('MockERC20');
//         // TODO use dai as erc20 for now
//         authFactory = await ethers.getContractFactory("OlympusAuthority");
//         erc20Factory = await ethers.getContractFactory("DAI");

//         stakingFactory = await ethers.getContractFactory("OlympusStaking");
//         ohmFactory = await ethers.getContractFactory("OlympusERC20Token");
//         sOhmFactory = await ethers.getContractFactory("sOlympus");
//         gOhmFactory = await ethers.getContractFactory("gOHM");
//         treasuryFactory = await ethers.getContractFactory("OlympusTreasury");
//         distributorFactory = await ethers.getContractFactory("Distributor");
//     });

//     // These should not be in beforeEach.
//     beforeEach(async () => {
//         //dai = await smock.fake(erc20Factory);
//         //lpToken = await smock.fake(erc20Factory);
//         dai = await erc20Factory.deploy(0);
//         lpToken = await erc20Factory.deploy(0);

//         // TODO use promise.all
//         auth = await authFactory.deploy(
//             deployer.address,
//             deployer.address,
//             deployer.address,
//             deployer.address
//         ); // TODO
//         ohm = await ohmFactory.deploy(auth.address);
//         sOhm = await sOhmFactory.deploy();
//         gOhm = await gOhmFactory.deploy(sOhm.address, sOhm.address); // Call migrate immediately
//         staking = await stakingFactory.deploy(
//             ohm.address,
//             sOhm.address,
//             gOhm.address,
//             "10",
//             "1",
//             "9",
//             auth.address
//         );
//         treasury = await treasuryFactory.deploy(ohm.address, "0", auth.address);
//         distributor = await distributorFactory.deploy(
//             treasury.address,
//             ohm.address,
//             staking.address,
//             auth.address
//         );

//         // Setup for each component

//         // Needed for treasury deposit
//         //await gOhm.migrate(staking.address, sOhm.address);
//         await dai.mint(deployer.address, initialMint);
//         await dai.approve(treasury.address, LARGE_APPROVAL);

//         // Needed to spend deployer's OHM
//         await ohm.approve(staking.address, LARGE_APPROVAL);

//         // To get past OHM contract guards
//         await auth.pushVault(treasury.address, true);

//         // Initialization for sOHM contract.
//         // Set index to 10
//         await sOhm.setIndex("10000000000");
//         await sOhm.setgOHM(gOhm.address);
//         await sOhm.initialize(staking.address, treasury.address);

//         // Set distributor staking contract
//         await staking.setDistributor(distributor.address);

//         // Don't need to disable timelock because disabled by default.

//         // toggle reward manager
//         await treasury.enable("8", distributor.address, ZERO_ADDRESS);
//         // toggle deployer reserve depositor
//         await treasury.enable("0", deployer.address, ZERO_ADDRESS);
//         // toggle liquidity depositor
//         await treasury.enable("4", deployer.address, ZERO_ADDRESS);
//         // toggle DAI as reserve token
//         await treasury.enable("2", dai.address, ZERO_ADDRESS);
//         // set sOHM
//         await treasury.enable("9", sOhm.address, ZERO_ADDRESS);

//         // Deposit 10,000 DAI to treasury, 1,000 OHM gets minted to deployer with 9000 as excess reserves (ready to be minted)
//         await treasury
//             .connect(deployer)
//             .deposit("10000000000000000000000", dai.address, "9000000000000");

//         // Add staking as recipient of distributor with a test reward rate
//         await distributor.addRecipient(staking.address, initialRewardRate);

//         // Get sOHM in deployer wallet
//         const sohmAmount = "1000000000000";
//         await ohm.approve(staking.address, sohmAmount);
//         await staking.stake(deployer.address, sohmAmount, true, true);

//         // Transfer 10 sOHM to alice for testing
//         await sOhm.transfer(alice.address, debtLimit);
//     });

//     it("should not have debt logged for alice", async () => {
//         expect(await sOhm.debtBalances(alice.address)).to.equal(0);
//     });

//     it("should not have alice as a debtor", async () => {
//         expect(await treasury.permissions(7, alice.address)).to.equal(false);
//     });

//     it("should enable alice as a debtor", async () => {
//         await treasury.enable(7, alice.address, alice.address);
//         expect(await treasury.permissions(7, alice.address)).to.equal(true);
//     });

//     it("should have debt limit as zero", async () => {
//         await treasury.enable(7, alice.address, alice.address);
//         expect(await treasury.debtLimit(alice.address)).to.equal(0);
//     });

//     it("should set debt limit", async () => {
//         await treasury.enable(7, alice.address, alice.address);
//         await treasury.setDebtLimit(alice.address, debtLimit);
//         expect(await treasury.debtLimit(alice.address)).to.equal(debtLimit);
//     });

//     it("should allow alice to borrow", async () => {
//         await treasury.enable(7, alice.address, ZERO_ADDRESS);
//         await treasury.setDebtLimit(alice.address, debtLimit);
//         await treasury.connect(alice).incurDebt(1e9, dai.address);
//         expect(await sOhm.debtBalances(alice.address)).to.equal(1);
//     });

//     it("should allow alice to borrow up to her balance in dai", async () => {
//         let staked = await sOhm.balanceOf(alice.address);
//         await treasury.enable(7, alice.address, ZERO_ADDRESS);
//         await treasury.setDebtLimit(alice.address, debtLimit);
//         await treasury.connect(alice).incurDebt(String(staked * 1000000000), dai.address);
//         expect(await sOhm.debtBalances(alice.address)).to.equal(staked);
//     });

//     it("should not allow alice to borrow more than her balance in dai", async () => {
//         let staked = await sOhm.balanceOf(alice.address);
//         await treasury.enable(7, alice.address, ZERO_ADDRESS);
//         await treasury.setDebtLimit(alice.address, debtLimit);
//         await expect(
//             treasury.connect(alice).incurDebt(String(staked * 1000000000 + 1000000000), dai.address)
//         ).to.be.revertedWith("");
//     });

//     it("should allow alice to borrow up to her balance in ohm", async () => {
//         let staked = await sOhm.balanceOf(alice.address);
//         await treasury.enable(10, alice.address, ZERO_ADDRESS);
//         await treasury.setDebtLimit(alice.address, debtLimit);
//         await treasury.connect(alice).incurDebt(staked, ohm.address);
//         expect(await sOhm.debtBalances(alice.address)).to.equal(staked);
//     });

//     it("should not allow alice to borrow more than her balance in sOhm", async () => {
//         let staked = await sOhm.balanceOf(alice.address);
//         await treasury.enable(10, alice.address, ZERO_ADDRESS);
//         await treasury.setDebtLimit(alice.address, debtLimit * 2);
//         await expect(
//             treasury.connect(alice).incurDebt(String(staked + 1), ohm.address)
//         ).to.be.revertedWith("sOHM: insufficient balance");
//     });

//     it("should not allow alice to borrow more than her debt limit", async () => {
//         sOhm.transfer(alice.address, debtLimit);
//         let staked = await sOhm.balanceOf(alice.address);
//         await treasury.enable(10, alice.address, ZERO_ADDRESS);
//         await treasury.setDebtLimit(alice.address, debtLimit);
//         await expect(treasury.connect(alice).incurDebt(staked, ohm.address)).to.be.revertedWith(
//             "Treasury: exceeds limit"
//         );
//     });

//     it("should allow alice to repay in dai", async () => {
//         let staked = await sOhm.balanceOf(alice.address);
//         await treasury.enable(7, alice.address, ZERO_ADDRESS);
//         await treasury.setDebtLimit(alice.address, debtLimit);
//         await treasury.connect(alice).incurDebt(String(staked * 1e9), dai.address);
//         await dai.connect(alice).approve(treasury.address, String(staked * 1e9));
//         await treasury.connect(alice).repayDebtWithReserve(String(staked * 1e9), dai.address);
//         expect(await sOhm.debtBalances(alice.address)).to.equal(0);
//     });

//     it("should allow alice to repay her debt in ohm", async () => {
//         let staked = await sOhm.balanceOf(alice.address);
//         await treasury.enable(10, alice.address, ZERO_ADDRESS);
//         await treasury.setDebtLimit(alice.address, debtLimit);
//         await treasury.connect(alice).incurDebt(staked, ohm.address);
//         await ohm.connect(alice).approve(treasury.address, staked);
//         await treasury.connect(alice).repayDebtWithOHM(staked);
//         expect(await sOhm.debtBalances(alice.address)).to.equal(0);
//     });
// });
