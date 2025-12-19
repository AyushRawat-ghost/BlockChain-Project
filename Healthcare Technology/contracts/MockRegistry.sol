// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockRegistry {
    mapping(address => bool) public registered;
    address[] public doctorList;

    // This matches the IRegistryCheck interface in MedicalRecord.sol
    function isDoctor(
        address _addr
    ) external view returns (
        bool
                ) {
        return registered[_addr];
    }
    
    // This matches the IRegistryCheck interface in MedicalRecord.sol
    function isPatient(address _addr) external view returns (bool) {
        return registered[_addr];
    }

    /**
     * @dev Helper function used only by the test script 
     * to "register" addresses in the mock system.
     */
    function mockRegister(address _addr) external {
        registered[_addr] = true;
        doctorList.push(_addr);
    }
    function doctorCount() external view returns (uint256) {
    return doctorList.length;
}
}