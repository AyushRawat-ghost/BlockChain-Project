// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract InsurerRegistry is Ownable {
    struct Insurer {
        bool exists;
        string name;
        string ipfsProfile; 
    }

    constructor() Ownable(msg.sender) {}

    mapping(address => Insurer) public insurers;
    address[] public insurerList;

    event InsurerAdded(address indexed insurer, string name);
    event InsurerRemoved(address indexed insurer);

    function addInsurer(
        address insurer,
        string calldata name,
        string calldata ipfsProfile
    ) external onlyOwner {
        require(!insurers[insurer].exists, "Already registered");
        insurers[insurer] = Insurer(true, name, ipfsProfile);
        insurerList.push(insurer);
        emit InsurerAdded(insurer, name);
    }

    function removeInsurer(
        address insurer
    ) external onlyOwner {
        require(insurers[insurer].exists, "Not found");
        delete insurers[insurer];
        emit InsurerRemoved(insurer);
    }

    function isInsurer(
        address addr
    ) external view returns (bool) {
        return insurers[addr].exists;
    }

    function getInsurerList() external view returns (address[] memory) {
        return insurerList;
    }
}