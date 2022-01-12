import React, { FC } from 'react'
import { Navbar, Container, Nav } from 'react-bootstrap';
import { Logo } from './Logo'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faNewspaper, faSearch, faWallet } from '@fortawesome/free-solid-svg-icons';
import { useEthers, useEtherBalance, shortenIfAddress } from '@usedapp/core';
import { utils } from 'ethers';

export const Header: FC<{}> = () => {
    const { activateBrowserWallet, account } = useEthers();
    const balance = useEtherBalance(account)
    const whitePaperLink = 'https://7472c55f-22cf-4fb7-98a0-52b310acbf0c.usrfiles.com/ugd/7472c5_b7acc8f3ec244f94a87826f46344a713.pdf';
    const etherscanLink = 'https://etherscan.io/token/0x56028c51945106a47ecd68258f794a5f9b98d9a6';

    return (
        <>
            <Navbar collapseOnSelect expand="lg" variant="light" id='mainNav'>
                <Container>
                    <Logo />
                    <Navbar.Brand className='atbash-navbar-brand ml-3' href="#">ATBASH.PROTOCOL</Navbar.Brand>
                    <Navbar.Toggle aria-controls="responsive-navbar-nav">
                        <FontAwesomeIcon icon={faBars} />
                    </Navbar.Toggle>
                    <Navbar.Collapse id="responsive-navbar-nav">
                        <Nav className="ml-auto">
                            <Nav.Link href={whitePaperLink} target={'_blank'}>
                                <FontAwesomeIcon icon={faNewspaper} /> Whitepaper
                            </Nav.Link>
                            <Nav.Link href={etherscanLink} target={'_blank'}>
                                <FontAwesomeIcon icon={faSearch} /> Etherscan
                            </Nav.Link>
                        </Nav>
                        <Nav>
                            {!account && <>
                                <Nav.Link onClick={() => activateBrowserWallet()}>
                                    <FontAwesomeIcon icon={faWallet} /> Connect Wallet
                                </Nav.Link>
                            </>}
                            {(account && balance) && <>
                                <Nav.Link href="">
                                    <FontAwesomeIcon icon={faWallet} /> {shortenIfAddress(account)} <b>
                                        {parseFloat(utils.formatEther(balance)).toFixed(4)} ETH
                                    </b>
                                </Nav.Link>
                            </>}

                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </>
    );
}