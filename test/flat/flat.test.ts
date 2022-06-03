import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import chai, { expect } from "chai";
// import * as chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { FakeContract, smock } from "@defi-wonderland/smock";

import {
    StakingRewards,
    StakingRewards__factory,
} from "../../types";

import {
    IERC20
} from "../../types/contracts/mockerc20.sol"

chai.use(smock.matchers);
// chai.use(chaiAsPromised.default);

describe("StakingRewardsFlat", () => {
    let deployer: SignerWithAddress;
    let owner: SignerWithAddress;
    let rewardsDistributionRecipient: SignerWithAddress;
    let bob: SignerWithAddress;
    let rewardsToken: FakeContract<IERC20>;
    let stakingToken: FakeContract<IERC20>;
    let stakingRewards: StakingRewards;

    beforeEach(async () => {
        [deployer, owner, rewardsDistributionRecipient, bob] = await ethers.getSigners();
        rewardsToken = await smock.fake<IERC20>("contracts/mockerc20.sol:IERC20");
        stakingToken = await smock.fake<IERC20>("contracts/mockerc20.sol:IERC20");
        stakingRewards = await new StakingRewards__factory(deployer)
                                .deploy(owner.address, 
                                        rewardsDistributionRecipient.address, 
                                        rewardsToken.address, 
                                        stakingToken.address);
        // bash = await new BASHERC20Token__factory(deployer).deploy();
        // bash.setVault(vault.address);
    });

    it("correctly constructs StakingRewardsFlat", async () => {
        expect(await stakingRewards.owner()).to.equal(owner.address);
        expect(await stakingRewards.totalSupply()).to.equal(0);
        expect(await stakingRewards.rewardPerToken()).to.equal(0);
        expect(await stakingRewards.getRewardForDuration()).to.equal(0);
        expect(await stakingRewards.lastTimeRewardApplicable()).to.equal(0);
        expect(await stakingRewards.earned(bob.address)).to.equal(0);
    });

    it("can't withdraw zero balance", async () => {
        await expect(stakingRewards.connect(bob).withdraw(100))
                .to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'SafeMath: subtraction overflow'");
    });

    it("can't stake zero ammount", async () => {
        await expect(stakingRewards.connect(bob).stake(0)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Cannot stake 0'");
    });

    it("gets no rewards at start", async () => {
        await stakingRewards.connect(bob).getReward();
        expect(await rewardsToken.balanceOf(bob.address)).to.equal(0);  // todo: not sure this really tests correctly since this is a fake
        // todo: no rewards given out yet
    });

    describe("staking", () => {
        const amount = 15;
        beforeEach(async() => { 
            stakingToken.transferFrom.returns(true);
            await stakingRewards.connect(bob).stake(amount);
        });
        it("transfers staking tokens to contract", async () => {
            stakingToken.transferFrom.atCall(0).calledWith(bob.address, stakingRewards.address, amount);
        });
        it('increases total supply', async () => {
            expect(await stakingRewards.totalSupply()).to.equal(amount);
        });
        it("adds to staker's account existing balance", async () => {
            expect(await stakingRewards.balanceOf(bob.address)).to.equal(amount);
        });

        it("gets no rewards at start", async () => {
            await stakingRewards.connect(bob).getReward();
            expect(await rewardsToken.balanceOf(bob.address)).to.equal(0);  // todo: not sure this really tests correctly since this is a fake
            // todo: no rewards given out yet
        });
    });

    describe("withdraw", () => {
        const amount = 15;
        
        beforeEach(async() => { 
            stakingToken.transferFrom.returns(true);
            stakingToken.transfer.returns(true);
            await stakingRewards.connect(bob).stake(amount);
            await stakingRewards.connect(bob).withdraw(amount);
        });
        it('decreases total supply', async () => {
            expect(await stakingRewards.totalSupply()).to.equal(0);
        });
        it("transfers staking tokens to staker's account", async () => {
            stakingToken.transfer.atCall(0).calledWith(bob.address, amount);
        });
        it("decreases staker's balance", async () => {
            expect(await stakingRewards.balanceOf(bob.address)).to.equal(0);
        });
    });

    // describe("mint", () => {
    //     it("must be done by vault", async () => {
    //         await expect(bash.connect(deployer).mint(bob.address, 100)).to.be.revertedWith(
    //             "VaultOwned: caller is not the Vault"
    //         );
    //     });

    //     it("increases total supply", async () => {
    //         const supplyBefore = await bash.totalSupply();
    //         await bash.connect(vault).mint(bob.address, 100);
    //         expect(supplyBefore.add(100)).to.equal(await bash.totalSupply());
    //     });
    // });

    // describe("burn", () => {
    //     beforeEach(async () => {
    //         await bash.connect(vault).mint(bob.address, 100);
    //     });

    //     it("reduces the total supply", async () => {
    //         const supplyBefore = await bash.totalSupply();
    //         await bash.connect(bob).burn(10);
    //         expect(supplyBefore.sub(10)).to.equal(await bash.totalSupply());
    //     });

    //     it("cannot exceed total supply", async () => {
    //         const supply = await bash.totalSupply();
    //         await expect(bash.connect(bob).burn(supply.add(1))).to.be.revertedWith(
    //             "ERC20: burn amount exceeds balance"
    //         );
    //     });

    //     it("cannot exceed bob's balance", async () => {
    //         await bash.connect(vault).mint(alice.address, 15);
    //         await expect(bash.connect(alice).burn(16)).to.be.revertedWith(
    //             "ERC20: burn amount exceeds balance"
    //         );
    //     });
    // });
});
