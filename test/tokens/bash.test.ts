import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers } from "hardhat";

import {
    BASHERC20Token,
    BASHERC20Token__factory,
} from "../../types";

describe("BashTokenTest", () => {
    let deployer: SignerWithAddress;
    let vault: SignerWithAddress;
    let bob: SignerWithAddress;
    let alice: SignerWithAddress;
    let bash: BASHERC20Token;

    beforeEach(async () => {
        [deployer, vault, bob, alice] = await ethers.getSigners();

        bash = await new BASHERC20Token__factory(deployer).deploy();
        bash.setVault(vault.address);
    });

    it("correctly constructs an ERC20", async () => {
        expect(await bash.name()).to.equal("ATBASH");
        expect(await bash.symbol()).to.equal("BASH");
        expect(await bash.decimals()).to.equal(9);
    });

    describe("mint", () => {
        it("must be done by vault", async () => {
            await expect(bash.connect(deployer).mint(bob.address, 100)).to.be.revertedWith(
                "VaultOwned: caller is not the Vault"
            );
        });

        it("increases total supply", async () => {
            const supplyBefore = await bash.totalSupply();
            await bash.connect(vault).mint(bob.address, 100);
            expect(supplyBefore.add(100)).to.equal(await bash.totalSupply());
        });
    });

    describe("burn", () => {
        beforeEach(async () => {
            await bash.connect(vault).mint(bob.address, 100);
        });

        it("reduces the total supply", async () => {
            const supplyBefore = await bash.totalSupply();
            await bash.connect(bob).burn(10);
            expect(supplyBefore.sub(10)).to.equal(await bash.totalSupply());
        });

        it("cannot exceed total supply", async () => {
            const supply = await bash.totalSupply();
            await expect(bash.connect(bob).burn(supply.add(1))).to.be.revertedWith(
                "ERC20: burn amount exceeds balance"
            );
        });

        it("cannot exceed bob's balance", async () => {
            await bash.connect(vault).mint(alice.address, 15);
            await expect(bash.connect(alice).burn(16)).to.be.revertedWith(
                "ERC20: burn amount exceeds balance"
            );
        });
    });
});
