import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers, network } from "hardhat";
import { isLiveNetwork, isLiveNetworkButNotFork, isLocalHardhatFork, isLocalTestingNetwork, isNotLocalHardhatFork, isNotLocalTestingNetwork } from '../../scripts/network'
import { HardhatNetworkAccountsUserConfig, Network } from 'hardhat/types';
import { hexStripZeros } from "ethers/lib/utils";
import chai, { expect } from "chai";

chai.should();

describe("utils/network", () => {
    let deployer: SignerWithAddress;

    beforeEach(async () => {
    });

    it("network statuses", async () => {
        
        let n: Network = network;

        // hardhat local, but not a fork
        n.live = false;
        n.name = "hardhat";
        isLiveNetwork(network).should.be.false;
        isLiveNetworkButNotFork(network).should.be.false;
        isNotLocalTestingNetwork(network).should.be.false;
        isLocalTestingNetwork(network).should.be.true;
        isLocalHardhatFork(network).should.be.false;
        isNotLocalHardhatFork(network).should.be.true;
        
        // mainnet but not fork
        n.live = true;
        n.name = "mainnet";
        isLiveNetwork(network).should.be.true;
        isLiveNetworkButNotFork(network).should.be.true;
        isNotLocalTestingNetwork(network).should.be.true;
        isLocalTestingNetwork(network).should.be.false;
        isLocalHardhatFork(network).should.be.false;
        isNotLocalHardhatFork(network).should.be.true;

        // hardhat but fork of another network
        n.live = true;
        n.name = "hardhat";
        isLiveNetwork(network).should.be.true;
        isLiveNetworkButNotFork(network).should.be.false;
        isNotLocalTestingNetwork(network).should.be.false;
        isLocalTestingNetwork(network).should.be.false;
        isLocalHardhatFork(network).should.be.true;
        isNotLocalHardhatFork(network).should.be.false;

        // localhost
        n.live = false;
        n.name = "localhost";
        isLiveNetwork(network).should.be.false;
        isLiveNetworkButNotFork(network).should.be.false;
        isNotLocalTestingNetwork(network).should.be.false;
        isLocalTestingNetwork(network).should.be.true;
        isLocalHardhatFork(network).should.be.false;
        isNotLocalHardhatFork(network).should.be.true;
    });
});
