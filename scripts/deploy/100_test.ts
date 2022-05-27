import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
    BASH_STARTING_MARKET_VALUE_IN_DAI,
    CONTRACTS,
    INITIAL_BASH_LIQUIDITY_IN_DAI,
    INITIAL_DAI_RESERVES_AMOUNT,
} from "../constants";

import {
    BashTreasury__factory,
    DAI__factory,
    BASHERC20Token__factory,
    UniswapV2Pair__factory,
    UniswapV2Router02__factory,
    UniswapV2Factory__factory,
    ISwapRouter02__factory,
} from "../../types";
import { waitFor } from "../txHelper";
import { BigNumber, ethers, providers } from "ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";

import "../extensions";
import { liveNetworkConfirm } from "../confirm";
import { getCurrentBlockTime } from "../../test/utils/blocktime";

// import { ChainId, Token, WETH, Fetcher, Route, TradeType, Trade, TokenAmount, Percent, Currency } from '@uniswap/sdk'
import { Token, CurrencyAmount, TradeType, Percent } from "@uniswap/sdk-core";
import {
    AlphaRouter,
    ChainId
} from "@uniswap/smart-order-router";
import JSBI from "jsbi";
import { assert } from "chai";
import { isLocalTestingNetwork } from "../network";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    console.log(`live: ${hre.network.live}, network: ${hre.network.name}`);
    return;
    const daiDeployment = await deployments.get(CONTRACTS.DAI);

    const dai = await DAI__factory.connect(daiDeployment.address, signer);

    const uniswapRouterDeployment = await deployments.get(
        CONTRACTS.UniswapV2Router
    );
    const uniswapV2Router = await UniswapV2Router02__factory.connect(
        uniswapRouterDeployment.address,
        signer
    );
    const swapRouter02Deployment = await deployments.get("SwapRouter02");
    const uniswapFactoryDeployment = await deployments.get(
        CONTRACTS.UniswapV2Factory
    );
    const uniswapFactory = await UniswapV2Factory__factory.connect(
        uniswapFactoryDeployment.address,
        signer
    );

    const swapRouter02 = await ISwapRouter02__factory.connect(
        swapRouter02Deployment.address,
        signer
    );
    const path = [await uniswapV2Router.WETH(), daiDeployment.address]; // eth->dai
    const wethDeployment = await deployments.get("WETH");
    // assert(wethDeployment.address == await uniswapV2Router.WETH());
    var daiWanted2 = BigNumber.from("30312" + "500000000000000000"); // + "500000000000000000"); // todo use calculation
    const amountsIn = await uniswapV2Router.getAmountsIn(daiWanted2, path);
    const ethNeeded = amountsIn[0];
    const deadline2 = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time

    // v2 version - are equivalent, but don't work on Rinkeby due to overflow error
    // await uniswapV2Router.swapTokensForExactTokens(daiWanted2, ethNeeded, path, deployer, deadline2);
    // await swapRouter02.swapTokensForExactTokens(daiWanted2, ethNeeded, path, deployer, { value: ethNeeded });

    // v3 
    var result = await waitFor(
      swapRouter02.exactOutputSingle(
        {
          tokenIn: await uniswapV2Router.WETH(),
          tokenOut: daiDeployment.address,
          recipient: deployer,
          amountOut: daiWanted2,
          fee: 3000, // todo: how to determine this?
          amountInMaximum: ethNeeded, // how to calculate properly?
          sqrtPriceLimitX96: 0,
        },
        {
          value: ethNeeded,
        }
      )
    );

    // const router = new AlphaRouter({
    //   chainId: ChainId.RINKEBY,
    //   provider: ethers.provider,
    // });
    // const DAI = new Token(ChainId.RINKEBY, daiDeployment.address, 18, 'DAI', 'DAI Stablecoin');
    // const wethDeployment = await deployments.get("WETH");
    // const WETH = new Token(ChainId.RINKEBY, wethDeployment.address, 18, 'WETH', 'Wrapped ETH');
    // const test = 22;
    // const amountOut = '30312' + '5000000000000000000';
    // const daiAmount = CurrencyAmount.fromRawAmount(DAI, JSBI.BigInt(amountOut));
    // const route = await router.route(daiAmount, WETH, TradeType.EXACT_OUTPUT, {
    //     recipient: deployer,
    //     slippageTolerance: new Percent(25, 100),
    //     deadline: Math.floor(Date.now() / 1000 + 1800),
    // });

    // // route?.trade.routes[0].
    // console.log(`Quote Exact In: ${route?.quote.toFixed(2)}`);
    // console.log(`Gas Adjusted Quote In: ${route?.quoteGasAdjusted.toFixed(2)}`);
    // console.log(`Gas Used USD: ${route?.estimatedGasUsedUSD.toFixed(6)}`);

    // const transaction = {
    //   data: route?.methodParameters?.calldata,
    //   to: swapRouter02.address,
    //   value: BigNumber.from(route?.methodParameters?.value),
    //   from: deployer,
    //   gasPrice: BigNumber.from(route?.gasPriceWei),
    // };

    // await ethers.provider.call(transaction);


    // var r = await waitFor(
    //   swapRouter02.exactOutputSingle(
    //     {
    //       tokenIn: await uniswapRouter.WETH(),
    //       tokenOut: daiDeployment.address,
    //       recipient: deployer,
    //       amountOut: daiWanted2,
    //       fee: 3000, // how to calculate properly
    //       amountInMaximum: ethNeeded2, // how to calculate properly
    //       sqrtPriceLimitX96: 0,
    //     },
    //     {
    //       value: ethNeeded2,
    //     }
    //   )
    // );

    // Doesn't work well with forking
    // const trade = new Trade(route, new TokenAmount(DAI, amountOut), TradeType.EXACT_OUTPUT)

    // const slippageTolerance = new Percent('50', '10000') // 50 bips, or 0.50%

    // const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw // needs to be converted to e.g. hex
    // const test = BigNumber.from(amountOutMin.toString()).toHexString();
    // const to = deployer; // should be a checksummed recipient address
    // const deadline2 = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time
    // const value = BigNumber.from(trade.inputAmount.raw.toString()).toHexString(); // // needs to be converted to e.g. hex
    // const path2 = [WETH[DAI.chainId].address, DAI.address];
    // const uniswap = new ethers.Contract(
    //     uniswapRouterDeployment.address,
    //     ['function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)'],
    //     signer
    // );
    // const gasPrice = await ethers.provider.getGasPrice();
    // const tx = await uniswap.swapExactETHForTokens(
    //     test,
    //     path2,
    //     deployer,
    //     deadline2,
    //     {
    //         value: value,
    //         gasPrice: gasPrice.toHexString(),
    //         gasLimit: ethers.BigNumber.from(500000).toHexString()
    //     }
    // );
    // // await uniswapRouter.swapETHForExactTokens(test, path2, to, deadline2, { value: value });

    var daiBalance = await dai.balanceOf(deployer);
    var ethBalance = await ethers.provider.getBalance(deployer);
    console.log(
        `Swapped ETH for DAI, new deployer balance DAI: ${daiBalance.toEtherComma()}, ETH: ${ethBalance.toEtherComma()}`
    );

    console.log("test-100");
};

func.tags = ["test-math"];
func.skip = async (hre: HardhatRuntimeEnvironment) => isLocalTestingNetwork(hre.network);
export default func;
