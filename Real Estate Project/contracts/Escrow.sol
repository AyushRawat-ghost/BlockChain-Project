// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface IRealEstate {
    function mint(address _to, uint256 _tokenId, string memory _tokenURI) external;
    function ownerOf(uint256 _tokenId) external view returns (address);
    function approve(address _to, uint256 _tokenId) external;
    function getApproved(uint256 _tokenId) external view returns (address);
    function isApprovedForAll(address _owner, address _operator) external view returns (bool);
    function transferFrom(address _from, address _to, uint256 _tokenId) external;
    function totalSupply() external view returns(uint256);
}

contract Escrow {
    IRealEstate public realEstate;

    address public inspector;
    address public lender;

    enum ListingStatus {
        PROPOSED,
        PENDING_INSPECTION,
        VERIFIED,
        REJECTED,
        SOLD
    }
    using Counters for Counters.Counter;
    Counters.Counter private _listingCounter;

    mapping(uint256 => address) public sellers;
    mapping(uint256 => ListingStatus) public propertyStatus;
    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionPassed;
    mapping(uint256 => mapping(address => bool)) public approval;
    mapping(uint256 => string) private _proposedTokenURIs;

    modifier onlyBuyer(uint256 _nftID) {
        require(msg.sender == buyer[_nftID], "Only buyer can call this method");
        _;
    }

    modifier onlySeller(uint256 _nftID) {
        require(msg.sender == sellers[_nftID], "Only seller can call this method");
        _;
    }

    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector can call this method");
        _;
    }

    modifier onlyLender() {
        require(msg.sender == lender, "Only lender can call this method");
        _;
    }

    constructor(
        address _realEstateAddress,
        address _inspector,
        address _lender
    ) {
        // require(_realEstateAddress != address(0), "RealEstate address cannot be zero");
        // require(_inspector != address(0), "Inspector address cannot be zero");
        // require(_lender != address(0), "Lender address cannot be zero");
        realEstate = IRealEstate(_realEstateAddress);
        inspector = _inspector;
        lender = _lender;
    }

    event ProposedListing(
        uint256 indexed listingID,
        address indexed proposer,
        uint256 purchasePrice
    );
    event ListingVerified(
        uint256 indexed nftID,
        address indexed verifier,
        address indexed to,
        string tokenURI
    );
    event ListingRejected(
        uint256 indexed listingID,
        address indexed rejector
    );
    event SaleFinalized(
        uint256 indexed nftID,
        address indexed buyer,
        address indexed seller,
        uint256 purchasePrice
    );
    event SaleCancelled(
        uint256 indexed nftID
    );

    function setRealEstateAddress(address _realEstateAddress) public {
        require(address(realEstate) == address(0), "RealEstate address already set");
        require(_realEstateAddress != address(0), "RealEstate: New address cannot be zero");
        realEstate = IRealEstate(_realEstateAddress);
    }

    function setPurchasePriceAndEscrow(
        uint256 _nftID,
        uint256 _purchasePrice,
        uint256 _escrowAmount
    ) public {
        purchasePrice[_nftID] = _purchasePrice;
        escrowAmount[_nftID] = _escrowAmount;
    }

    function proposeListing(
        string memory _tokenURI,
        uint256 _purchasePrice
    ) public returns (uint256) {
        _listingCounter.increment();
        uint256 listingID = _listingCounter.current();

        sellers[listingID] = msg.sender;
        purchasePrice[listingID] = _purchasePrice;
        propertyStatus[listingID] = ListingStatus.PENDING_INSPECTION;
        _proposedTokenURIs[listingID] = _tokenURI;

        emit ProposedListing(listingID, msg.sender, _purchasePrice);
        return listingID;
    }

    function verifyListing(
        uint256 _listingID
    ) public onlyInspector {
        require(propertyStatus[_listingID] == ListingStatus.PENDING_INSPECTION, "Listing is not pending inspection");
        string memory tokenURI_to_mint = _proposedTokenURIs[_listingID];
        require(bytes(tokenURI_to_mint).length > 0, "Token URI missing for proposed listing");
        
        realEstate.mint(sellers[_listingID], _listingID, tokenURI_to_mint);

        propertyStatus[_listingID] = ListingStatus.VERIFIED;
        isListed[_listingID] = true;
        emit ListingVerified(_listingID, msg.sender, sellers[_listingID], tokenURI_to_mint);
    }

    function rejectListing(
        uint256 _nftID
    ) public onlyInspector {
        // Corrected and consistent error message
        require(propertyStatus[_nftID] == ListingStatus.PENDING_INSPECTION, "Listing is not pending inspection");
        propertyStatus[_nftID] = ListingStatus.REJECTED;

        emit ListingRejected(_nftID, msg.sender);
    }
    
    // function depositEarnest(
    //     uint256 _nftID,
    //     address _buyer
    // ) public payable {
    //     require(propertyStatus[_nftID] == ListingStatus.VERIFIED, "Listing is not verified");
    //     require(purchasePrice[_nftID] > 0, "Purchase price not set");
        
    //     require(escrowAmount[_nftID] > 0, "Escrow amount not configured");
    //     require(msg.value == escrowAmount[_nftID], "Incorrect escrow amount");

    //     buyer[_nftID] = _buyer;
    //     approval[_nftID][_buyer] = true;
    // }


function depositEarnest(
    uint256 _nftID,
    address _buyer
) public payable {
    require(
        propertyStatus[_nftID] == ListingStatus.VERIFIED,
        "Listing is not verified"
    );
    require(
        purchasePrice[_nftID] > 0,
        "Purchase price not set"
    );
    // you no longer need escrowAmount here
    require(
        msg.value == purchasePrice[_nftID],
        "Must send full purchase price"
    );

    buyer[_nftID]            = _buyer;
    approval[_nftID][_buyer] = true;
}


    function updateInspectionStatus(
        uint256 _nftID,
        bool _passed
    ) public onlyInspector {
        require(propertyStatus[_nftID] == ListingStatus.VERIFIED, "Listing is not verified");
        inspectionPassed[_nftID] = _passed;
    }

    function approveSale(
        uint256 _nftID,
        address _party
    ) public {
        require(propertyStatus[_nftID] == ListingStatus.VERIFIED, "Listing is not verified");
        require(msg.sender == buyer[_nftID] || msg.sender == sellers[_nftID] || msg.sender == lender, "Only buyer, seller or lender can approve");
        require(msg.sender == _party, "Cannot approve on behalf of another party");
        approval[_nftID][_party] = true;
    }

    // function finalizeSale(
    //     uint256 _nftID
    // ) public onlyLender {
    //     require(propertyStatus[_nftID] == ListingStatus.VERIFIED, "Listing is not verified");
    //     require(inspectionPassed[_nftID], "Inspection has not passed");
    //     // require(approval[_nftID][buyer[_nftID]], "Buyer has not approved");
    //     // require(approval[_nftID][sellers[_nftID]], "Seller has not approved");
    //     require(approval[_nftID][lender], "Lender has not approved");
    //     require(buyer[_nftID] != address(0), "Buyer has not deposited earnest");
    //     require(address(this).balance >= purchasePrice[_nftID], "Insufficient funds in escrow to finalize sale");

    //     realEstate.transferFrom(sellers[_nftID], buyer[_nftID], _nftID);
        
    //     (bool success, ) = payable(sellers[_nftID]).call{value: purchasePrice[_nftID]}("");
    //     require(success, "Failed to transfer purchase price to seller");

    //     propertyStatus[_nftID] = ListingStatus.SOLD;
    //     isListed[_nftID] = false;
    //     emit SaleFinalized(_nftID, buyer[_nftID], sellers[_nftID], purchasePrice[_nftID]);
    // }


    function finalizeSale(
        uint256 _nftID
    ) public onlyLender {
    // 1) Listing must have been verified by the inspector
    require(
        propertyStatus[_nftID] == ListingStatus.VERIFIED,
        "Listing is not verified"
    );

    // 2) The on-chain inspection flag must be true
    require(
        inspectionPassed[_nftID],
        "Inspection has not passed"
    );

    // 3) The lender must have explicitly approved the sale
    require(
        approval[_nftID][lender],
        "Lender has not approved"
    );

    require(
        buyer[_nftID] != address(0),
        "Buyer has not deposited earnest"
    );
    require(
        address(this).balance >= purchasePrice[_nftID],
        "Insufficient funds in escrow to finalize"
    );
    realEstate.transferFrom(
        sellers[_nftID],
        buyer[_nftID],
        _nftID
    );
    (bool success, ) = payable(sellers[_nftID]).call{
        value: purchasePrice[_nftID]
    }("");
    require(
        success,
        "Failed to transfer purchase price to seller"
    );
    propertyStatus[_nftID] = ListingStatus.SOLD;
    isListed[_nftID]      = false;

    emit SaleFinalized(
        _nftID,
        buyer[_nftID],
        sellers[_nftID],
        purchasePrice[_nftID]
    );
}


    function cancelSale(
        uint256 _nftID
    ) public {
        require(propertyStatus[_nftID] == ListingStatus.VERIFIED, "Listing is not verified");
        require(!inspectionPassed[_nftID], "Inspection has passed");

        // Authorization check
        require(msg.sender == buyer[_nftID] || msg.sender == sellers[_nftID] || msg.sender == inspector, "Only buyer, seller, or inspector can cancel");
        
        // Buyer and earnest checks
        require(buyer[_nftID] != address(0), "No buyer associated with this NFT for refund");
        require(escrowAmount[_nftID] > 0, "No earnest money deposited for this NFT to refund");

        // Balance check
        require(address(this).balance >= escrowAmount[_nftID], "Insufficient escrow balance for refund");

        (bool success, ) = payable(buyer[_nftID]).call{value: escrowAmount[_nftID]}("");
        require(success, "Failed to refund earnest money");
        
        propertyStatus[_nftID] = ListingStatus.REJECTED; 
        isListed[_nftID] = false;

        emit SaleCancelled(_nftID);
    }
    
    receive() external payable {}

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
