import * as dotenv from "dotenv";
dotenv.config();

export const CONTRACTS: Record<string, string> = {
    DAI: "DAI",
    MockERC20: "MockERC20",
    aBash: "aBASHERC20",
    atbashPresale: "Presale",
    bash: "BASHERC20Token",
    sBash: "sBASH",
    bondingCalculator: "ATBASHBondingCalculator",
    bashDaiBondingCalculator: "bashDaiBondingCalculator",
    treasury: "BashTreasury",
    stakingDistributor: "Distributor",
    staking: "ATBASHStaking", 
    stakingHelper: "StakingHelper",
    stakingWarmup: "StakingWarmup",
    wsBash: "wsBASH",
    bondDepository: "atbashBondDepository", // dai
    bashDaiBondDepository: "bashDaiBondDepository",
    bashDaiLpPair: "BashDaiUniswapPairV2",
};

// Constructor Arguments
export const TREASURY_TIMELOCK = 0;

const date = new Date().getTime();
// Constants
export const LARGE_APPROVAL = "100000000000000000000000000000000";
export const EPOCH_LENGTH_IN_SECONDS = 28800; // 60 * 10; // 28800 = 8 hours
export const FIRST_EPOCH_NUMBER = "0";
export const FIRST_EPOCH_TIME = parseInt(JSON.stringify(date / 1000) + EPOCH_LENGTH_IN_SECONDS); // in seconds - ohmv2: // export const FIRST_EPOCH_TIME = "1639430907";
export const INITIAL_REWARD_RATE = "4000";
export const INITIAL_INDEX = "1000000000"; // ohm "7675210820" // ohmv2: "45000000000";
export const INITIAL_MINT = "60000" + "0".repeat(18); // 60K deposit.
export const BOUNTY_AMOUNT = "100000000";
export const INITIAL_MINT_PROFIT = "1000000000000";
export const WARMUP_PERIOD = "0";
export const NEXT_EPOCH_TIME =  parseInt( JSON.stringify((date / 1000) + EPOCH_LENGTH_IN_SECONDS));
export const STAKING_REWARD_RATE = "5000";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export enum MANAGING { 
    RESERVEDEPOSITOR = 0, 
    RESERVESPENDER = 1, 
    RESERVETOKEN = 2, 
    RESERVEMANAGER = 3, 
    LIQUIDITYDEPOSITOR = 4, 
    LIQUIDITYTOKEN = 5, 
    LIQUIDITYMANAGER = 6, 
    DEBTOR = 7, 
    REWARDMANAGER = 8, 
    SBASH = 9 
}
