import 'dotenv/config';
import { HardhatNetworkAccountsUserConfig, Network } from 'hardhat/types';
export function node_url(networkName: string): string {
  if (networkName) {
    const uri = process.env['ETH_NODE_URI_' + networkName.toUpperCase()];
    if (uri && uri !== '') {
      return uri;
    }
  }

  if (networkName === 'localhost') {
    // do not use ETH_NODE_URI
    return 'http://localhost:8545';
  }

  let uri = process.env.ETH_NODE_URI;
  if (uri) {
    uri = uri.replace('{{networkName}}', networkName);
  }
  if (!uri || uri === '') {
    // throw new Error(`environment variable "ETH_NODE_URI" not configured `);
    return '';
  }
  if (uri.indexOf('{{') >= 0) {
    throw new Error(
      `invalid uri or network not supported by node provider : ${uri}`
    );
  }
  return uri;
}

export function getMnemonic(networkName?: string): string {
  if (networkName) {
    const mnemonic = process.env['MNEMONIC_' + networkName.toUpperCase()];
    if (mnemonic && mnemonic !== '') {
      return mnemonic;
    }
  }

  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic || mnemonic === '') {
    return 'test test test test test test test test test test test junk';
  }
  return mnemonic;
}

export function accounts(networkName?: string): {mnemonic: string} {
  return {mnemonic: getMnemonic(networkName)};
}

export function privateKey(networkName?: string): string[] | undefined {
  if (networkName) {
    const key = process.env['PRIVATEKEY_' + networkName.toUpperCase()];
    if (key && key !== '') {
      return [key];
    }
  }

  const key = process.env.PRIVATEKEY;
  if (!key || key === '') {
    return undefined;
  }
  return [key];
}

export function accountsForHardhat(networkName?: string): HardhatNetworkAccountsUserConfig | undefined {
  // for hardhat network, use default accounts
  if (networkName == undefined || networkName == "hardhat")
    return undefined;

  // otherwise get private key for the forked network
  const pks = privateKey(process.env.HARDHAT_FORK);
  if (pks != undefined) {
    return [
      { privateKey: pks[0], balance: "1000" + "000000000000000000" },
      { privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", balance: "1000" + "000000000000000000" }, // HH #1 - 0x70997970c51812dc3a010c7d01b50e0d17dc79c8
    ]; 
  }
  return undefined;
}

// live networked, could be forked
export function isLiveNetwork(network: Network): boolean {
  return network.live;
}

// a truly live network
export function isLiveNetworkButNotFork(network: Network): boolean {
  const name = network.name.toLowerCase();
  return network.live && (name != "hardhat" && name != "localhost");
}

// is a local hardhat, but forked network
export function isLocalHardhatFork(network: Network): boolean {
  return network.name.toLowerCase() == "hardhat" && network.live; 
}

// is not a forked local hardhat network
export function isNotLocalHardhatFork(network: Network): boolean {
  return !isLocalHardhatFork(network);
}

// live network or forked network
export function isNotLocalTestingNetwork(network: Network): boolean {
  var name = network.name.toLowerCase();
  return name != "hardhat" && name != "localhost";  // would this ever be !live even if in a test network?
}

// local hardhat, not a fork, not live
export function isLocalTestingNetwork(network: Network): boolean {
  const name = network.name.toLowerCase();
  return (name == "hardhat" || name == "localhost") && !network.live;
}