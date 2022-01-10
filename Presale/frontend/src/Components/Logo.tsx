import React, { FC } from 'react'

import LogoImage from './../Assets/logo.png'
export const Logo: FC<{ classNameImage?: string }> = ({ classNameImage = 'img-fluid' }) => {
    return (
        <img src={LogoImage} alt = "Atbash" style={{height: '75px', width: '75px'}}/>
    )
}