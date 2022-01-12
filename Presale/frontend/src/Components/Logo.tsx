import React, { FC } from 'react'

import LogoImage from './../Assets/logo.png'
export const Logo: FC<{ styleOverload?: {} }> = ({ styleOverload = { width: '44px' } }) => {
    return (
        <img src={LogoImage} alt="Atbash" style={styleOverload} />
    )
}