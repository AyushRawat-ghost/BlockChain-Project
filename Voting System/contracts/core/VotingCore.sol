// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../storage/VotingStorage.sol";
import "../libraries/ProposalLib.sol";
import "../access/AdminRole.sol";

contract VotingCore is VotingStorage, Adminable {
    using ProposalLib for ProposalLib.Proposal;

    // ─── EVENTS ────────────────────────────────────────────────────────────────
    event ProposalCreated(
        uint256 indexed id,
        string title,
        string[] options,
        uint256 startTime,
        uint256 endTime
    );
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        string option
    );
    event VotingEnded(
        uint256 indexed proposalId,
        string winningOption
    );

    // ─── CONSTRUCTOR ──────────────────────────────────────────────────────────
    constructor(address admin_) Adminable(admin_) {}

    // ─── ADMIN ACTIONS ─────────────────────────────────────────────────────────

    /// @notice Create a proposal with multiple options and a time window
    function createProposal(
        string calldata title,
        string calldata descriptionURI,
        string[] calldata options,
        uint256 startTime,
        uint256 endTime
    ) external onlyAdmin {
        require(startTime < endTime, "Bad window");

        // 1) allocate new storage slot
        proposals.push();
        ProposalLib.Proposal storage p = proposals[proposals.length - 1];

        // 2) set scalar fields
        p.title = title;
        p.descriptionURI = descriptionURI;
        p.startTime = startTime;
        p.endTime = endTime;
        p.ended = false;

        // 3) copy each option into storage (cannot assign array directly)
        for (uint256 i = 0; i < options.length; i++) {
            p.options.push(options[i]);
        }

        emit ProposalCreated(
            proposals.length - 1,
            title,
            options,
            startTime,
            endTime
        );
    }

    function endVoting(uint256 id) external onlyAdmin {
        ProposalLib.Proposal storage p = proposals[id];
        require(!p.ended, "Already ended");
        p.ended = true;

        // find winner
        string memory winner = p.options[0];
        for (uint256 i = 1; i < p.options.length; i++) {
            string memory opt = p.options[i];
            if (p.voteCounts[opt] > p.voteCounts[winner]) {
                winner = opt;
            }
        }
        emit VotingEnded(id, winner);
    }

    // ─── USER ACTIONS ──────────────────────────────────────────────────────────

    function vote(uint256 id, string calldata option) external {
        ProposalLib.Proposal storage p = proposals[id];
        require(block.timestamp >= p.startTime, "Not started");
        require(block.timestamp <= p.endTime, "Ended");
        require(!p.ended, "Manually ended");
        require(!p.hasVoted[msg.sender], "Already voted");

        p.hasVoted[msg.sender] = true;
        p.voteCounts[option] += 1;
        emit VoteCast(msg.sender, id, option);
    }

    // ─── VIEW HELPERS ──────────────────────────────────────────────────────────

    function getProposalCount() external view returns (uint256) {
        return proposals.length;
    }

    function getProposal(uint256 id)
        external
        view
        returns (
            string memory title,
            string memory descriptionURI,
            string[] memory options,
            uint256 startTime,
            uint256 endTime,
            bool ended
        )
    {
        ProposalLib.Proposal storage p = proposals[id];
        return (p.title, p.descriptionURI, p.options, p.startTime, p.endTime, p.ended);
    }

    function getVoteCount(uint256 id, string calldata option)
        external
        view
        returns (uint256)
    {
        return proposals[id].voteCounts[option];
    }
}