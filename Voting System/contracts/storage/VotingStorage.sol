// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/ProposalLib.sol";

contract VotingStorage {
    using ProposalLib for ProposalLib.Proposal;
    ProposalLib.Proposal[] internal proposals;
}