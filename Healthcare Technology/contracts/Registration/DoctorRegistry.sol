// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DoctorRegistry is Ownable {
    struct Doctor {
        bool exists;
        string name;
        string specialization;
        string ipfsProfile;
    }

    constructor() Ownable(msg.sender) {}

    mapping(address => Doctor) public doctors;
    address[] public doctorList;

    event DoctorAdded(
        address indexed doctor,
        string name
    );
    event DoctorRemoved(
        address indexed doctor
    );

    function addDoctor(
        address doctor,
        string calldata name,
        string calldata specialization,
        string calldata ipfsProfile
    ) external onlyOwner {
        require(!doctors[doctor].exists, "Already registered");
        doctors[doctor] = Doctor(true, name, specialization, ipfsProfile);
        doctorList.push(doctor);
        emit DoctorAdded(doctor, name);
    }

    function removeDoctor(
        address doctor
    ) external onlyOwner {
        require(doctors[doctor].exists, "Not found");
        delete doctors[doctor];
        emit DoctorRemoved(doctor);
    }

    function isDoctor(
        address addr
    ) external view returns (
        bool
    ) {
        return doctors[addr].exists;
    }

    function getDoctorList() 
        external view returns (
            address[] memory
    ){
        return doctorList;
    }
}