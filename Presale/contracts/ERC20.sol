//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";



contract ERC20Token is ERC20 {
    constructor(uint initialSupply)  ERC20 ("USD", "USD") {
        _mint(msg.sender, initialSupply);
    }

   function decimals() public view virtual override returns (uint8) {
        return 9;
    }
}