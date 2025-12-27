// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockRegistry {
    mapping(address => bool) public registered;
    address[] public doctorList; // To keep track of total count

    function isDoctor(address _addr) external view returns (bool) {
        return registered[_addr];
    }
    
    function isPatient(address _addr) external view returns (bool) {
        return registered[_addr];
    }
    function getDoctorList() external view returns (address[] memory) {
        return doctorList;
    }
    function doctorCount() external view returns (uint256) {
        return doctorList.length;
    }

    function mockRegister(address _addr) external {
        if (!registered[_addr]) {
            registered[_addr] = true;
            doctorList.push(_addr);
        }
    }
}