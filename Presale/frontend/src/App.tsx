import React, { FC } from 'react';
import './App.scss';
import { Main } from './Views/Main'
// import {Logo} from './Components/Logo'
import { Container } from 'react-bootstrap';

export const App: FC<{}> = () => {
  return (
    <Container>
      <Main />
    </Container>
  )
};