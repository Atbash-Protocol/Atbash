import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers } from "hardhat";
import { FakeContract, smock } from '@defi-wonderland/smock'

import {
    IStaking,
    IERC20,
    BASHERC20Token,
    BASHERC20Token__factory,
    SBASH,
    SBASH__factory,
    ITreasury,
} from '../../types';

const TOTAL_GONS = 5000000000000000;
const ZERO_ADDRESS = ethers.utils.getAddress("0x0000000000000000000000000000000000000000");

describe("sBash", () => {
    let initializer: SignerWithAddress;
    let treasury: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let bash: BASHERC20Token;
    let sBash: SBASH;
    let stakingFake: FakeContract<IStaking>;
    let treasuryFake: FakeContract<ITreasury>;

    beforeEach(async () => {
        [initializer, alice, bob] = await ethers.getSigners();
        stakingFake = await smock.fake<IStaking>('contracts/interfaces/IStaking.sol:IStaking'); // ohm v2
        // treasuryFake = await smock.fake<ITreasury>('ITreasury');ohm v2

        bash = await (new BASHERC20Token__factory(initializer)).deploy();
        sBash = await (new SBASH__factory(initializer)).deploy();
    });

    it("is constructed correctly", async () => {
        expect(await sBash.name()).to.equal("Staked ATBASH");
        expect(await sBash.symbol()).to.equal("sBASH");
        expect(await sBash.decimals()).to.equal(9);
    });

    describe("initialization", () => {
        describe("setIndex", () => {
            it("sets the index", async () => {
                await sBash.connect(initializer).setIndex(3);
                expect(await sBash.index()).to.equal(3);
            });

            it("must be done by the initializer", async () => {
                await expect(sBash.connect(alice).setIndex(3)).to.be.reverted;
            });

            it("cannot update the index if already set", async () => {
                await sBash.connect(initializer).setIndex(3);
                await expect(sBash.connect(initializer).setIndex(3)).to.be.reverted;
            });
        })

        describe("initialize", () => {
            it("assigns TOTAL_GONS to the stakingFake contract's balance", async () => {
                await sBash.connect(initializer).initialize(stakingFake.address);
                expect(await sBash.balanceOf(stakingFake.address)).to.equal(TOTAL_GONS);
            });

            it("emits Transfer event", async () => {
                await expect(sBash.connect(initializer).initialize(stakingFake.address)).
                    to.emit(sBash, "Transfer").withArgs(ZERO_ADDRESS, stakingFake.address, TOTAL_GONS);
            });

            it("emits LogStakingContractUpdated event", async () => {
                await expect(sBash.connect(initializer).initialize(stakingFake.address)).
                    to.emit(sBash, "LogStakingContractUpdated").withArgs(stakingFake.address);
            });

            it("unsets the initializer, so it cannot be called again", async () => {
                await sBash.connect(initializer).initialize(stakingFake.address);
                await expect(sBash.connect(initializer).initialize(stakingFake.address)).to.be.reverted;
            });
        });
    });
    describe("post-initialization", () => {
        beforeEach(async () => {
            await sBash.connect(initializer).setIndex(1);
            //   await sBash.connect(initializer).setgOHM(gOhmFake.address);
            await sBash.connect(initializer).initialize(stakingFake.address);
        });

        describe("approve", () => {
            it("sets the allowed value between sender and spender", async () => {
                await sBash.connect(alice).approve(bob.address, 10);
                expect(await sBash.allowance(alice.address, bob.address)).to.equal(10);
            });

            it("emits an Approval event", async () => {
                await expect(await sBash.connect(alice).approve(bob.address, 10)).
                    to.emit(sBash, "Approval").withArgs(alice.address, bob.address, 10);
            });
        });

        describe("increaseAllowance", () => {
            it("increases the allowance between sender and spender", async () => {
                await sBash.connect(alice).approve(bob.address, 10);
                await sBash.connect(alice).increaseAllowance(bob.address, 4);

                expect(await sBash.allowance(alice.address, bob.address)).to.equal(14);
            });

            it("emits an Approval event", async () => {
                await sBash.connect(alice).approve(bob.address, 10);
                await expect(await sBash.connect(alice).increaseAllowance(bob.address, 4)).
                    to.emit(sBash, "Approval").withArgs(alice.address, bob.address, 14);
            });
        });

        describe("decreaseAllowance", () => {
            it("decreases the allowance between sender and spender", async () => {
                await sBash.connect(alice).approve(bob.address, 10);
                await sBash.connect(alice).decreaseAllowance(bob.address, 4);

                expect(await sBash.allowance(alice.address, bob.address)).to.equal(6);
            });

            it("will not make the value negative", async () => {
                await sBash.connect(alice).approve(bob.address, 10);
                await sBash.connect(alice).decreaseAllowance(bob.address, 11);

                expect(await sBash.allowance(alice.address, bob.address)).to.equal(0);
            });

            it("emits an Approval event", async () => {
                await sBash.connect(alice).approve(bob.address, 10);
                await expect(await sBash.connect(alice).decreaseAllowance(bob.address, 4)).
                    to.emit(sBash, "Approval").withArgs(alice.address, bob.address, 6);
            });
        });

        describe("circulatingSupply", () => {
            it("is zero when all owned by stakingFake contract", async () => {
                // await stakingFake.supplyInWarmup.returns(0); // ohmv2
                // await gOhmFake.totalSupply.returns(0);
                // await gOhmFake.balanceFrom.returns(0);

                const totalSupply = await sBash.circulatingSupply();
                expect(totalSupply).to.equal(0);
            });

            /// v2ohm
            //   it("includes all supply owned by gOhmFake", async () => {
            //     // await stakingFake.supplyInWarmup.returns(0);
            //     // await gOhmFake.totalSupply.returns(10);
            //     // await gOhmFake.balanceFrom.returns(10);

            //     const totalSupply = await sBash.circulatingSupply();
            //     expect(totalSupply).to.equal(10);
            //   });


            //   it("includes all supply in warmup in stakingFake contract", async () => {
            //     await stakingFake.supplyInWarmup.returns(50);
            //     await gOhmFake.totalSupply.returns(0);
            //     await gOhmFake.balanceFrom.returns(0);

            //     const totalSupply = await sBash.circulatingSupply();
            //     expect(totalSupply).to.equal(50);
            //   });
        });
    });
});