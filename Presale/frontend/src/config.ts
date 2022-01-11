import { Config, Ropsten, Mainnet } from "@usedapp/core"

export const commonConfig = {
    infuraKey: '254fc898c6c24be99475e8ec90ced016',
    presaleContractAddress: '0x0b974fe4b9444cee781d49b2dc0a905df0c3e87a',
    bashTokenAddress: '0x6cba1c5ee414ef4326e6bb3208642d075f0f9570',
}

export const networksEth = {
    main: 1,
    ropsten: 3
}

export const walletConnectSettings =
{
    rpc: {
        1: `https://ropsten.infura.io/v3/${commonConfig.infuraKey}`,
        // 3: `https://ropsten.infura.io/v3/${commonConfig.infuraKey}`,
    },
    qrcode: true
};

export const config: Config = {
    readOnlyChainId: Ropsten.chainId,
    readOnlyUrls: {
        [Ropsten.chainId]: 'https://ropsten.infura.io/v3/254fc898c6c24be99475e8ec90ced016',
        [Mainnet.chainId]: 'https://mainnet.infura.io/v3/254fc898c6c24be99475e8ec90ced016',
    },
}


