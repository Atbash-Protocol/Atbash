import React, { FC } from 'react'
import { useEthers } from '@usedapp/core'
import { PresaleHandler } from '../Components/PresaleHandler'
import { Socials } from '../Components/Socials'
import { ConnectWallet } from '../Components/ConnectWallet'

export const Main: FC<{}> = () => {
    const { account } = useEthers();


    return (
        <>

            {account && <PresaleHandler />}
            {!account && <ConnectWallet />}

            <Socials />
        </>
    )
}