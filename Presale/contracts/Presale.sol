//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Presale is Ownable {
    using SafeMath for uint256;

    event Bought (
        address buyer,
        uint256 amount
    );

     address private _token;

     uint256 private _rate;

     address private beneficiary;

    constructor(address beneficiary_) {
        beneficiary = beneficiary_;
    }

    function setPresaleToken(address token_) public onlyOwner {
        _token = token_;
    }

    function presaleToken() public view returns (address) {
        return _token;
    }

    function setRate(uint256 rate_) public onlyOwner {
        _rate = rate_;
    }

    function removeERC20(address tokenAddress) public onlyOwner {
        require(IERC20(tokenAddress).transfer(msg.sender, IERC20(tokenAddress).balanceOf(address(this))), "FAIL");
    }

    function removeETH() public payable onlyOwner {
        require(payable(msg.sender).send(address(this).balance), "FAIL");
    }

    function rate() public  view returns (uint256) {
        return _rate;
    }

    function tokensLeft() public view returns (uint256) {
        return IERC20(_token).balanceOf(address(this));
    }

    function buyTokens(uint256 payableAmount, address buyer) internal {
        uint256 tokensToReceive = payableAmount.mul(_rate);

        IERC20 tokenToSale = IERC20(_token);

        require(tokensToReceive >= tokenToSale.balanceOf(address(this)),  "Not enough tokens to sale");

        require(tokenToSale.transfer(buyer, tokensToReceive), "Failed to transfer tokens");

        payable(beneficiary).transfer(payableAmount);

        emit Bought(buyer, tokensToReceive);

    }

    receive() external payable {
        buyTokens(msg.value, msg.sender);
    }




}
