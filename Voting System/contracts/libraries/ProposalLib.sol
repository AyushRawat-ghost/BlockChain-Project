// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library ProposalLib {
    enum Status { Pending, Active, Ended }

    struct Proposal {
        string title;
        string descriptionURI;
        string[] options;
        mapping(string => uint256) voteCounts;
        uint256 startTime;
        uint256 endTime;
        bool ended;
        mapping(address => bool) hasVoted;
    }


}