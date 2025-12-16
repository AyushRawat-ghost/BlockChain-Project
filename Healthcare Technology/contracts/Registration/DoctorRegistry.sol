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

    mapping(address => Doctor) public doctors;
    address[] private doctorList; 
    mapping(address => uint256) private doctorIndex;

    // --- Constructor ---
    constructor() Ownable(msg.sender) {}
    // --- Events ---
    event DoctorAdded(
        address indexed doctor,
        string name,
        string specialization
    );
    event DoctorRemoved(
        address indexed doctor
    );

// Func to add doctors, Privilege : Admin Only
    function addDoctor(
        address doctor,
        string calldata name,
        string calldata specialization,
        string calldata ipfsProfile
    ) external onlyOwner {
        
        require(!doctors[doctor].exists, "Registry: Already registered");
        doctors[doctor] = Doctor(true, name, specialization, ipfsProfile);
        
        doctorIndex[doctor] = doctorList.length;
        doctorList.push(doctor);
        emit DoctorAdded(doctor, name, specialization);
    }

// FUnc to remove a doctor, Privilege : Admin Only
    function removeDoctor(
        address doctor
    ) external onlyOwner {
        require(doctors[doctor].exists, "Registry: Not found");
        
        uint256 indexToRemove = doctorIndex[doctor];
        uint256 lastIndex = doctorList.length - 1;
        
        if (indexToRemove != lastIndex) {
            address lastDoctor = doctorList[lastIndex];
            doctorList[indexToRemove] = lastDoctor;
            doctorIndex[lastDoctor] = indexToRemove;
        }
        
        doctorList.pop();
        delete doctors[doctor];
        delete doctorIndex[doctor];
        emit DoctorRemoved(doctor);
    }

// Func to verify a doctor , Privilege : NA
    function isDoctor(
        address addr
    ) external view returns (
        bool
    ) {
        return doctors[addr].exists;
    }

// Func to get list of DOctors, Privilege : NA
    function getDoctorList() 
        external view returns (
            address[] memory
    ){
        return doctorList;
    }
}