import { Network } from "hardhat/types";
import * as readline from "readline";
import { isLiveNetwork, isLiveNetworkButNotFork, isLocalHardhatFork } from "./network";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const prompt = (query: string) => new Promise((resolve) => rl.question(query, resolve));

function noPromptOption(): boolean {
    return process.env.NO_CONFIRM == "true";
}

export async function liveNetworkConfirm(network: Network, question: string) {
    // treat forks like actual networks so there is behavior parity
    if (!isLiveNetwork(network) || (isLocalHardhatFork(network) && noPromptOption())) {
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

