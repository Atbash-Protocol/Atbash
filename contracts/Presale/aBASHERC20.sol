//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract aBASHERC20 is ERC20 {
    constructor(uint initialSupply)  ERC20 ("aBASH", "aBASH") {
        _mint(msg.sender, initialSupply);
    }
}