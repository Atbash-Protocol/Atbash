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
    return [{privateKey: pks[0], balance: "1000" + "000000000000000000"}] 
  }
  return undefined;
}

// Mainnet but not a fork
export function isLiveMainnet(network: Network): boolean {
  return network.live && network.name.toLowerCase() == "mainnet";
}

export function isNotLocalTestingNetwork(network: Network): boolean {
  return network.live;
}

export function isLocalTestingNetwork(network: Network): boolean {
  return !network.live;
}

export function isLocalHardhatFork(network: Network): boolean {
  return network.name.toLowerCase() == "hardhat" && network.live; 
}

export function isNotLocalHardhatFork(network: Network): boolean {
  return !isLocalHardhatFork(network);
}
