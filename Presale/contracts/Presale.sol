//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract Presale is Ownable {
    struct Buyer {
        address buyer;
        uint256 tokensBought;
        uint256 ethersSpent;
        uint256 lastActive;
        uint256 firstBuy;
    }

    constructor() {
        console.log(owner());
    }


}
