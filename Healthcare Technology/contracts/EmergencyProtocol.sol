// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IDoctorRegistry {
    function isDoctor(address _addr) external view returns (bool);
    function getDoctorList() external view returns (address[] memory);
}

contract EmergencyProtocol is Ownable {
    IDoctorRegistry public doctorRegistry;
    
    struct Ticket {
        address patient;
        uint256 votesFor;
        bool isResolved;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Ticket) public tickets;
    uint256 public nextTicketId;

    event EmergencyRaised(uint256 indexed ticketId, address indexed patient);
    event VoteCast(uint256 indexed ticketId, address indexed doctor);
    event EmergencyResolved(uint256 indexed ticketId, address indexed patient);

    constructor(address _doctorRegistry) Ownable(msg.sender) {
        doctorRegistry = IDoctorRegistry(_doctorRegistry);
    }

    function raiseEmergency(address _patient) external onlyOwner {
        Ticket storage newTicket = tickets[nextTicketId];
        newTicket.patient = _patient;
        newTicket.isResolved = false;
        emit EmergencyRaised(nextTicketId, _patient);
        nextTicketId++;
    }

    function vote(uint256 _ticketId) external {
        require(doctorRegistry.isDoctor(msg.sender), "Only Doctors can vote");
        Ticket storage ticket = tickets[_ticketId];
        require(!ticket.isResolved, "Ticket already resolved");
        require(!ticket.hasVoted[msg.sender], "Already voted");

        ticket.hasVoted[msg.sender] = true;
        ticket.votesFor++;

        emit VoteCast(_ticketId, msg.sender);

        uint256 totalDocs = doctorRegistry.getDoctorList().length;
        
        // 2/3 math: votes * 3 >= total * 2
        if (ticket.votesFor * 3 >= totalDocs * 2) {
            ticket.isResolved = true;
            emit EmergencyResolved(_ticketId, ticket.patient);
        }
    }

    function isEmergencyAccessApproved(address _patient) external view returns (bool) {
        for (uint256 i = 0; i < nextTicketId; i++) {
            if (tickets[i].patient == _patient && tickets[i].isResolved) {
                return true;
            }
        }
        return false;
    }
}