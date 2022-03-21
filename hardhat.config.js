require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
//require('hardhat-contract-sizer');

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

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.10",
      },
      {
        version: "0.6.12",
      },
      {
        version: "0.7.5",
        settings: {optimizer: {
          enabled: true,
          runs: 200,
        },},
      },
    ],
  },
  networks: {
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/bMWoFoO8gCdu2av_08twsH8vqoW5ics6`,
      accounts:[''], 
    },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/uykTntpbG5i8zh6hNeqTBu2kB-HuAuYe`,
      accounts:[''], 
    },
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/jZ09IQNcG0-UiQkRLj1sWNcWhSKvdCxf`,
        accounts:[''], 
      }
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  /*contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    //only: [':ERC20$'],
  },*/
};
