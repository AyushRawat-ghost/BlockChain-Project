// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IRegistryCheck {
    function isDoctor(address _addr) external view returns (bool);
    function isPatient(address _addr) external view returns (bool);
}

contract AccessRequest is Ownable {
    IRegistryCheck public doctors;
    IRegistryCheck public patients;

    enum Status { Pending, Approved, Rejected }

    struct Request {
        address admin;
        address doctor;
        address patient;
        Status status;
    }

    mapping(uint256 => Request) public requests;
    uint256 public nextRequestId;

    event RequestCreated(uint256 indexed requestId, address indexed admin, address indexed doctor, address patient);
    event RequestApproved(uint256 indexed requestId, address indexed doctor);
    event RequestRejected(uint256 indexed requestId, address indexed doctor);

    constructor(address _doctorRegistry, address _patientRegistry) Ownable(msg.sender) {
        doctors = IRegistryCheck(_doctorRegistry);
        patients = IRegistryCheck(_patientRegistry);
    }

    function createRequest(address doctor, address patient) external onlyOwner {
        require(doctors.isDoctor(doctor), "Registry: Invalid doctor");
        require(patients.isPatient(patient), "Registry: Invalid patient");

        requests[nextRequestId] = Request({
            admin: msg.sender,
            doctor: doctor,
            patient: patient,
            status: Status.Pending
        });

        emit RequestCreated(nextRequestId, msg.sender, doctor, patient);
        nextRequestId++;
    }

    function approveRequest(uint256 requestId) external {
        Request storage req = requests[requestId];
        require(req.status == Status.Pending, "Status: Not pending");
        require(msg.sender == req.doctor, "Access: Only designated doctor can approve");

        req.status = Status.Approved;
        emit RequestApproved(requestId, msg.sender);
    }

    function rejectRequest(uint256 requestId) external {
        Request storage req = requests[requestId];
        require(req.status == Status.Pending, "Status: Not pending");
        require(msg.sender == req.doctor, "Access: Only designated doctor can reject");

        req.status = Status.Rejected;
        emit RequestRejected(requestId, msg.sender);
    }

    function getRequest(uint256 id) external view returns (address, address, address, Status) {
        Request storage r = requests[id];
        return (r.admin, r.doctor, r.patient, r.status);
    }
}