// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";

contract InsurerRegistry is Ownable {
    struct Insurer {
        bool exists;
        string name;
        string ipfsProfile; 
    }
// Variables and Mapping
    mapping(address => Insurer) public insurers;
    address[] private insurerList; 
    mapping(address => uint256) private insurerIndex; 

// Events
    event InsurerAdded(address indexed insurer, string name);
    event InsurerRemoved(address indexed insurer);

// Constructor
    constructor() Ownable(msg.sender) {}

// Func to add Insurer, Privilege : Admin Only
    function addInsurer(
        address insurer,
        string calldata name,
        string calldata ipfsProfile
    ) external onlyOwner {

        require(!insurers[insurer].exists, "Already registered");
        insurers[insurer] = Insurer(true, name, ipfsProfile);
        
        insurerIndex[insurer] = insurerList.length;
        insurerList.push(insurer);
        emit InsurerAdded(insurer, name);
    }

// Func to remove Insurer, Privilege : Admin Only
    function removeInsurer(
        address insurer
    ) external onlyOwner {

        require(insurers[insurer].exists, "Not found");
        uint256 indexToRemove = insurerIndex[insurer];
        uint256 lastIndex = insurerList.length - 1;
        
        if (indexToRemove != lastIndex) {
            address lastInsurer = insurerList[lastIndex];
            insurerList[indexToRemove] = lastInsurer;    
            insurerIndex[lastInsurer] = indexToRemove;
        }
        insurerList.pop();
        delete insurers[insurer];
        delete insurerIndex[insurer];
        emit InsurerRemoved(insurer);
    }

// Func to Verify Insurer, Privilege : NA
    function isInsurer(
        address addr
    ) external view returns (bool) {
        return insurers[addr].exists;
    }

// Func to get list of Insurer, Privilege : NA
    function getInsurerList() external view returns (address[] memory) {
        return insurerList;
    }
}