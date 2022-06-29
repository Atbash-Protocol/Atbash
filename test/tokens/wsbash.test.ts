import { FakeContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

import {
    IsBash,
    WsBASH,
    WsBASH__factory,
} from "../../types";

describe("wsBash", () => {
    let deployer: SignerWithAddress;
    let vault: SignerWithAddress;
    let bob: SignerWithAddress;
    let alice: SignerWithAddress;
    let wsBash: WsBASH;
    let sbashFake: FakeContract<IsBash>;

    beforeEach(async () => {
        [deployer, vault, bob, alice] = await ethers.getSigners();
        sbashFake = await smock.fake<IsBash>("contracts/interfaces/IsBash.sol:IsBash");
        wsBash = await new WsBASH__factory(deployer).deploy(sbashFake.address);
    });

    it("correctly constructs an ERC20", async () => {
        expect(await wsBash.name()).to.equal("Wrapped sBASH");
        expect(await wsBash.symbol()).to.equal("wsBASH");
        expect(await wsBash.decimals()).to.equal(18);
        (await wsBash.sBash()).should.be.equal(sbashFake.address);
    });

    describe('wrap', () => { 
        it("uses index to calculate wsbash amount and mints wsbash", async () => {
            const amount = parseEther("100");
            const index = 2;
            const originalTotalSupply = await wsBash.totalSupply();

            sbashFake.index.returns(index);

            await wsBash.connect(bob).wrap(amount);

            sbashFake.transferFrom.should.be.calledWith(bob.address, wsBash.address, amount);

            // should mint to sender
            const decimals = BigNumber.from(10).pow(await wsBash.decimals());
            const mintExpected = BigNumber.from(amount).mul(decimals).div(index);
            (await wsBash.balanceOf(bob.address)).should.be.equal(mintExpected);
            (await wsBash.totalSupply()).should.be.equal(originalTotalSupply.add(mintExpected));
        });  
    });

    describe('unwrap', () => { 
        it("uses index to calculate wsbash amount and burns wsbash", async () => {
            const index = 2;
            sbashFake.index.returns(index);
            
            await wsBash.connect(bob).wrap(parseEther("100"));

            const amount = parseEther("50");
            const originalTotalSupply = await wsBash.totalSupply();
            const originalAmount = await wsBash.balanceOf(bob.address);

            await wsBash.connect(bob).unwrap(amount);

            // should mint to sender
            const decimals = BigNumber.from(10).pow(await wsBash.decimals());
            const sbashExpected = BigNumber.from(amount).mul(index).div(decimals);
            (await wsBash.balanceOf(bob.address)).should.be.equal(originalAmount.sub(amount));
            (await wsBash.totalSupply()).should.be.equal(originalTotalSupply.sub(amount));
            sbashFake.transfer.should.be.calledWith(bob.address, sbashExpected);
        });  
    });
});
