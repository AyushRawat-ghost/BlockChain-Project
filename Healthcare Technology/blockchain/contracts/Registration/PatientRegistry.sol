// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./Counters.sol"; 

contract PatientRegistry is Ownable, ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct Patient {
        bool exists;
        string name;
        string ipfsProfile; 
        uint256 tokenId;
    }

// Mapping And Variables
    mapping(address => Patient) public patients;
    address[] private patientList;
    mapping(address => uint256) private patientIndex;

// COnstructors
    constructor() Ownable(msg.sender) ERC721("PatientIdentitySBT", "PID") {}

    // --- Events  ---
    event PatientAdded(address indexed patient, string name, uint256 tokenId);
    event PatientRemoved(address indexed patient);

    // --- Non-Transferability Enforcement ---
    modifier onlySelf(address caller) {
        require(msg.sender == caller, "SBT: Not authorized for this token.");
        _;
    }

    function approve(address to,uint256 tokenId) public virtual override {
        address owner = ERC721.ownerOf(tokenId);
        require(msg.sender == owner, "SBT: Only owner can approve."); 
        revert("SBT: Transfers and Approvals are restricted");
    }

    // 2. Prevents operator (batch) approvals
    function setApprovalForAll(address operator, bool approved) public virtual override {
        revert("SBT: Transfers and Approvals are restricted");
    }
    
// 3. Prevents standard transfers and safe transfers from any party
    // function _beforeTokenTransfer(
    //     address from,
    //     address to,
    //     uint256 tokenId
    // ) internal view virtual override {
    //     if (from != address(0) && to != address(0)) {
    //         revert("SBT: Transfers are restricted");
    //     }
        
    // }

    // --- Patient Adding 
    function addPatient(
        address patient,
        string calldata name,
        string calldata ipfsProfile
    ) external onlyOwner {
        
        require(!patients[patient].exists, "Registry: Already registered");
        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();
        
        _safeMint(patient, newTokenId);
        patients[patient] = Patient(true, name, ipfsProfile, newTokenId);
        patientIndex[patient] = patientList.length;
        
        patientList.push(patient);
        emit PatientAdded(patient, name, newTokenId);
    }

    // --- Patient Removal 
    function removePatient(
        address patient
    ) external onlyOwner {
        require(patients[patient].exists, "Registry: Not found");
        uint256 tokenId = patients[patient].tokenId;
        _burn(tokenId);
        
        uint256 indexToRemove = patientIndex[patient];
        uint256 lastIndex = patientList.length - 1;
        
        if (indexToRemove != lastIndex) {
            address lastPatient = patientList[lastIndex];
            patientList[indexToRemove] = lastPatient;
            patientIndex[lastPatient] = indexToRemove;
        }
        patientList.pop();

        delete patientIndex[patient];
        delete patients[patient];
        emit PatientRemoved(patient);
    }

    // --- View Functions 
    function isPatient(address addr) external view returns (bool) {
        return patients[addr].exists;
    }
    
    // --- View Functions
    function getPatientList() external view returns (address[] memory) {
        return patientList;
    }
}