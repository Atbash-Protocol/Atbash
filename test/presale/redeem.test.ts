const { deployments } = require('hardhat');
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import chai, { expect } from "chai";
import { ethers, network } from "hardhat";
const { BigNumber } = ethers;
import { FakeContract, smock } from "@defi-wonderland/smock";
import { CONTRACTS } from "../../scripts/constants";
import { IBash, PresaleRedemption__factory } from "../../types";
import { Signer } from "ethers";

chai.should();
chai.use(smock.matchers);

describe('Abash Presale Redeem', () => {
    let bashFake: FakeContract<IBash>;

    let owner: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let other: SignerWithAddress;

    beforeEach(async() => {
        [owner, alice, bob, other] = await ethers.getSigners();
        bashFake = await smock.fake<IBash>("IBash");
    });

    describe('construction', () => {
        // bash as vault version
        it('constructs', async () => { 
            const presaleRedemption = await new PresaleRedemption__factory(owner).deploy(
                bashFake.address
            );
        });

        it('reverts when bash address not specified', async () => {
            (new PresaleRedemption__factory(owner).deploy(
                ethers.constants.AddressZero
            )).should.be.revertedWith("Specify BASH address");
        });

        // treasury version
        it('constructs with treasury', async () => { 
            // const presaleRedemption = await new PresaleRedemption__factory(owner).deploy(
            //     bashFake.address
            // );
        });

        it('reverts if atbash treasury not specified', async () => {

        });
    });

    describe('redeem', () => {
        // using treasury
        it('transfers sender abash to redemption contract', async () => {});
        it('deposits equiavalent DAI into treasury', async () => {});
        it('receives minted bash from treasury deposit', async () => {});
        it('sends equivalent bash to sender matching abash', async () => {});

        it('reverts if redemption funds are exhausted', async () => {});
        it('reverts if amount requested is zero', async () => {});
        it('reverts if amount provided is not abash', async () => {}); // todo: ? or is this auto determined by balanceOf


        // bypass vault
        it('mints equivalent bash for abash', async function () {
            // bashFake["mint(address,uint256)"]()
            // await deployments.fixture(['Token']);
            // const Token = await deployments.get(CONTRACTS.bash); // Token is available because the fixture was executed
            // console.log(Token.address);
        });
        it('transfers bash to sender', async () => { });
        it('rejects when zero abash provided', async () => { });
        it('burns/deposits abash to???', async () => { });
    });
});