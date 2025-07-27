// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PatientRegistry is Ownable {
    struct Patient {
        bool exists;
        string name;
        string ipfsProfile;
    }

    constructor() Ownable(msg.sender) {}

    mapping(address => Patient) public patients;
    address[] public patientList;

    event PatientAdded(
        address indexed patient, 
        string name
    );
    event PatientRemoved(
        address indexed patient
    );

    function addPatient(
        address patient,
        string calldata name,
        string calldata ipfsProfile
    ) external onlyOwner {
        require(!patients[patient].exists, "Already registered");
        patients[patient] = Patient(true, name, ipfsProfile);
        patientList.push(patient);
        emit PatientAdded(patient, name);
    }

    function removePatient(
        address patient
    ) external onlyOwner {
        require(patients[patient].exists, "Not found");
        delete patients[patient];
        emit PatientRemoved(patient);
    }

    function isPatient(
        address addr
    ) external view returns (
        bool
    ) {
        return patients[addr].exists;
    }

    function getPatientList() external view returns (
        address[] memory
    ) {
        return patientList;
    }
}