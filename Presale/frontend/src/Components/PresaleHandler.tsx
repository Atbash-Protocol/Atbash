import React, { FC, useState, useEffect } from 'react'
import { commonConfig } from '../config'
import { useEthers, useTokenBalance, useEtherBalance, useSendTransaction } from '@usedapp/core'
import { Row, Col, Form, Table, Container, Button } from 'react-bootstrap'
import { ethers } from 'ethers'

export const PresaleHandler: FC<{}> = () => {

    const { account } = useEthers();
    const myBalance = useEtherBalance(account);

    const presaleBalance = useTokenBalance(commonConfig.bashTokenAddress, commonConfig.presaleContractAddress);
    const userBashBalance = useTokenBalance(commonConfig.bashTokenAddress, account);
    const [ethToSpent, setEthToSpent] = useState<string>('');
    const [bashToReceive, setBashToReceive] = useState<string>('');
    const [buyButtonDisabled, setBuyButtonDisabled] = useState<boolean>(false);

    useEffect(() => {
        if (myBalance && parseFloat(ethers.utils.formatEther(myBalance)) <= parseFloat(ethToSpent)) {
            setEthToSpent(parseFloat(ethers.utils.formatEther(myBalance)).toFixed(2));
        }

    }, [ethToSpent, myBalance]);

    useEffect(() => {
        setBashToReceive(String(parseFloat((parseFloat(ethToSpent) * 50).toFixed(2))));
    }, [ethToSpent]);

    const { sendTransaction, state } = useSendTransaction({ transactionName: 'Buying $aBash' });

    useEffect(() => {
        if (state.status !== "Mining") {
            setBuyButtonDisabled(false);
        }
    }, [state]);

    const processBuyTheBestTokenInTheWorld = () => {

        sendTransaction({ to: commonConfig.presaleContractAddress, value: ethers.utils.parseEther(ethToSpent), gasLimit: 150000 });
        setBuyButtonDisabled(true);
    }

    if (!account || !myBalance) {
        return (<></>);
    }

    return (

        <>
            <Container className='mt-5'>
                <Row>

                    <Col sm={12} md={12}>
                        <Table className='table' bordered striped>
                            <tbody>
                                {presaleBalance && <>
                                    <tr>
                                        <td>
                                            $aBASH left
                                        </td>
                                        <td>
                                            {ethers.utils.formatUnits(presaleBalance, 18)}
                                        </td>
                                    </tr>
                                </>}

                                {userBashBalance && <>
                                    <tr>
                                        <td>
                                            Your $aBASH balance
                                        </td>
                                        <td>
                                            {ethers.utils.formatUnits(userBashBalance, 18)}
                                        </td>
                                    </tr>
                                </>}
                            </tbody>
                        </Table>

                    </Col>
                </Row>
                <Row className="mt-3">
                    <Col sm={12} md={12}>
                        <Form.Group className="mt-3">
                            <Form.Label>Amount ETH</Form.Label>
                            <Form.Control maxLength={7} type='number' value={ethToSpent} max={parseFloat((ethers.utils.formatEther(myBalance))).toFixed(2)} onChange={(e) => setEthToSpent(e.target.value)} />
                        </Form.Group>
                    </Col>
                </Row>
                {!isNaN(parseFloat(bashToReceive)) && <>
                    <Row className='mt-3'>
                        <Col md={12} sm={12}>
                            <div className='d-grid gap-2'>
                                <Button
                                    onClick={() => processBuyTheBestTokenInTheWorld()}
                                    variant='primary'
                                    disabled={buyButtonDisabled}
                                >Buy {bashToReceive} $aBASH
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </>}
            </Container>
        </>
    )
}