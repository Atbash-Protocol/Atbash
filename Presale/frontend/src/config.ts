import { Config, Ropsten, Mainnet } from "@usedapp/core"

export const commonConfig = {
    infuraKey: '254fc898c6c24be99475e8ec90ced016',
    presaleContractAddress: '0x611eD75e0153d966b5A51C4fdEbc4971d5d0F051',
    bashTokenAddress: '0x7629e1bebBA3b5a30bc4060846A2687F3A927715',
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


