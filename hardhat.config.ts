import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-etherscan";
import "solidity-coverage";
import "hardhat-deploy";

import {node_url, accounts, privateKey, accountsForHardhat} from './scripts/network';

dotenv.config();

// While waiting for hardhat PR: https://github.com/nomiclabs/hardhat/pull/1542
if (process.env.HARDHAT_FORK) {
  process.env['HARDHAT_DEPLOY_FORK'] = process.env.HARDHAT_FORK;
}

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      {
        version: "0.8.10",
      },
      {
        version: "0.6.12",
      },
      {
        version: "0.6.6",
      },
      {
        version: "0.5.16"
      },
      {
        version: "0.7.6",
      },
      {
        version: "0.7.5",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        }
      },
      {
        version: "0.5.16"
      }
    ],
  },
  namedAccounts: {
    deployer: {
        default: 0,
        1: "0xd738E31Ed20F2701Db1a68841C6a7cAA8F6A6B43",
        4: "0x02c368c0787BB33ACAc698049CcA2454B5cC96c5"
    },
    testWallet: {
        default: 1,
        4: "0xd738E31Ed20F2701Db1a68841C6a7cAA8F6A6B43",  // rdr Main Wallet, used on Rinkeby for fixes
    }
    // daoMultisig: {
    //     // mainnet
    //     1: "0x245cc372C84B3645Bf0Ffe6538620B04a217988B",
    // },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
    deploy: "./scripts/deploy",
    deployments: "./deployments",
  },
  networks: {
    hardhat: {
      chainId: 1337,
      live: false,
      allowUnlimitedContractSize: true,
      // accounts: {},//privateKey(process.env.HARDHAT_FORK),
      accounts: accountsForHardhat(process.env.HARDHAT_FORK),  
      // process.env.HARDHAT_FORK will specify the network that the fork is made from.
      // this line ensure the use of the corresponding accounts (set by _script.js)
      forking: process.env.HARDHAT_FORK
        ? {
            // TODO once PR merged : network: process.env.HARDHAT_FORK,
            url: node_url(process.env.HARDHAT_FORK),
            blockNumber: process.env.HARDHAT_FORK_NUMBER
              ? parseInt(process.env.HARDHAT_FORK_NUMBER)
              : undefined,
          }
        : undefined,
    },
    localhost: {
      url: node_url('localhost'),
      accounts: privateKey(),  
    },
    ropsten: {
      url: node_url('ropsten'),
      accounts: privateKey('ropsten'),
    },
    rinkeby: {
      url: node_url('rinkeby'),
      accounts: privateKey('rinkeby'),
    },
    mainnet: {
      url: node_url('mainnet'),
      accounts: privateKey('mainnet'),
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  external: {
    deployments: {
      // hardhat: ["deployments/mainnet"],
      rinkeby: [],
    },
    contracts: [
      {
        artifacts: "node_modules/@uniswap/artifacts",
        deploy: "node_modules/@uniswap/contracts"
      },
    ],
  }
};

export default config;
