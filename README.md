# Atbash Protocol

# Contracts 
## Setup

Install dependencies
`yarn install`

Compile contracts
`yarn compile` 

Update typechain (when adding/refactoring contracts)
`yarn typechain`

## Deployment

Uses [hardhat-deploy](https://www.npmjs.com/package/hardhat-deploy#migrating-existing-deployment-to-hardhat-deploy).  Current contract deployments for Rinkeby (and future networks) are stored in `deployments` folder for each network, so that contracts aren't redeployed.  

Recommended you run live deployments with `--tee` option to save the output of the deployment.  This will append to the deployment log in `deployments/`

**NOTE**: DO NOT CHANGE OR DELETE deployments folder for live networks unless you're absolutely sure you know what you're doing.

### Local Hardhat
Local hardhat deployments will use mock DAI and WETH
Local deployment using hardhat network, deploy and start a local network node

`yarn start`

Testing specific deployments for local hardhat

`yarn deploy:hardhat`

### Network Forks
Testing against a fork

`yarn fork:node <network>`

Forks are as close as possible to live networks
Forks will use real DAI
Swapping is completed through the forked Uniswap contracts


Testing a local fork, but with specific deployments

`yarn fork:node <network> --tags none`

`yarn fork:deploylocal --tags <tags>`


`fork:deploylocal` is a work around that overwrites the chainID with local network ID (due to a possible bug with hardhat-deploy which persists the ID of the forked network) 

### Live Networks
Requires `.env` see `example.env` 
Deployments/fixes specific to Rinkeby are in contracts/rinkeby

### Staged Deployments
Hardhat deploy has been configured to deploy to network in stages, if so desired.  This helps complex deployments to be completed in stages at the discretion of the deployer.  

First, before any major deployment, best to see if the accounts configured for your network (and log for later reference).
`yarn hardhat:task rinkeby accounts --tee`

The following tags are the major steps:

1. **Token**: Deploy all tokens Atbash related tokens, if not already deployed

`yarn deploy:rinkeby --tags Token --tee` 

2. **Treasury**: Deploy the Atbash treasury contracts

`yarn deploy:rinkeby --tags Treasury --tee` 

3. **PresaleRedemption**: Deploy the Presale Redemption

`yarn deploy:rinkeby --tags PresaleRedemption --tee`

4. **Staking**: Deploy all staking related contracts (helper, warmup, staking)

`yarn deploy:rinkeby --tags Staking --tee` 

5. **StableBond**: Deploy all contracts used for DAI stable bonds

`yarn deploy:rinkeby --tags StableBond --tee` 

6. **BashDaiBond**: Deploy all contracts used for the BASH-DAI liquidity pool bond

`yarn deploy:rinkeby --tags BashDaiBond --tee`

7.  **Launch**: Initializes all deployed contracts, deposits initial reserves, create necessary liquidity, for a fully working Atbash launch with the previously successfully deployed contracts.  This step forces idempotency.  Every substep in this stage has a unique ID so that it cannot be rerun accidentally.  This will give the deployer an opportunity to deal with issues that might arise in the middle of this stage, without having to worry about previously executed steps being executed erroneously again on retry.  If you need to force a step to run despite it already having been executed for the current chain, edit `.migrations` of the network's deployment.

`yarn deploy:rinkeby --tags Launch --tee`

NOTE: If you run any of these out of sequence, hardhat-deploy will execute the previous tags because they're dependencies.

You can also run the above staged scenario using a fork:
Start the local fork

`yarn fork:node <network> --tags none`

Use deploylocal to deploy against localhost, and specify a specific stage using the tag

`yarn fork:deploylocal --tags <tags>`

### Extra
Setup test wallets with BASH, DAI, and BASH-DAI LP
NOT recommended for live networks

`yarn fork:deploylocal --tags PostLaunchTesting`

After you have a node running locally, check balances of wallets configured for hardhat:

`yarn hardhat run --network localhost ./scripts/show-balances.ts`

## Testing

`yarn test`

VS Code?  Use the [Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter) extension.

## Old Deployment Notes ##
Deployement was refactored to use [hardhat-deploy](https://www.npmjs.com/package/hardhat-deploy#migrating-existing-deployment-to-hardhat-deploy) with task based steps.

`deploy.ts` is the most recent deployment used for Rinkeby.  It's fuckit.js refactored for typescript.

~~fuckit.js has been the main deploy script for testing~~

```
npm update

npx hardhat compile
npx hardhat run .\scripts\fuckit.js --network <localhost | network> 

npx hardhat run node
```
