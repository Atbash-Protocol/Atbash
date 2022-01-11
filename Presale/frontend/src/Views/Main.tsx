import React, { FC } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Logo } from '../Components/Logo'
import { ConnectWallet } from '../Components/ConnectWallet'
import { useEthers } from '@usedapp/core'
import { AccountDetails } from '../Components/AccountDetails'
import { PresaleHandler } from '../Components/PresaleHandler'

export const Main: FC<{}> = () => {
    const {account} = useEthers();


    return (
      <>
        <Row  className="mt-3">
            <Col sm={2} md={2}>
                <Logo/>
            </Col>
            <Col sm={5} md={5}>
                <h2 className='mt-2 text-center'>Atbash Protocol</h2>
            </Col>
            <Col sm={3} md = {3} className="text-right">
                {! account && <ConnectWallet/>}
                {account && <AccountDetails/>}
            </Col>
        </Row>
        
        <PresaleHandler/>

      </>
    )
}