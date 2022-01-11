import React, { FC } from 'react'
import { ButtonGroup, Button } from 'react-bootstrap'
import { useEthers } from '@usedapp/core'
// import { WalletConnectConnector } from '@web3-react/walletconnect-connector'


// const wallet_connect: WalletConnectConnector = new WalletConnectConnector(walletConnectSettings)

export const ConnectWallet: FC<{}> = () => {
    const { activateBrowserWallet } = useEthers()
    // const activateWalletConnect = async () => {

    //     let res =  await activate(wallet_connect)
    //     console.log(res)
    //     return res;
    // }


    return (
        <>
            <ButtonGroup aria-label="Connect wallet" className="mt-2">
                <Button onClick={() => activateBrowserWallet()} variant="secondary">Metamask</Button>
                {/* <Button onClick={() => activateWalletConnect()} variant="secondary">WalletConnect</Button> */}
            </ButtonGroup>
        </>
    )
}