import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import chai, { expect } from "chai";
import { ethers, network } from "hardhat";
import { FakeContract, smock } from "@defi-wonderland/smock";
import {
    IDai,
    ATBASHBondingCalculator__factory,
    IBash,
    IUniswapV2Pair,
} from "../../types";
import { getCurrentBlockTime, advanceBlockTime } from "../utils/blocktime";
import { CONTRACTS, MANAGING, ZERO_ADDRESS } from "../../scripts/constants";
import { BigNumber } from "ethers";

chai.should();
chai.use(smock.matchers);

const BASH_DECIMALS = 1;
const DAI_DECIMALS = (BASH_DECIMALS * 2).toFixed();
const BASHDAI_DECIMALS = DAI_DECIMALS;

describe("AtbashBondingCalculator", () => {
    let owner: SignerWithAddress;
    let depositor: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let other: SignerWithAddress;
    
    let bashFake: FakeContract<IBash>;
    let bashDaiFake: FakeContract<IUniswapV2Pair>;
    let daiFake: FakeContract<IDai>;

    beforeEach(async () => {
        [owner, alice, bob, other, depositor] = await ethers.getSigners();
        bashFake = await smock.fake<IBash>("IBash");
        bashDaiFake = await smock.fake<IUniswapV2Pair>("IUniswapV2Pair");
        daiFake = await smock.fake<IDai>("IDai");
    });

    describe("construction", () => {
        it("can be constructed", async () => {
            const bondingCalculator = await new ATBASHBondingCalculator__factory(owner).deploy(
                bashFake.address
            );
            (await bondingCalculator.Bash()).should.be.equal(bashFake.address);
        });

        it("does not allow 0x0 Bash token address", async () => { 
            (new ATBASHBondingCalculator__factory(owner).deploy(
                ZERO_ADDRESS
            )).should.be.reverted;
        });
    });

    describe("markdown", () => {
        it("requires at least one token to be Bash", async () => {
            const bondingCalculator = await new ATBASHBondingCalculator__factory(owner).deploy(
                bashFake.address
            );
            bashDaiFake.getReserves.returns([100, 100, 1234]);
            bashDaiFake.token0.returns("0xdeadc0ffee000000000000000000000000000001");
            bashDaiFake.token1.returns("0xdeadc0ffee000000000000000000000000000002");
            bondingCalculator.markdown(bashDaiFake.address).should.be.revertedWith("Pair missing Bash");
        });

        it("calculates markdown", async () => {
            const bondingCalculator = await new ATBASHBondingCalculator__factory(owner).deploy(
                bashFake.address
            );

            const reserve0 = 100;
            const reserve1 = 8000;
            bashDaiFake.getReserves.returns([reserve0, reserve1, 1234]);
            bashDaiFake.totalSupply.returns(100);
            daiFake.decimals.returns(DAI_DECIMALS);
            bashFake.decimals.returns(BASH_DECIMALS);
            bashDaiFake.decimals.returns(BASHDAI_DECIMALS);
            bashDaiFake.token0.returns(bashFake.address);
            bashDaiFake.token1.returns(daiFake.address);

            const k  = await bondingCalculator.getKValue(bashDaiFake.address);
            const bashDecimals = Number(BASH_DECIMALS);
            const daiDecimals = Number(DAI_DECIMALS);
            const bashDaiDecimals = Number(BASHDAI_DECIMALS);
            const decimals = bashDecimals + daiDecimals - bashDaiDecimals;
            const expectedK = (reserve0 * reserve1) / (10 ** decimals);
            k.should.be.equal(expectedK);

            const totalValue = await bondingCalculator.getTotalValue(bashDaiFake.address);
            //totalValue.should.satisfy((num: BigNumber) => { const number = num.toNumber(); return number >= 62.5 && number <= 64.5; });
            totalValue.should.equal(Math.trunc(Math.sqrt(k.toNumber())) * 2); 
            const markdown = await bondingCalculator.markdown(bashDaiFake.address);

            // todo: markdown equals
            const expectedMarkdown = BigNumber.from(reserve1).mul(BigNumber.from(10).pow(BASH_DECIMALS).mul(2)).div(totalValue);
            markdown.should.equal(expectedMarkdown);
            // markdown.should.satisfies((num : BigNumber) => { const number = num.toNumber(); return number >= 31.5 && number <= 31.7 });
        });
    });
});