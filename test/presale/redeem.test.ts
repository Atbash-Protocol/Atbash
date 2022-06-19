const { deployments } = require('hardhat');
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import chai, { expect } from "chai";
import { ethers } from "hardhat";
const { BigNumber } = ethers;
import { FakeContract, smock } from "@defi-wonderland/smock";
import { CONTRACTS } from "../../scripts/constants";
import { IBash, IERC20WithMetadata, Presale, PresaleRedemption, PresaleRedemption__factory } from "../../types";
import { parseUnits } from "ethers/lib/utils";

chai.should();
chai.use(smock.matchers);

describe('Abash Presale Redeem', () => {
    let abashFake: FakeContract<IERC20WithMetadata>;
    let bashFake: FakeContract<IBash>;
    let presaleFake: FakeContract<Presale>;

    let owner: SignerWithAddress;
    let alice: SignerWithAddress;
    let other: SignerWithAddress;

    beforeEach(async() => {
        [owner, alice, other] = await ethers.getSigners();
        abashFake = await smock.fake<IERC20WithMetadata>(CONTRACTS.aBash);
        bashFake = await smock.fake<IBash>(CONTRACTS.bash);
        presaleFake = await smock.fake<Presale>(CONTRACTS.atbashPresale);
    });

    describe('construction', () => {
        it('constructs with treasury', async () => { 
            const presaleRedemption = 
                await new PresaleRedemption__factory(owner).deploy(
                    abashFake.address,
                    bashFake.address,
                    presaleFake.address
            );
            (await presaleRedemption.bash()).should.be.equal(bashFake.address);
            (await presaleRedemption.abash()).should.be.equal(abashFake.address);
            (await presaleRedemption.presale()).should.be.equal(presaleFake.address);
        });

        it('reverts when bash address not specified', async () => {
            await (new PresaleRedemption__factory(owner).deploy(
                abashFake.address,
                ethers.constants.AddressZero,
                presaleFake.address
            )).should.be.revertedWith("BASH address");
        });

        it('reverts when abash address not specified', async () => {
            await (new PresaleRedemption__factory(owner).deploy(
                ethers.constants.AddressZero,
                bashFake.address,
                presaleFake.address
            )).should.be.revertedWith("BASH address");
        });

        it('reverts when presale address not specified', async () => {
            await (new PresaleRedemption__factory(owner).deploy(
                abashFake.address,
                bashFake.address,
                ethers.constants.AddressZero
            )).should.be.revertedWith("Atbash Presale address");
        });
    });

    describe('remaining', () => {
        let presaleRedemption: PresaleRedemption;

        beforeEach(async function() {
            presaleRedemption = await new PresaleRedemption__factory(owner).deploy(
                abashFake.address,
                bashFake.address,
                presaleFake.address
            );
        });

        it('should be total supply minus presale left minus redeemed so far', async () => {
            const presaleABash = parseUnits("25000", 18);
            const totalABashSupply = parseUnits("100000", 18);
            const redeemedABash = parseUnits("10000", 18);
            abashFake.balanceOf.whenCalledWith(presaleFake.address).returns(presaleABash);
            abashFake.totalSupply.returns(totalABashSupply);
            abashFake.balanceOf.whenCalledWith(presaleRedemption.address).returns(redeemedABash);

            const remainingABash = await presaleRedemption.remaining();
            const expectedRemaining = totalABashSupply.sub(presaleABash).sub(redeemedABash);
            remainingABash.should.be.equal(expectedRemaining);
        });
    });

    describe('removeERC20', () => {
        let presaleRedemption: PresaleRedemption;

        beforeEach(async function() {
            presaleRedemption = await new PresaleRedemption__factory(owner).deploy(
                abashFake.address,
                bashFake.address,
                presaleFake.address
            );
        });

        it('should transfer balance of specified token to owner', async () => {
            const amount = 100;
            bashFake.balanceOf.whenCalledWith(presaleRedemption.address).returns(amount);
            bashFake.transfer.whenCalledWith(owner.address, amount).returns(amount);

            await presaleRedemption.connect(owner).removeERC20(bashFake.address);

            bashFake.balanceOf.should.be.called;
            bashFake.transfer.should.be.calledWith(owner.address, amount);
        });

        it('only called by owner', async () => {
            await (presaleRedemption.connect(alice).removeERC20(bashFake.address))
                    .should.be.reverted;
        });
    });

    describe('redeem', () => {
        let presaleRedemption: PresaleRedemption;

        beforeEach(async function() {
            presaleRedemption = await new PresaleRedemption__factory(owner).deploy(
                abashFake.address,
                bashFake.address,
                presaleFake.address
            );
        });

        it('transfers sender abash to redemption contract', async () => {
            const amount = parseUnits("5", 18);
            const bashTotalAmount = parseUnits("10", 9);

            bashFake.balanceOf.whenCalledWith(presaleRedemption.address).returns(bashTotalAmount);
            bashFake.decimals.returns(9);
            abashFake.decimals.returns(18);
            await presaleRedemption.connect(alice).redeem(amount);
            
            expect(abashFake.transferFrom)
                .to.have.been
                .calledWith(alice.address, presaleRedemption.address, amount);
        });

        it('sends equivalent bash to sender matching abash', async () => {
            const amount = parseUnits("5", 18);
            const amountInBash = amount.div(parseUnits("1", 9));    // in bash decimals
            const bashTotalAmount = parseUnits("10", 9);

            bashFake.balanceOf.whenCalledWith(presaleRedemption.address).returns(bashTotalAmount);
            bashFake.decimals.returns(9);
            abashFake.decimals.returns(18);

            await presaleRedemption.connect(alice).redeem(amount);
            
            expect(bashFake.transfer.atCall(0))
                .to.have.been
                .calledWith(alice.address, amountInBash);
        });

        it('should emit RedeemedEvent', async () => {
            const amount = parseUnits("5", 18);
            const amountInBash = amount.div(parseUnits("1", 9));    // in bash decimals
            const bashTotalAmount = parseUnits("10", 9);

            bashFake.balanceOf.whenCalledWith(presaleRedemption.address).returns(bashTotalAmount);
            bashFake.decimals.returns(9);
            abashFake.decimals.returns(18);
            
            expect(await presaleRedemption.connect(alice).redeem(amount))
                .to.emit(presaleRedemption, "Redeemed")
                .withArgs(alice.address, amountInBash, bashTotalAmount.sub(amountInBash));
        });

        it('reverts if redemption funds dont cover amount requested', async () => {
            bashFake.balanceOf.whenCalledWith(presaleRedemption.address).returns(1);
            const amountRequested = parseUnits("1", 18);
            
            await (presaleRedemption.connect(alice)
                .redeem(amountRequested))
                .should.be.revertedWith("Not enough funds to cover redemption");
        });

        it('reverts if amount requested is zero', async () => {
            await (presaleRedemption.connect(alice).redeem(0)).should.be.revertedWith("Invalid amount");
        });

        it('reverts if sender requests too much and fails transferFrom', async () => {
            const amount = parseUnits("5", 18);
            const bashTotalAmount = parseUnits("10", 9);

            bashFake.balanceOf.whenCalledWith(presaleRedemption.address).returns(bashTotalAmount);
            bashFake.decimals.returns(9);
            abashFake.decimals.returns(18);
            abashFake.transferFrom.whenCalledWith(alice.address, presaleRedemption.address, amount).reverts();

            await (presaleRedemption.connect(alice).redeem(amount))
                    .should.be.reverted;

            bashFake.transfer.should.not.be.called;
        });

        it('reverts if redemption bash transfer fails', async () => {
            const amount = parseUnits("5", 18);
            const amountInBash = amount.div(parseUnits("1", 9));    // in bash decimals
            const bashTotalAmount = parseUnits("10", 9);

            bashFake.balanceOf.whenCalledWith(presaleRedemption.address).returns(bashTotalAmount);
            bashFake.decimals.returns(9);
            abashFake.decimals.returns(18);
            abashFake.transferFrom.whenCalledWith(alice.address, presaleRedemption.address, amount).reverts;
            bashFake.transfer.whenCalledWith(alice.address, amountInBash).reverts();

            await (presaleRedemption.connect(alice).redeem(amount))
                    .should.be.reverted;
            abashFake.transferFrom.should.be.called;
        });
    });
});