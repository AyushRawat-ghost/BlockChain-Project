// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Registration/DoctorRegistry.sol";
import "./Registration/PatientRegistry.sol";

contract AccessRequest is Ownable {
    DoctorRegistry public doctors;
    PatientRegistry public patients;

    enum Status { 
        Pending, 
        Approved, 
        Rejected 
    }

    struct Request {
        address admin;      // who initiate
        address doctor;     // must approve
        address patient;    // for tracking
        Status status;
    }

    mapping(uint256 => Request) public requests;
    uint256 public nextRequestId;

    // constructor() Ownable (msg.sender){}
    event RequestCreated(
        uint256 indexed requestId,
        address indexed admin,
        address indexed doctor,
        address patient
    );
    event RequestApproved(
        uint256 indexed requestId
    );
    event RequestRejected(
        uint256 indexed requestId
    );

    constructor(
        address _doctorRegistry, 
        address _patientRegistry
    ) Ownable( msg.sender ){
        doctors  = DoctorRegistry(_doctorRegistry);
        patients = PatientRegistry(_patientRegistry);
    }

    /// Admin creates an access request
    function createRequest(
        address doctor, 
        address patient
    ) external onlyOwner {
        require(doctors.isDoctor(doctor),   "Invalid doctor");
        require(patients.isPatient(patient),"Invalid patient");

        requests[nextRequestId] = Request({
            admin:    msg.sender,
            doctor:   doctor,
            patient:  patient,
            status:   Status.Pending
        });

        emit RequestCreated(nextRequestId, msg.sender, doctor, patient);
        nextRequestId++;
    }

    /// Only doctor can approve; flips to Approved immediately
    function approveRequest(
        uint256 requestId
    ) external {
        Request storage req = requests[requestId];
        require(req.status == Status.Pending, "Not pending");
        require(msg.sender == req.doctor,    "Only doctor");

        req.status = Status.Approved;
        emit RequestApproved(requestId);
    }

    /// Only doctor can reject
    function rejectRequest(
        uint256 requestId
    ) external {
        Request storage req = requests[requestId];
        require(req.status == Status.Pending, "Not pending");
        require(msg.sender == req.doctor,    "Only doctor");

        req.status = Status.Rejected;
        emit RequestRejected(requestId);
    }

    /// View helper
    function getRequest(
        uint256 id
    )
        external view
        returns (
            address admin,
            address doctor,
            address patient,
            Status status
        )
    {
        Request storage r = requests[id];
        return (r.admin, r.doctor, r.patient, r.status);
    }
}
