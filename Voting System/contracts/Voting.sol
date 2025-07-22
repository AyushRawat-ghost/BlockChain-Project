// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./core/VotingCore.sol";

contract Voting is VotingCore {
    constructor(address admin_) VotingCore(admin_) {}
}