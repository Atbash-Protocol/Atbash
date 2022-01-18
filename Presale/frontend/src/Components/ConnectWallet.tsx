import React, { FC } from 'react'
import { ButtonGroup, Button, Card, Row, Col, Container } from 'react-bootstrap'
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
        <Container className='mt-3'>
            <Card>
                <Card.Header>
                    <h3>Connect Wallet</h3>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col sm={12} md={12}>
                            <Button className="btn-block" variant='warning' onClick={() => activateBrowserWallet()}>
                                Metamask
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    )
}