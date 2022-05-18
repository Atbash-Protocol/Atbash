import * as dotenv from "dotenv";
import { BigNumber } from "ethers";
dotenv.config();

export const CONTRACTS: Record<string, string> = {
    // Common
    DAI: "DAI",

    // Atbash
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
    bondDepository: "atbashBondDepository", // dai stable bond
    bashDaiBondDepository: "bashDaiBondDepository", // bash-dai LP bond
    bashDaiLpPair: "BashDaiUniswapPairV2", // uniswap pair
    
    // Supportive & Fixtures
    MockERC20: "MockERC20",
    WETH: "WETH",
    UniswapV2Factory: "UniswapV2Factory",
    UniswapV2Pair: "UniswapV2Pair",
    UniswapV2Router: "UniswapV2Router02"
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

// 25k worth of liquidity (25k DAI)
// 5k of bash (5k DAI) in reserve
export const INITIAL_DAI_RESERVES_AMOUNT = 5000;    //BigNumber.from("5000"); // 5k DAI
export const INITIAL_BASH_LIQUIDITY_IN_DAI = 25000;     // bash needed at deposit not including what's needed for LP
export const BASH_STARTING_MARKET_VALUE_IN_DAI = 80;    // 1 BASH:80 DAI

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

interface INetworkOptions {
    EPOCH_LENGTH_IN_SECONDS: number,
    FIRST_EPOCH_NUMBER: string,
    FIRST_EPOCH_TIME: number,
    NEXT_EPOCH_TIME: number,
    bondVestingLength: string,
}
export function getConfig(network: string) : INetworkOptions {
    switch (network) {
        case "hardhat":
            const epochLength = 60 * 10;
            return {
                EPOCH_LENGTH_IN_SECONDS: epochLength,
                FIRST_EPOCH_NUMBER,
                FIRST_EPOCH_TIME,
                NEXT_EPOCH_TIME: parseInt( JSON.stringify((date / 1000) + epochLength)),
                bondVestingLength: "600",   // 600s
            };
        default:
            return {
                EPOCH_LENGTH_IN_SECONDS,
                FIRST_EPOCH_NUMBER,
                FIRST_EPOCH_TIME,
                NEXT_EPOCH_TIME,
                bondVestingLength: "864000", // 10 days
            }
    }
    
}