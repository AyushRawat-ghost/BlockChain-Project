// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import the same interface we used in AccessRequest
interface IRegistryCheck {
    function isDoctor(address _addr) external view returns (bool);
    function isPatient(address _addr) external view returns (bool);
}

// Interface for AccessRequest to check if a request is "Approved"
interface IAccessRequest {
    function getRequest(uint256 id) external view returns (address, address, address, uint8);
}

contract MedicalRecord {
    IRegistryCheck public registries; // We'll point this to the Doctor/Patient registries
    IAccessRequest public accessContract;

    uint256 public recordCount;

    struct Record {
        uint256 id;
        address doctor;
        address patient;
        string cid;       
        uint256 timestamp;
    }

    mapping(uint256 => Record) private records;
    mapping(address => uint256[]) private patientRecords;

    event RecordAdded(
        uint256 indexed id,
        address indexed doctor,
        address indexed patient,
        string cid,
        uint256 timestamp
    );

    constructor(address _registries, address _accessContract) {
        registries = IRegistryCheck(_registries);
        accessContract = IAccessRequest(_accessContract);
    }

    /// @notice Only registered Doctors can add records
    function addRecord(
        address _patient,
        string calldata _cid
    ) external {
        require(registries.isDoctor(msg.sender), "Only registered doctors can add records");
        require(registries.isPatient(_patient), "Invalid patient address");

        recordCount += 1;
        records[recordCount] = Record({
            id: recordCount,
            doctor: msg.sender,
            patient: _patient,
            cid: _cid,
            timestamp: block.timestamp
        });

        patientRecords[_patient].push(recordCount);

        emit RecordAdded(recordCount, msg.sender, _patient, _cid, block.timestamp);
    }

    /// @notice Controlled access to the sensitive IPFS CID
    function getRecordCID(uint256 _id, uint256 _accessRequestId) external view returns (string memory) {
        Record storage rec = records[_id];
        require(rec.id != 0, "Record does not exist");

        bool isPatientOwner = (msg.sender == rec.patient);
        bool isAuthorDoctor = (msg.sender == rec.doctor);
        
        (,,, uint8 status) = accessContract.getRequest(_accessRequestId);
        bool isApprovedRequest = (status == 1); 

        require(isPatientOwner || isAuthorDoctor || isApprovedRequest, "Not authorized to view this record");

        return rec.cid;
    }

    function getPatientRecords(address _patient) external view returns (uint256[] memory) {
        return patientRecords[_patient];
    }
}