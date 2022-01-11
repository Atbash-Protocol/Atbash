import React, { FC } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Logo } from '../Components/Logo'
import { ConnectWallet } from '../Components/ConnectWallet'
import { useEthers, useEtherBalance, useTokenBalance } from '@usedapp/core'

export const Main: FC<{}> = () => {
    const {account} = useEthers();


    return (
      <>
        <Row  className="mt-3">
            <Col sm={2} md={2}>
                <Logo/>
            </Col>
            <Col sm={5} md={5}>
                <h2 className='mt-2'>Atbash Protocol</h2>
            </Col>
            <Col sm={3} md = {3}>
                <ConnectWallet/>
            </Col>
        </Row>
      </>
    )
}