// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Telemedicine.sol";

contract PrescriptionManager {
    Telemedicine public telemedicine;

    // appointmentId → medId (off-chain UUID stored in Supabase)
    mapping(uint256 => bytes32) public medIdOf;

    event PrescriptionAssigned(
        uint256 indexed appointmentId,
        bytes32 indexed medId
    );

    constructor(address telemedicineAddress) {
        telemedicine = Telemedicine(telemedicineAddress);
    }

    /// @notice Doctor assigns the off-chain medId for a given appointment
    function assignMedicine(uint256 appointmentId, bytes32 medId) external {
        // pull (patient, doctor, timestamp, status) from Telemedicine
        ( , address doctor, , Telemedicine.Status status) = 
            telemedicine.getAppointment(appointmentId);

        require(status == Telemedicine.Status.Scheduled, "Not active");
        require(msg.sender == doctor,                "Only doctor");

        medIdOf[appointmentId] = medId;
        emit PrescriptionAssigned(appointmentId, medId);
    }

    /// @notice Fetch the medId linked to an appointment
    function getMedId(uint256 appointmentId) external view returns (bytes32) {
        return medIdOf[appointmentId];
    }
}