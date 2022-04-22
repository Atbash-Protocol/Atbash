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

**NOTE: 04/22/2022** Idempotency of rinkeby deploy has not been fully completed or tested, running these deployment tasks may end up changing treasury configuration or redeposit funds.  

**Local Hardhat**
Local deployment using hardhat network:
`yarn start`

Testing specific deployments for local hardhat
`yarn deploy:hardhat`

**Rinkeby**
Requires `.env` see `example.env` 

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
