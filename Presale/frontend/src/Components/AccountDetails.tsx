import React, { FC } from 'react'
import { useEthers, useEtherBalance, shortenIfAddress } from '@usedapp/core'
import { utils } from 'ethers';

export const AccountDetails: FC<{}> = () => {
    const { account } = useEthers();
    const balance = useEtherBalance(account)

    if (!account || !balance) {
        return (
            <>
                Error connect wallet
            </>
        )
    }

    return (
        <>
            <p className='mt-3 text-right'>
                {shortenIfAddress(account)} <b>{parseFloat(utils.formatEther(balance)).toFixed(4)} ETH</b>
            </p>
        </>
    )
}