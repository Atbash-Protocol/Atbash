import React, { FC, useState, useCallback, useEffect } from 'react'
import { commonConfig } from '../config'
import { useEthers, useTokenBalance, useEtherBalance } from '@usedapp/core'
import { Row, Col, Form, Table, Container } from 'react-bootstrap'
import { ethers } from 'ethers'

export const PresaleHandler: FC<{}> = () => {

    const { account } = useEthers();
    const myBalance = useEtherBalance(account);

    const presaleBalance = useTokenBalance(commonConfig.bashTokenAddress, commonConfig.presaleContractAddress);
    const userBashBalance = useTokenBalance(commonConfig.bashTokenAddress, account);
    const [ethToSpent, setEthToSpent] = useState<string>('');
    const [bashToReceive, setBashToReceive] = useState<string>('');
    const [finalEthToSpent, setFinalEthToSpent] = useState<string>('');

    useEffect(() => {
        if (myBalance && parseFloat(ethers.utils.formatEther(myBalance)) <= parseFloat(ethToSpent)) {
            setFinalEthToSpent(parseFloat(ethers.utils.formatEther(myBalance)).toFixed(2));
        } else if (myBalance && parseFloat(ethers.utils.formatEther(myBalance)) > parseFloat(ethToSpent)) {
            setFinalEthToSpent(parseFloat(ethToSpent).toFixed(2));
        }

    }, [ethToSpent]);

    if (! account || !myBalance) {
        return  (<></>);
    }

    return (

        <>
            <Container className='mt-5'>
                <Row>

                    <Col sm={12} md={12}>
                        <Table className='table' bordered striped>
                            <tbody>
                                {presaleBalance && <>
                                    <tr><td><b>$BASH left</b></td> <td>{ethers.utils.formatUnits(presaleBalance, 18)}</td></tr>
                                    </>}

                                    {userBashBalance && <>
                                        <tr>
                                            <td>
                                                <b>Your $BASH</b>
                                            </td>
                                            <td>{ethers.utils.formatUnits(userBashBalance, 18)}</td></tr>
                                        </>}
                                    </tbody>
                        </Table>

                    </Col>
                        </Row>
                        <Row className="mt-3">
                            <Col sm={12} md={12}>
                                <Form.Group className="mt-3">
                                    <Form.Label>Amount ETH</Form.Label>
                                    <Form.Control type='number' max={parseFloat((ethers.utils.formatEther(myBalance))).toFixed(2)} onChange={(e) => setEthToSpent(e.target.value)} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Container>
                </>
                )
}