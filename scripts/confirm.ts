import { Network } from "hardhat/types";
import * as readline from "readline";
import { isLiveMainnet } from "./network";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const prompt = (query: string) => new Promise((resolve) => rl.question(query, resolve));

export async function mainNetConfirm(network: Network, question: string) {
    if (!isLiveMainnet(network)) {
        console.log(`Skipping prompt: ${question} [y/N]`);
        return;
    }

    const ans = await prompt(`${question} [y/N]: `) as string;
    if (ans.toLowerCase() == 'y') {
        // rl.close();
        return;
    }

    // rl.close();
    throw "User cancelled deployment";
}

