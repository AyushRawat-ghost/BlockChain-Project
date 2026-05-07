// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

interface IRegistryCheck {
    function isPatient(address _addr) external view returns (bool);
}

interface IInsurerRegistry {
    function isInsurer(address addr) external view returns (bool);
}

contract Insurance is ERC721URIStorage {
    IRegistryCheck public registries;
    IInsurerRegistry public insurerRegistry;

    uint256 public claimCount;

    enum ClaimStatus { Pending, Approved, Rejected }

    struct Claim {
        uint256 id;
        address patient;
        address insurer;
        uint256 amountRequested;
        uint256 amountApproved;
        ClaimStatus status;
        string cid;
    }

    mapping(uint256 => Claim) public claims;

    event ClaimSubmitted(uint256 indexed id, address indexed patient, address indexed insurer, uint256 amountRequested, string cid);
    event ClaimApproved(uint256 indexed id, address indexed insurer, uint256 amountApproved);
    event ClaimRejected(uint256 indexed id, address indexed insurer);

    constructor(address _registries, address _insurerRegistry) ERC721("InsuranceClaim", "CLAIM") {
        registries = IRegistryCheck(_registries);
        insurerRegistry = IInsurerRegistry(_insurerRegistry);
    }

    function submitClaim(address _insurer, uint256 _amount, string calldata _cid) external {
        require(registries.isPatient(msg.sender), "Only registered patient can submit claim");
        require(insurerRegistry.isInsurer(_insurer), "Invalid insurer");

        claimCount++;
        _mint(msg.sender, claimCount);
        _setTokenURI(claimCount, _cid);

        claims[claimCount] = Claim({
            id: claimCount,
            patient: msg.sender,
            insurer: _insurer,
            amountRequested: _amount,
            amountApproved: 0,
            status: ClaimStatus.Pending,
            cid: _cid
        });

        emit ClaimSubmitted(claimCount, msg.sender, _insurer, _amount, _cid);
    }

    function approveClaim(uint256 _claimId) external payable {
        Claim storage claim = claims[_claimId];
        require(claim.id != 0, "Claim does not exist");
        require(msg.sender == claim.insurer, "Only designated insurer can approve");
        require(claim.status == ClaimStatus.Pending, "Claim not pending");
        require(msg.value > 0, "Payout amount must be greater than 0");

        claim.status = ClaimStatus.Approved;
        claim.amountApproved = msg.value;

        // Transfer ETH payout to patient
        (bool success, ) = payable(claim.patient).call{value: msg.value}("");
        require(success, "ETH transfer failed");

        emit ClaimApproved(_claimId, msg.sender, msg.value);
    }

    function rejectClaim(uint256 _claimId) external {
        Claim storage claim = claims[_claimId];
        require(claim.id != 0, "Claim does not exist");
        require(msg.sender == claim.insurer, "Only designated insurer can reject");
        require(claim.status == ClaimStatus.Pending, "Claim not pending");

        claim.status = ClaimStatus.Rejected;

        emit ClaimRejected(_claimId, msg.sender);
    }
}
