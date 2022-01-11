import { Config, Ropsten, Mainnet } from "@usedapp/core"

export const commonConfig = {
    infuraKey: '254fc898c6c24be99475e8ec90ced016',
    presaleContractAddress: '0xE63756E2FD565eE33dd3329Dd676c5b6D78a4feE',
    bashTokenAddress: '0x56028c51945106a47ecd68258f794a5f9b98d9a6',
}

export const networksEth = {
    main: 1,
    ropsten: 3
}

export const walletConnectSettings =
{
    rpc: {
        1: `https://mainnet.infura.io/v3/${commonConfig.infuraKey}`,
        // 3: `https://ropsten.infura.io/v3/${commonConfig.infuraKey}`,
    },
    qrcode: true
};

export const config: Config = {
    readOnlyChainId: Mainnet.chainId,
    readOnlyUrls: {
        [Ropsten.chainId]: 'https://ropsten.infura.io/v3/254fc898c6c24be99475e8ec90ced016',
        [Mainnet.chainId]: 'https://mainnet.infura.io/v3/254fc898c6c24be99475e8ec90ced016',
    },
}

