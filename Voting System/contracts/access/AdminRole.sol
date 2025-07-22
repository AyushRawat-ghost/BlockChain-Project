// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Single‐admin via Ownable
abstract contract Adminable is Ownable {
    /// @dev Pass `admin_` into Ownable’s constructor
    constructor(address admin_) Ownable(admin_) {}

    modifier onlyAdmin() {
        require(owner() == msg.sender, "Adminable: caller is not admin");
        _;
    }
}