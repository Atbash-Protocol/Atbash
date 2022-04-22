//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";
contract Presale is Ownable {
    using SafeMath for uint256;


    address private _token = address(0);

    uint8 private _tokenDecimals = 18;

    uint256 private _rate = 0;

    address private beneficiary;

    bool private active = true;

    constructor(address beneficiary_) {
        beneficiary = beneficiary_;
        console.log("contract ctor");
    }

    function getTokenDecimals() public view returns(uint8) {
        console.log("getTokenDecimals");

        return _tokenDecimals;
    }

    function setTokenDecimals(uint8 newDecimals) public onlyOwner {
        console.log("setTokenDecimals");

        _tokenDecimals = newDecimals;
    }

    function setPresaleActive() public onlyOwner {
        console.log("setPresaleActive");

        active = !active;
    }

    function getPresaleStatus() public view returns (bool) {
        console.log("getPresaleStatus");

        return active;
    }

    function setPresaleToken(address token_) public onlyOwner {
        console.log("setPresaleToken");

        _token = token_;
    }

    function presaleToken() public view returns (address) {
        console.log("presaleToken");

        return _token;
    }

    function setRate(uint256 rate_) public onlyOwner {
        console.log("setRate");

        _rate = rate_;
    }

    function removeERC20(address tokenAddress) public onlyOwner {
        console.log("removeERC20");

        require(
            IERC20(tokenAddress).transfer(
                msg.sender,
                IERC20(tokenAddress).balanceOf(address(this))
            ),
            "FAIL"
        );
    }

    function removeETH() public payable onlyOwner {
        console.log("removeETH");

        require(payable(msg.sender).send(address(this).balance), "FAIL");
    }

    function rate() public view returns (uint256) {
        console.log("rate");
        
        return _rate;
    }

    function tokensLeft() public view returns (uint256) {
        console.log("tokensLeft");

        return IERC20(_token).balanceOf(address(this));
    }

    function buyTokens(uint256 payableAmount, address buyer) public {
        console.log("buyTokens");
        
        IERC20 tokenToSale = IERC20(_token);

        uint256 tokensToReceive = payableAmount.mul(_rate);
        // uint256 tokensToReceive = ((payableAmount / 10 ** 18) * _rate) * 10 ** _tokenDecimals;
        console.log("tokensToSale: ", tokenToSale.balanceOf(address(this)));

        require(
            tokenToSale.balanceOf(address(this)) >= tokensToReceive,
            "Not enough tokens to sale"
        );

        require(
            tokenToSale.transfer(buyer, tokensToReceive),
            "Failed to transfer tokens"
        );

        (bool success,) = payable(beneficiary).call{value: payableAmount}(""); 
        require(success);
    }

    receive() external payable {
        require(msg.value > 0, "You sent 0 ETH");
        require(active, "Presale is stopped");
        require(address(0) != _token, "Token not set");
        require(_rate > 0, "Rate could not be 0");
        buyTokens(msg.value, msg.sender);
    }
}
