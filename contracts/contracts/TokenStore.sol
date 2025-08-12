// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./GameToken.sol";

contract TokenStore is Ownable, ReentrancyGuard {
    IERC20 public immutable usdt;
    GameToken public immutable gameToken;
    uint256 public immutable gtPerUsdt;

    event Purchase(address indexed buyer, uint256 usdtAmount, uint256 gtOut);

    constructor(
        address _usdt,
        address _gameToken,
        uint256 _gtPerUsdt
    ) Ownable(msg.sender) {
        usdt = IERC20(_usdt);
        gameToken = GameToken(_gameToken);
        gtPerUsdt = _gtPerUsdt;
    }

    function buy(uint256 usdtAmount) external nonReentrant {
        require(usdtAmount > 0, "Amount must be greater than 0");

        // Calculate GT to mint (USDT has 6 decimals, GT has 18 decimals)
        uint256 gtOut = (usdtAmount * gtPerUsdt) / 1e6;
        require(gtOut > 0, "Invalid conversion");

        // Pull USDT from buyer
        require(
            usdt.transferFrom(msg.sender, address(this), usdtAmount),
            "USDT transfer failed"
        );

        // Mint GT to buyer
        gameToken.mint(msg.sender, gtOut);

        emit Purchase(msg.sender, usdtAmount, gtOut);
    }

    function withdrawUSDT(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(amount > 0, "Amount must be greater than 0");
        require(
            usdt.transfer(to, amount),
            "USDT transfer failed"
        );
    }
}


