// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRegistryCheck {
    function isDoctor(address _addr) external view returns (bool);
    function isPatient(address _addr) external view returns (bool);
}

contract LabResultContract {
    IRegistryCheck public registries;

    uint256 public resultCount;

    struct LabResult {
        uint256 id;
        address patient;
        address labTechnician;
        string testType;
        string cid;
        uint256 timestamp;
    }

    mapping(uint256 => LabResult) private results;
    mapping(address => uint256[]) private patientResults;

    event ResultUploaded(uint256 indexed id, address indexed labTechnician, address indexed patient, string testType, string cid);

    constructor(address _registries) {
        registries = IRegistryCheck(_registries);
    }

    function uploadResult(address _patient, string calldata _testType, string calldata _cid) external {
        // We reuse the doctor registry to act as authorized lab technicians for now
        require(registries.isDoctor(msg.sender), "Only registered doctor/lab can upload");
        require(registries.isPatient(_patient), "Invalid patient address");

        resultCount++;
        results[resultCount] = LabResult({
            id: resultCount,
            patient: _patient,
            labTechnician: msg.sender,
            testType: _testType,
            cid: _cid,
            timestamp: block.timestamp
        });

        patientResults[_patient].push(resultCount);

        emit ResultUploaded(resultCount, msg.sender, _patient, _testType, _cid);
    }

    function getResult(uint256 _id) external view returns (LabResult memory) {
        LabResult storage res = results[_id];
        require(res.id != 0, "Result does not exist");
        require(msg.sender == res.patient || msg.sender == res.labTechnician, "Not authorized to view");

        return res;
    }

    function getPatientResults(address _patient) external view returns (uint256[] memory) {
        return patientResults[_patient];
    }
}
