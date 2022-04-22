import { ethers, network } from "hardhat";

export async function getCurrentBlockTime() : Promise<number> {
    // getting timestamp
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    return blockBefore.timestamp;
}

export async function advanceBlockTime(future: number) {
    await network.provider.send("evm_setNextBlockTimestamp", [future]); //[FUTURE_END_TIME + 3600]);     // force the epoch
    await network.provider.send("evm_mine");
}