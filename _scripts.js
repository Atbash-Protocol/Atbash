#!/usr/bin/env node
'use strict';
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const {spawn} = require('child_process');
require('dotenv').config();

const commandlineArgs = process.argv.slice(2);

function parseArgs(rawArgs, numFixedArgs, expectedOptions) {
  const fixedArgs = [];
  const options = {};
  const extra = [];
  const alreadyCounted = {};
  for (let i = 0; i < rawArgs.length; i++) {
    const rawArg = rawArgs[i];
    if (rawArg.startsWith('--')) {
      const optionName = rawArg.slice(2);
      const optionDetected = expectedOptions[optionName];
      if (!alreadyCounted[optionName] && optionDetected) {
        alreadyCounted[optionName] = true;
        if (optionDetected === 'boolean') {
          options[optionName] = true;
        } else {
          i++;
          options[optionName] = rawArgs[i];
        }
      } else {
        if (fixedArgs.length < numFixedArgs) {
          throw new Error(
            `expected ${numFixedArgs} fixed args, got only ${fixedArgs.length}`
          );
        } else {
          extra.push(rawArg);
        }
      }
    } else {
      if (fixedArgs.length < numFixedArgs) {
        fixedArgs.push(rawArg);
      } else {
        // disabled: this requires options to be immediately after fixed args and before extra args
        // for (const opt of Object.keys(expectedOptions)) {
        //   alreadyCounted[opt] = true;
        // }
        extra.push(rawArg);
      }
    }
  }
  return {options, extra, fixedArgs};
}

function execute(command) {
  return new Promise((resolve, reject) => {
    const onExit = (error) => {
      if (error) {
        return reject(error);
      }
      resolve();
    };
    spawn(command.split(' ')[0], command.split(' ').slice(1), {
      stdio: 'inherit',
      shell: true,
    }).on('exit', onExit);
  });
}

function tee(options, network) {
  const name = network == "" 
          ? "deployments/deploy-log.txt" 
          : `deployments/${network}-deploy-log.txt`;
  return options["tee"] ? `| ntee ${name} -a` : "";  
}

async function performAction(rawArgs) {
  const firstArg = rawArgs[0];
  const args = rawArgs.slice(1);

  if (firstArg === 'run') {
    const {fixedArgs, extra, options} = parseArgs(args, 2, {tee: 'boolean'});
    await execute(
      `cross-env HARDHAT_DEPLOY_LOG=true HARDHAT_NETWORK=${
        fixedArgs[0]
      } ts-node --files ${fixedArgs[1]} ${extra.join(' ')} ${tee(options, fixedArgs[0])}`
    );
  } else if (firstArg == 'task') {
    const {fixedArgs, extra, options} = parseArgs(args, 2, {tee: 'boolean'});
    await execute(
      `cross-env HARDHAT_DEPLOY_LOG=true HARDHAT_NETWORK=${
        fixedArgs[0]
      } hardhat --network ${fixedArgs[0]} ${fixedArgs[1]} ${extra.join(' ')} ${tee(options, fixedArgs[0])}`
    );
  } else if (firstArg === 'deploy') {
    const {fixedArgs, extra, options} = parseArgs(args, 1, {tee: 'boolean'});
    await execute(
      `hardhat --network ${fixedArgs[0]} deploy --report-gas ${extra.join(' ')} ${tee(options, fixedArgs[0])}`
    );
  } else if (firstArg === 'export') {
    const {fixedArgs, extra, options} = parseArgs(args, 2, {tee: 'boolean'});
    await execute(
      `hardhat --network ${fixedArgs[0]} export --export ${fixedArgs[1]} ${tee(options, fixedArgs[0])}`
    );
  } else if (firstArg === 'fork:run') {
    const {fixedArgs, options, extra} = parseArgs(args, 2, {
      deploy: 'boolean',
      blockNumber: 'string',
      'no-impersonation': 'boolean',
      tee: 'boolean',
    });
    await execute(
      `cross-env ${
        options.deploy ? 'HARDHAT_DEPLOY_FIXTURE=true' : ''
      } HARDHAT_DEPLOY_LOG=true HARDHAT_FORK=${fixedArgs[0]} ${
        options.blockNumber ? `HARDHAT_FORK_NUMBER=${options.blockNumber}` : ''
      } ${
        options['no-impersonation']
          ? `HARDHAT_DEPLOY_NO_IMPERSONATION=true`
          : ''
      } ts-node --files ${fixedArgs[1]} ${extra.join(' ')} ${tee(options, fixedArgs[0])}`
    );
  } else if (firstArg === 'fork:deploy') {
    const {fixedArgs, options, extra} = parseArgs(args, 1, {
      blockNumber: 'string',
      'no-impersonation': 'boolean',
      tee: 'boolean',
    });
    const networkName = `${fixedArgs[0]}-forked`;
    await execute(
      `cross-env HARDHAT_FORK=${fixedArgs[0]} ${
        options.blockNumber ? `HARDHAT_FORK_NUMBER=${options.blockNumber}` : ''
      } ${
        options['no-impersonation']
          ? `HARDHAT_DEPLOY_NO_IMPERSONATION=true`
          : ''
      } hardhat deploy --report-gas ${extra.join(' ')} ${tee(options, networkName)}`
    );
  } else if (firstArg === 'fork:node') {
    const {fixedArgs, options, extra} = parseArgs(args, 1, {
      blockNumber: 'string',
      'no-impersonation': 'boolean',
      tee: 'boolean',
    });
    const networkName = `${fixedArgs[0]}-forked`;
    await execute(
      `cross-env HARDHAT_FORK=${fixedArgs[0]} ${
        options.blockNumber ? `HARDHAT_FORK_NUMBER=${options.blockNumber}` : ''
      } ${
        options['no-impersonation']
          ? `HARDHAT_DEPLOY_NO_IMPERSONATION=true`
          : ''
      } hardhat node ${extra.join(' ')} ${tee(options, networkName)}`
    );
  } else if (firstArg === 'fork:test') {
    const {fixedArgs, options, extra} = parseArgs(args, 1, {
      blockNumber: 'string',
      'no-impersonation': 'boolean',
    });
    await execute(
      `cross-env HARDHAT_FORK=${fixedArgs[0]} ${
        options.blockNumber ? `HARDHAT_FORK_NUMBER=${options.blockNumber}` : ''
      } ${
        options['no-impersonation']
          ? `HARDHAT_DEPLOY_NO_IMPERSONATION=true`
          : ''
      } HARDHAT_DEPLOY_FIXTURE=true HARDHAT_COMPILE=true mocha --bail --recursive test ${extra.join(
        ' '
      )}`
    );
  } else if (firstArg === 'fork:dev') {
    const {fixedArgs, options, extra} = parseArgs(args, 1, {
      blockNumber: 'string',
      'no-impersonation': 'boolean',
      tee: 'boolean',
    });
    const networkName = `${fixedArgs[0]}-forked`;
    await execute(
      `cross-env HARDHAT_FORK=${fixedArgs[0]} ${
        options.blockNumber ? `HARDHAT_FORK_NUMBER=${options.blockNumber}` : ''
      } ${
        options['no-impersonation']
          ? `HARDHAT_DEPLOY_NO_IMPERSONATION=true`
          : ''
      } hardhat node --watch --export contractsInfo.json ${extra.join(' ')} ${tee(options, networkName)}`
    );
  }
}

performAction(commandlineArgs);
