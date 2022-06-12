//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import { console } from "hardhat/console.sol";

interface IERC20WithMetadata is IERC20, IERC20Metadata {}

contract PresaleRedemption {
    using SafeMath for uint256;

    IERC20WithMetadata public bash;
    IERC20WithMetadata public abash;
    address public presale;

    // todo: bool private active = false;

    // todo: event Redeemed(address ???, uint256 bashAmount);

    constructor(address abashAddress, address bashAddress, address presaleContractAddress) {
        require(abashAddress != address(0), "ABASH address");
        require(bashAddress != address(0), "BASH address");
        require(presaleContractAddress != address(0), "Atbash Presale address");

        abash = IERC20WithMetadata(abashAddress);
        bash = IERC20WithMetadata(bashAddress);
        presale = presaleContractAddress;
    }

    // amount in abash decimals
    function redeem(uint256 amount) public {    // todo: 
        require(amount > 0, "Invalid amount");

        // convert into bash decimals
        uint256 bashAmount = amount.mul(10 ** bash.decimals())
                                    .div(10 ** abash.decimals());

        require(bashAmount <= bash.balanceOf(address(this)), "Not enough funds to cover redemption");

        // todo: safe transfer?
        // abash.transfer(address(this), amount); 
        abash.transferFrom(msg.sender, address(this), amount);
        bash.transfer(msg.sender, bashAmount);

        // todo: emit event?
    }

    function remaining() public view returns (uint256 amount) {
        // todo: abash total supply - abash.balanceOf(this.address)
        amount = abash.totalSupply()
                    .sub(abash.balanceOf(presale))
                    .sub(abash.balanceOf(address(this)));
    }
}
