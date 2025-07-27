// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract MedicalRecord {
    uint256 public recordCount;

    struct Record {
        uint256 id;
        address doctor;
        address patient;
        uint256 timestamp;
    }

    mapping(uint256 => Record) private records;
    mapping(address => uint256[]) private patientRecords;

    event RecordAdded(
        uint256 indexed id,
        address indexed doctor,
        address indexed patient,
        string dataUri,
        string cid,
        uint256 timestamp
    );

    /// @notice Adds a record, emits full off‐chain metadata (CID) in an event.
    /// @param _patient Patient address.
    /// @param _dataUri Any off-chain metadata URI (e.g. JSON pointer).
    /// @param _cid IPFS CID of the pinned data.
    function addRecord(
        address _patient,
        string calldata _dataUri,
        string calldata _cid
    ) external {
        recordCount += 1;
        records[recordCount] = Record({
            id: recordCount,
            doctor: msg.sender,
            patient: _patient,
            timestamp: block.timestamp
        });

        patientRecords[_patient].push(recordCount);

        emit RecordAdded(
            recordCount,
            msg.sender,
            _patient,
            _dataUri,
            _cid,
            block.timestamp
        );
    }

    /// @notice Retrieve the bare‐bones on‐chain record.
    function getRecord(uint256 _id) external view returns (Record memory) {
        require(_id > 0 && _id <= recordCount, "Record does not exist");
        return records[_id];
    }

    /// @notice List all record IDs for a patient.
    function getPatientRecords(address _patient)
        external
        view
        returns (uint256[] memory)
    {
        return patientRecords[_patient];
    }
}