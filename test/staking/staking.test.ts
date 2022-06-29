import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import chai, { expect } from "chai";
import { ethers, network } from "hardhat";
const { BigNumber } = ethers;
import { FakeContract, smock } from "@defi-wonderland/smock";
import {
    IDistributor,
    IsBash, 
    IWarmup,
    // IsOHM,
    // IERC20,
    ATBASHStaking,
    ATBASHStaking__factory,
    IERC20,
    // OlympusAuthority,
    // OlympusAuthority__factory,
} from "../../types";
import { getCurrentBlockTime, advanceBlockTime } from "../utils/blocktime";

chai.should();
chai.use(smock.matchers);

const ZERO_ADDRESS = ethers.utils.getAddress("0x0000000000000000000000000000000000000000");

describe("AtbashStaking", () => {
    let owner: SignerWithAddress;
    let governor: SignerWithAddress;
    let guardian: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let other: SignerWithAddress;
    let bashFake: FakeContract<IERC20>;
    let sBashFake: FakeContract<IsBash>;
    // let gOHMFake: FakeContract<IgOHM>;
    let distributorFake: FakeContract<IDistributor>;
    let staking: ATBASHStaking;
    let stakingWarmupFake: FakeContract<IWarmup>;
    // let authority: OlympusAuthority;

    const EPOCH_LENGTH = 2200;
    const EPOCH_NUMBER = 1;
    // const FUTURE_END_TIME = 1022010000; // an arbitrary future block timestamp
    const FUTURE_END_TIME = parseInt(JSON.stringify(((new Date()).getTime() / 1000) + EPOCH_LENGTH));

    beforeEach(async () => {
        [owner, governor, guardian, alice, bob, other] = await ethers.getSigners();
        bashFake = await smock.fake<IERC20>("contracts/interfaces/IERC20.sol:IERC20");
        // gOHMFake = await smock.fake<IgOHM>("IgOHM");
        // need to be specific because IsOHM is also defined in OLD
        sBashFake = await smock.fake<IsBash>("contracts/interfaces/IsBash.sol:IsBash");
        stakingWarmupFake = await smock.fake<IWarmup>("IWarmup");
        distributorFake = await smock.fake<IDistributor>("IDistributor");
        // authority = await new OlympusAuthority__factory(owner).deploy(
        //     governor.address,
        //     guardian.address,
        //     owner.address,
        //     owner.address
        // );
    });

    describe("constructor", () => {
        it("can be constructed", async () => {
            staking = await new ATBASHStaking__factory(owner).deploy(
                bashFake.address,
                sBashFake.address,
                // gOHMFake.address,
                EPOCH_LENGTH,
                EPOCH_NUMBER,
                FUTURE_END_TIME
                // authority.address
            );

            expect(await staking.Bash()).to.equal(bashFake.address); 
            expect(await staking.sBash()).to.equal(sBashFake.address);
            const epoch = await staking.epoch();
            expect((epoch as any)._length).to.equal(BigNumber.from(EPOCH_LENGTH));
            expect(epoch.number).to.equal(BigNumber.from(EPOCH_NUMBER));
            expect(epoch.endTime).to.equal(BigNumber.from(FUTURE_END_TIME));
            // expect(await authority.governor()).to.equal(governor.address);
        });

        it("will not allow a 0x0 OHM address", async () => {
            await expect(
                new ATBASHStaking__factory(owner).deploy(
                    ZERO_ADDRESS,
                    sBashFake.address,
                    // gOHMFake.address,
                    EPOCH_LENGTH,
                    EPOCH_NUMBER,
                    FUTURE_END_TIME,
                    // authority.address
                )
            ).to.be.reverted;
        });

        it("will not allow a 0x0 sOHM address", async () => {
            await expect(
                new ATBASHStaking__factory(owner).deploy(
                    bashFake.address,
                    ZERO_ADDRESS,
                    // gOHMFake.address,
                    EPOCH_LENGTH,
                    EPOCH_NUMBER,
                    FUTURE_END_TIME,
                    // authority.address
                )
            ).to.be.reverted;
        });

        // it("will not allow a 0x0 gOHM address", async () => {
        //     await expect(
        //         new ATBASHStaking__factory(owner).deploy(
        //             bashFake.address,
        //             sBashFake.address,
        //             ZERO_ADDRESS,
        //             EPOCH_LENGTH,
        //             EPOCH_NUMBER,
        //             FUTURE_END_TIME,
        //             authority.address
        //         )
        //     ).to.be.reverted;
        // });
    });

    describe("initialization", () => {
        beforeEach(async () => {
            staking = await new ATBASHStaking__factory(owner).deploy(
                bashFake.address,
                sBashFake.address,
                // gOHMFake.address,
                EPOCH_LENGTH,
                EPOCH_NUMBER,
                FUTURE_END_TIME,
                // authority.address
            );
        });

        describe("set distributor contract", () => {
            it("can set the distributor", async () => {
                // await staking.connect(governor).setDistributor(distributorFake.address);
                await staking.connect(owner).setContract(0, distributorFake.address);
                expect(await staking.distributor()).to.equal(distributorFake.address);
            });

            // todo: v1 no events are emitted 
            // it("emits the DistributorSet event", async () => {
            //     // await expect(staking.connect(governor).setDistributor(distributorFake.address))
            //     await expect(staking.connect(owner).setContract(0, distributorFake.address))
            //         .to.emit(staking, "DistributorSet")
            //         .withArgs(distributorFake.address);
            // });

            it("can only be done by the owner", async () => {
                // await expect(staking.connect(other).setDistributor(distributorFake.address)).to.be
                await expect(staking.connect(other).setContract(0, distributorFake.address)).to.be
                    .reverted;
            });
        });

        describe("set warmup contract", () => {
            it("can set the staking warmup", async () => {
                // await staking.connect(governor).setDistributor(distributorFake.address);
                await staking.connect(owner).setContract(1, stakingWarmupFake.address);
                expect(await staking.warmupContract()).to.equal(stakingWarmupFake.address);
            });

            // todo: v1 no events are emitted 
            // it("emits the DistributorSet event", async () => {
            //     // await expect(staking.connect(governor).setDistributor(distributorFake.address))
            //     await expect(staking.connect(owner).setContract(0, distributorFake.address))
            //         .to.emit(staking, "DistributorSet")
            //         .withArgs(distributorFake.address);
            // });

            it("can only be done by the owner", async () => {
                // await expect(staking.connect(other).setDistributor(distributorFake.address)).to.be
                await expect(staking.connect(other).setContract(1, stakingWarmupFake.address)).to.be
                    .reverted;
            });
        });

        describe("setWarmupLength", () => {
            it("sets the number of epochs of warmup are required", async () => {
                expect(await staking.warmupPeriod()).to.equal(0);
                await staking.connect(owner).setWarmup(2);
                expect(await staking.warmupPeriod()).to.equal(2);
            });

            // ohv2 emits an event
            // it("emits a WarmupSet event", async () => {
            //     await expect(staking.connect(governor).setWarmup(2))
            //         .to.emit(staking, "WarmupSet")
            //         .withArgs(2);
            // });

            // todo: ohmv2 uses a governer
            it("can only be set by the owner", async () => {
                await expect(staking.connect(other).setWarmup(2)).to.be.reverted;
            });
        });
    });

    describe("post-initialization", () => {
        async function deployStaking(nextRebaseBlock: any) {
            staking = await new ATBASHStaking__factory(owner).deploy(
                bashFake.address,
                sBashFake.address,
                // gOHMFake.address,
                EPOCH_LENGTH,
                EPOCH_NUMBER,
                nextRebaseBlock,
                // authority.address
            );
            // await staking.connect(governor).setDistributor(distributorFake.address);
            await staking.connect(owner).setContract(0, distributorFake.address);
            await staking.connect(owner).setContract(1, stakingWarmupFake.address);
        }

        beforeEach(async () => {
            // const currentBlock = await ethers.provider.send("eth_blockNumber", []);
            // const nextRebase = BigNumber.from(currentBlock).add(10000); // set the rebase far enough in the future to not hit it
            const nextRebaseTime = FUTURE_END_TIME;
            await deployStaking(nextRebaseTime);
        });

        describe("stake", () => {
            it("adds amount to the warmup when claim is false, regardless of rebasing", async () => {
                // when _claim is false, the _rebasing flag is taken into account on the claim method
                const amount = 1000;
                const gons = 10;
                // const rebasing = true;
                // const claim = false;

                bashFake.transferFrom
                    .whenCalledWith(alice.address, staking.address, amount)
                    .returns(true);
                sBashFake.gonsForBalance.whenCalledWith(amount).returns(gons);
                sBashFake.balanceForGons.whenCalledWith(gons).returns(amount);
                sBashFake.transfer.whenCalledWith(stakingWarmupFake.address, amount).returns(true);
                await staking.connect(alice).stake(amount, alice.address); //, rebasing, claim);

                // expect(await staking.supplyInWarmup()).to.equal(amount); v2ohm
                
                expect(await staking.warmupPeriod()).to.equal(0);
                const warmupInfo = await staking.warmupInfo(alice.address);
                const epochInfo = await staking.epoch();
                expect(warmupInfo.deposit).to.equal(amount);
                expect(warmupInfo.gons).to.equal(gons);
                expect(warmupInfo.expiry).to.equal(epochInfo.number);
                expect(warmupInfo.lock).to.equal(false);
                expect(sBashFake.transfer).to.have.been.calledWith(stakingWarmupFake.address, amount);
            });

            //     it("exchanges OHM for sOHM when claim is true and rebasing is true", async () => {
            //         const amount = 1000;
            //         const rebasing = true;
            //         const claim = true;

            //         bashFake.transferFrom
            //             .whenCalledWith(alice.address, staking.address, amount)
            //             .returns(true);
            //         sBashFake.transfer.whenCalledWith(alice.address, amount).returns(true);

            //         await staking.connect(alice).stake(alice.address, amount, rebasing, claim);

            //         // nothing is in warmup
            //         sBashFake.balanceForGons.whenCalledWith(0).returns(0);
            //         expect(await staking.supplyInWarmup()).to.equal(0);
            //     });

            //     it("exchanges OHM for newly minted gOHM when claim is true and rebasing is true", async () => {
            //         const amount = 1000;
            //         const indexedAmount = 10000;
            //         const rebasing = false;
            //         const claim = true;

            //         bashFake.transferFrom
            //             .whenCalledWith(alice.address, staking.address, amount)
            //             .returns(true);
            //         gOHMFake.balanceTo.whenCalledWith(amount).returns(indexedAmount);

            //         await staking.connect(alice).stake(alice.address, amount, rebasing, claim);

            //         expect(gOHMFake.mint).to.be.calledWith(alice.address, indexedAmount);
            //     });

            //     it("adds amount to warmup when claim is true and warmup period > 0, regardless of rebasing", async () => {
            //         // the rebasing flag is taken into account in the claim method
            //         const amount = 1000;
            //         const gons = 10;
            //         const rebasing = true;
            //         const claim = true;

            //         bashFake.transferFrom
            //             .whenCalledWith(alice.address, staking.address, amount)
            //             .returns(true);
            //         sBashFake.gonsForBalance.whenCalledWith(amount).returns(gons);
            //         sBashFake.balanceForGons.whenCalledWith(gons).returns(amount);

            //         await staking.connect(governor).setWarmupLength(1);
            //         await staking.connect(alice).stake(alice.address, amount, true, true);

            //         expect(await staking.supplyInWarmup()).to.equal(amount);
            //         const warmupInfo = await staking.warmupInfo(alice.address);
            //         const epochInfo = await staking.epoch();
            //         expect(warmupInfo.deposit).to.equal(amount);
            //         expect(warmupInfo.gons).to.equal(gons);
            //         expect(warmupInfo.expiry).to.equal(Number(epochInfo.number) + 1);
            //         expect(warmupInfo.lock).to.equal(false);
            //     });

            it("allows external deposits when locked", async () => {
                const amount = 1000;
                const gons = 10;
                // const rebasing = false;
                // const claim = false;

                bashFake.transferFrom
                    .whenCalledWith(alice.address, staking.address, amount)
                    .returns(true);
                
                sBashFake.gonsForBalance.whenCalledWith(amount).returns(gons);
                sBashFake.transfer.whenCalledWith(stakingWarmupFake.address, amount).returns(true);

                await staking.connect(alice).toggleDepositLock();

                // await expect(
                //     staking.connect(alice).stake(amount, bob.address) //, rebasing, claim)
                // ).to.be.revertedWith("External deposits for account are locked");
                await staking.connect(alice).stake(amount, bob.address); //, rebasing, claim);
                expect(sBashFake.transfer).to.have.been.calledWith(stakingWarmupFake.address, amount);
            });

            it("disables self deposits when locked", async () => {
                const amount = 1000;
                const gons = 10;
                // const rebasing = false;
                // const claim = false;

                bashFake.transferFrom
                    .whenCalledWith(alice.address, staking.address, amount)
                    .returns(true);
                sBashFake.gonsForBalance.whenCalledWith(amount).returns(gons);
                sBashFake.balanceForGons.whenCalledWith(gons).returns(amount);
                sBashFake.transfer.whenCalledWith(stakingWarmupFake.address, amount).returns(true);

                await staking.connect(alice).toggleDepositLock();

                // await staking.connect(alice).stake(amount, alice.address); //, rebasing, claim);
                await expect(staking.connect(alice).stake(amount, alice.address)).to.be.reverted;
                expect(sBashFake.transfer).to.not.have.been.called;
                // expect(await staking.supplyInWarmup()).to.equal(amount);
            });
        });

        describe("rebase", async () => {
            const circulatingSupply = 10;
            const amount = 1000;
            const stakedBash = amount;

            beforeEach(async () => {
                // await network.provider.request({
                //     method: "hardhat_reset"
                //   });
                const currentBlockTime = await getCurrentBlockTime();
                await deployStaking(currentBlockTime + EPOCH_LENGTH);

                await staking.connect(owner).setWarmup(1);  // 1 epoch

                const gons = 10;
                
                bashFake.transferFrom
                    .whenCalledWith(alice.address, staking.address, amount)
                    .returns(true);
                sBashFake.transfer.whenCalledWith(alice.address, amount).returns(true);
                sBashFake.balanceForGons.whenCalledWith(gons).returns(amount);
                sBashFake.transfer.whenCalledWith(stakingWarmupFake.address, amount).returns(true);
                distributorFake.distribute.returns(true);
                sBashFake.rebase.returns(100); // todo: should return total supply
                bashFake.balanceOf.returns(stakedBash);
                sBashFake.circulatingSupply.returns(circulatingSupply);
            });

            describe("first epoch", async () => {
                beforeEach(async () => {
                    // stake without advancing time too far in advance for the epoch
                    await staking.connect(alice).stake(amount, alice.address);
                });
                
                it("doesn't rebase on first epoch", async () => {
                    const epoch = await staking.connect(owner).epoch();
                    epoch.number.should.be.equal(EPOCH_NUMBER);
                    epoch.distribute.should.be.equal(0);
                    sBashFake.rebase.should.not.have.been.called;
                    distributorFake.distribute.should.not.have.been.called;
                });
            });

            describe("second epoch", async () => {
                beforeEach(async () => {
                    const currentBlockTime = await getCurrentBlockTime();
                    let futureBlockTime = currentBlockTime + (EPOCH_LENGTH * 2);
                    await advanceBlockTime(futureBlockTime);
                    await staking.connect(alice).stake(amount, alice.address, { gasLimit: 10000000 }); // gasLimit needed otherwise call counts are inaccurate
                });

                it("updates epoch number", async () => {
                    const epoch = await staking.connect(owner).epoch();
                    epoch.number.should.be.equal(EPOCH_NUMBER + 1);
                });
    
                it("sets next epoch time", async () => {
                    const epoch = await staking.connect(owner).epoch();
                    epoch.endTime.should.be.greaterThanOrEqual(FUTURE_END_TIME + EPOCH_LENGTH);
                });
    
                it("sets epoch's next distribute to difference between bash in staking and circulating supply of sbash", async () => {
                    // circulating supply of sbash is bash not held by the staking contract
                    const epoch = await staking.connect(owner).epoch();
                    epoch.distribute.should.be.equal(stakedBash - circulatingSupply);
                });
    
                it("uses bash balanceOf", async () => {
                    expect(bashFake.balanceOf).to.be.calledWith(staking.address);
                });
    
                it("uses sbash circulating supply", async () => {
                    expect(sBashFake.circulatingSupply).to.be.called;
                });
                
                it("distributes current epoch's distribution", async () => {
                    expect(distributorFake.distribute).to.be.called;
                });
    
                it("rebases sBash with epoch distribute", async () => {
                    // call again to force rebase to update epoch distribute
                    let futureBlockTime = await getCurrentBlockTime() + EPOCH_LENGTH;
                    await advanceBlockTime(futureBlockTime);
                    await staking.connect(alice).stake(amount, alice.address, { gasLimit: 10000000 });     
                    // epoch.distribute, epoch.number
                    // epoch distribute would be difference from last rebase
                    expect(sBashFake.rebase).to.have.been.calledTwice;
                    expect(sBashFake.rebase.atCall(0)).to.have.been.calledWith(0, EPOCH_NUMBER);
                    expect(sBashFake.rebase.atCall(1)).to.have.been.calledWith(stakedBash - circulatingSupply, EPOCH_NUMBER + 1);
                });
            });
        });

        describe("claim", () => {
            async function createClaim(wallet: SignerWithAddress, amount: number, gons: number) {
                const rebasing = true;
                const claim = false;
                bashFake.transferFrom
                    .whenCalledWith(alice.address, staking.address, amount)
                    .returns(true);
                sBashFake.gonsForBalance.whenCalledWith(amount).returns(gons);
                sBashFake.transfer.whenCalledWith(stakingWarmupFake.address, amount).returns(true);
                await staking.connect(wallet).stake(amount, wallet.address);//wallet.address, amount, rebasing, claim);
            }

            it("transfers sOHM instantly when when warmup period is zero", async () => {
                const amount = 1000;
                const gons = 10;
                await createClaim(alice, amount, gons);

                sBashFake.transfer.whenCalledWith(alice.address, amount).returns(true);
                sBashFake.balanceForGons.whenCalledWith(gons).returns(amount);
                stakingWarmupFake.retrieve.whenCalledWith(alice.address, gons).returns(true);
                await staking.connect(alice).claim(alice.address); // , true);

                // expect(await staking.supplyInWarmup()).to.equal(0);
                expect(stakingWarmupFake.retrieve)
                    .to.have.been.calledWith(
                        alice.address,
                        amount
                    );
            });
            
            it("does nothing when the warmup isn't over", async () => {
                await staking.connect(owner).setWarmup(2);
                await createClaim(alice, 1000, 10);

                await staking.connect(alice).claim(alice.address);

                // expect(sBashFake.transfer).to.not.have.been.called;  // in v1, there's always transfer
                expect(stakingWarmupFake.retrieve).to.not.have.been.called;
                // expect(gOHMFake.mint).to.not.have.been.called;
            });

            it("bug?: allows claim of external account", async () => {
                const amount = 1000;
                const gons = 10;

                await createClaim(alice, amount, gons);
                sBashFake.transfer.whenCalledWith(alice.address, amount).returns(true);
                sBashFake.balanceForGons.whenCalledWith(gons).returns(amount);
                stakingWarmupFake.retrieve.whenCalledWith(alice.address, gons).returns(true);

                await staking.connect(other).claim(alice.address, { gasLimit: 100000 });
                stakingWarmupFake.retrieve.should.have.been.calledWith(alice.address, amount);
                // await expect(staking.connect(alice).claim(bob.address, false)).to.be.revertedWith(
                //     "External claims for account are locked"
                // );
            });
        });

        describe("unstake", () => {
            it("can redeem sOHM for OHM", async () => {
                const amount = 1000;
                const rebasing = true;
                // const claim = true;

                bashFake.transferFrom.returns(true);
                bashFake.balanceOf.returns(amount);
                sBashFake.transfer.returns(true);
                await staking.connect(alice).stake(amount, alice.address);

                sBashFake.transferFrom.returns(true);
                bashFake.transfer.returns(true);
                await staking.connect(alice).unstake(amount, rebasing);

                expect(sBashFake.transferFrom).to.be.calledWith(
                    alice.address,
                    staking.address,
                    amount
                );
                expect(bashFake.transfer).to.be.calledWith(alice.address, amount);
            });
        });

        describe("forfeit", () => {
            let amount: number;
            let gons: number;

            beforeEach(async () => {
                // alice has a claim
                amount = 1000;
                gons = 10;
                bashFake.transferFrom
                .whenCalledWith(alice.address, staking.address, amount)
                .returns(true);
                sBashFake.gonsForBalance.whenCalledWith(amount).returns(gons);
                sBashFake.balanceForGons.whenCalledWith(gons).returns(amount);
                sBashFake.transfer.whenCalledWith(stakingWarmupFake.address, amount).returns(true);

                await staking.connect(alice).stake(amount, alice.address);
            });

            it("removes stake from warmup and returns OHM", async () => {
                bashFake.transfer.returns(true);
                
                await staking.connect(alice).forfeit();

                expect(bashFake.transfer).to.be.calledWith(alice.address, amount);

                sBashFake.balanceForGons.whenCalledWith(0).returns(0);

                stakingWarmupFake.retrieve.should.have.been.calledWith(staking.address, amount);
                bashFake.transfer.should.have.been.calledWith(alice.address, amount);
                // expect(await staking.supplyInWarmup()).to.equal(0);
            });

            it("transfers zero if there is no balance in warmup", async () => {
                bashFake.transfer.returns(true);

                await staking.connect(bob).forfeit();

                expect(bashFake.transfer).to.be.calledWith(bob.address, 0);
            });
        });
        

        //     it("mints gOHM when rebasing is false", async () => {
        //         const indexedAmount = 10000;
        //         const amount = 1000;
        //         const gons = 10;
        //         await createClaim(alice, amount, gons);

        //         gOHMFake.balanceTo.whenCalledWith(amount).returns(indexedAmount);
        //         sBashFake.balanceForGons.whenCalledWith(gons).returns(amount);

        //         await staking.connect(alice).claim(alice.address, false);

        //         expect(gOHMFake.mint).to.be.calledWith(alice.address, indexedAmount);

        //         sBashFake.balanceForGons.whenCalledWith(0).returns(0);
        //         expect(await staking.supplyInWarmup()).to.equal(0);
        //     });

        

        //     it("allows internal claims when locked", async () => {
        //         const amount = 1000;
        //         const gons = 10;
        //         await createClaim(alice, amount, gons);
        //         await staking.connect(alice).toggleLock();

        //         sBashFake.transfer.whenCalledWith(alice.address, amount).returns(true);
        //         sBashFake.balanceForGons.whenCalledWith(gons).returns(amount);

        //         await staking.connect(alice).claim(alice.address, true);

        //         sBashFake.balanceForGons.whenCalledWith(0).returns(0);
        //         expect(await staking.supplyInWarmup()).to.equal(0);
        //     });

        //     it("does nothing when there is nothing to claim", async () => {
        //         await staking.connect(bob).claim(bob.address, true);

        //         expect(sBashFake.transfer).to.not.have.been.called;
        //         expect(gOHMFake.mint).to.not.have.been.called;
        //     });

       

        

        

        //     it("can redeem gOHM for OHM", async () => {
        //         const amount = 1000;
        //         const indexedAmount = 10000;
        //         const rebasing = false;
        //         const claim = true;

        //         bashFake.transferFrom.returns(true);
        //         await staking.connect(alice).stake(alice.address, amount, rebasing, claim);

        //         gOHMFake.balanceFrom.whenCalledWith(indexedAmount).returns(amount);
        //         bashFake.transfer.returns(true);
        //         bashFake.balanceOf.returns(amount);
        //         await staking.connect(alice).unstake(alice.address, indexedAmount, false, rebasing);

        //         expect(bashFake.transfer).to.be.calledWith(alice.address, amount);
        //         expect(gOHMFake.burn).to.be.calledWith(alice.address, indexedAmount);
        //     });
        // });

        // describe("wrap", () => {
        //     it("converts sOHM into gOHM", async () => {
        //         const amount = 1000;
        //         const indexedAmount = 10000;

        //         gOHMFake.balanceTo.whenCalledWith(amount).returns(indexedAmount);
        //         sBashFake.transferFrom.returns(true);

        //         await staking.connect(alice).wrap(alice.address, amount);

        //         expect(gOHMFake.mint).to.be.calledWith(alice.address, indexedAmount);
        //         expect(sBashFake.transferFrom).to.be.calledWith(
        //             alice.address,
        //             staking.address,
        //             amount
        //         );
        //     });
        // });

        // describe("unwrap", () => {
        //     it("converts gOHM into sOHM", async () => {
        //         const amount = 1000;
        //         const indexedAmount = 10000;

        //         gOHMFake.balanceFrom.whenCalledWith(indexedAmount).returns(amount);
        //         sBashFake.transfer.returns(true);

        //         await staking.connect(alice).unwrap(alice.address, indexedAmount);

        //         expect(gOHMFake.burn).to.be.calledWith(alice.address, indexedAmount);
        //         expect(sBashFake.transfer).to.be.calledWith(alice.address, amount);
        //     });
        // });
    });
});


