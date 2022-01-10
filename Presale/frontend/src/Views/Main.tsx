import React, { FC } from 'react'
import { Button, Col, Row } from 'react-bootstrap'
import { Logo } from '../Components/Logo'

export const Main: FC<{}> = () => {


    return (
      <>
        <Row>
            <Col sm={4} md={4}>
                <Logo/>
            </Col>
            <Col sm={6} md={6}>
                <h2 className='mt-2'>Atbash Protocol</h2>
            </Col>
            <Col sm={2} md = {2}>
                <Button variant='success'>
                    Connect wallet
                </Button>
            </Col>
        </Row>
      </>
    )
}