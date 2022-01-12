import { faLink, faVoicemail } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { FC } from 'react';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';
import { socials } from '../config';

export const Socials: FC<{}> = () => {
    return (
        <Container className="mt-3">
            <Row>
                <Col sm={12} md={12}>
                    <Card>
                        <Card.Header>
                            <h3>Social Links</h3>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={6} sm={6}>
                                    <Button href={socials.discord} target='_blank' className='btn-block' variant='warning'>
                                        <FontAwesomeIcon icon={faLink} /> Discord
                                    </Button>
                                </Col>
                                <Col md={6} sm={6}>
                                    <Button href={socials.twitter} target='_blank' className='btn-block' variant='warning'>
                                        <FontAwesomeIcon icon={faLink} /> Twitter
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    )
}