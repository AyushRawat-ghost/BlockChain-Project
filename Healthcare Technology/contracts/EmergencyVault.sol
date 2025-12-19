// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDoctorRegistry {
    function isDoctor(address _addr) external view returns (bool);
    function getDoctorList() external view returns (address[] memory);
}

contract EmergencyVault {
    IDoctorRegistry public doctorRegistry;
    
    struct Ticket {
        address patient;
        uint256 votesFor;
        bool isResolved;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Ticket) public tickets;
    uint256 public nextTicketId;

    event EmergencyRaised(uint256 ticketId, address patient);
    event VoteCast(uint256 ticketId, address doctor);
    event EmergencyResolved(uint256 ticketId, address patient);

    constructor(address _doctorRegistry) {
        doctorRegistry = IDoctorRegistry(_doctorRegistry);
    }

    function raiseEmergency(address _patient) external {
        // In your case, only Admin (Owner) should probably call this
        Ticket storage newTicket = tickets[nextTicketId];
        newTicket.patient = _patient;
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

        // Check if 2/3 reached
        uint256 totalDocs = doctorRegistry.getDoctorList().length;
        if (ticket.votesFor * 3 >= totalDocs * 2) {
            ticket.isResolved = true;
            emit EmergencyResolved(_ticketId, ticket.patient);
        }
    }

    function isEmergencyAccessApproved(address _patient) external view returns (bool) {
        // This is what MedicalRecord.sol will call
        for (uint256 i = 0; i < nextTicketId; i++) {
            if (tickets[i].patient == _patient && tickets[i].isResolved) {
                return true;
            }
        }
        return false;
    }
}