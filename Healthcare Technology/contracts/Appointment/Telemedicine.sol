// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../Registration/DoctorRegistry.sol";
import "../Registration/PatientRegistry.sol";

contract Telemedicine {
    DoctorRegistry public doctors;
    PatientRegistry public patients;

    enum Status { 
        Scheduled, 
        Completed, 
        Canceled 
    }

    struct Appointment {
        address patient;
        address doctor;
        uint256 timestamp;
        Status status;
    }

    mapping(uint256 => Appointment) public appointments;
    uint256 public nextAppointmentId;

    event AppointmentBooked(
        uint256 indexed id,
        address indexed patient,
        address indexed doctor,
        uint256 timestamp
    );
    event AppointmentCompleted(
        uint256 indexed id
    );
    event AppointmentCanceled(
        uint256 indexed id
    );
    event AppointmentRescheduled(
        uint256 indexed id,
        uint256 newTimestamp
    );

    constructor(
        address doctorRegistry, 
        address patientRegistry
    ) {
        doctors = DoctorRegistry(doctorRegistry);
        patients = PatientRegistry(patientRegistry);
    }

    function bookAppointment(
        address doctor
    ) external {
        require(patients.isPatient(msg.sender), "Not a registered patient");
        require(doctors.isDoctor(doctor),  "Not a registered doctor");

        appointments[nextAppointmentId] = Appointment({
            patient: msg.sender,
            doctor: doctor,
            timestamp: block.timestamp,
            status: Status.Scheduled
        });

        emit AppointmentBooked(
            nextAppointmentId,
            msg.sender,
            doctor,
            block.timestamp
        );
        nextAppointmentId++;
    }

    function completeAppointment(
        uint256 id
    ) external {
        Appointment storage appt = appointments[id];
        require(appt.status == Status.Scheduled, "Not active");
        require(msg.sender == appt.doctor,    "Only doctor");

        appt.status = Status.Completed;
        emit AppointmentCompleted(id);
    }

    function cancelAppointment(
        uint256 id
    ) external {
        Appointment storage appt = appointments[id];
        require(appt.status == Status.Scheduled, "Not active");
        require(msg.sender == appt.patient,   "Only patient");

        appt.status = Status.Canceled;
        emit AppointmentCanceled(id);
    }

    function rescheduleAppointment(
        uint256 id, 
        uint256 newTimestamp
    ) external {
        Appointment storage appt = appointments[id];
        require(appt.status == Status.Scheduled, "Not active");
        require(msg.sender == appt.patient,   "Only patient");
        require(newTimestamp > block.timestamp, "Invalid time");

        appt.timestamp = newTimestamp;
        emit AppointmentRescheduled(id, newTimestamp);
    }

    /// View helper to fetch appointment details
    function getAppointment(uint256 id)
        external
        view
        returns (
            address patient,
            address doctor,
            uint256 timestamp,
            Status status
        )
    {
        Appointment storage appt = appointments[id];
        return (appt.patient, appt.doctor, appt.timestamp, appt.status);
    }
}