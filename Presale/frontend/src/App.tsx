import React, { FC } from 'react';
import './App.scss';
import { Main } from './Views/Main'
// import {Logo} from './Components/Logo'
import { Container } from 'react-bootstrap';
import { Header } from './Components/Header';

export const App: FC<{}> = () => {
  return (
    <>
      <Header />
      <Container fluid>

        <Main />
      </Container>
    </>
  )
};