import { Network } from "hardhat/types";
import * as readline from "readline";
import { isLiveNetwork, isLiveNetworkButNotFork } from "./network";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const prompt = (query: string) => new Promise((resolve) => rl.question(query, resolve));

export async function liveNetworkConfirm(network: Network, question: string) {
    // treat forks like actual networks so there is behavior parity
    if (!isLiveNetwork(network)) {
        console.log(`Skipping prompt: ${question} [y/N]`);
        return;
    }
    const ans = await prompt(`${question} [y/N]: `) as string;
    if (ans.toLowerCase() == 'y') {
        // rl.close();  // causes issues for next question (probably because rl is global)
        return;
    }

    // rl.close();
    throw "User cancelled deployment";
}

