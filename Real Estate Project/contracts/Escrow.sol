// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";

/// @notice Minimal interface to  RealEstate ERC721
interface IRealEstate {
    function mint(address to, uint256 tokenId, string calldata tokenURI) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
}

contract Escrow {
    using Counters for Counters.Counter;
    Counters.Counter private _listingCounter;

    IRealEstate public realEstate;
    address    public inspector;
    address    public lender;

    enum ListingStatus { 
        PROPOSED,
        PENDING_INSPECTION,
        VERIFIED,
        EARNEST_PAID, 
        REJECTED, 
        SOLD 
    }

    mapping(uint256 => address)                 public sellers;
    mapping(uint256 => ListingStatus)           public propertyStatus;
    mapping(uint256 => bool)                    public isListed;
    mapping(uint256 => uint256)                 public purchasePrice;
    mapping(uint256 => uint256)                 public escrowAmount;
    mapping(uint256 => address)                 public buyer;
    mapping(uint256 => bool)                    public inspectionPassed;
    mapping(uint256 => mapping(address =>bool)) public approval;
    mapping(uint256 => string)                  private _proposedTokenURIs;

    event ProposedListing(
        uint256 indexed listingID,
        address indexed seller,
        uint256 purchasePrice
    );
    event DepositEarnest(
        uint256 indexed listingID, 
        address indexed buyer, 
        uint256 amount
    );
    event InspectionUpdated(
        uint256 indexed listingID, 
        bool passed
    );
    event ApprovalUpdated(
        uint256 indexed listingID, 
        address indexed participant
    );
    event SaleFinalized(
        uint256 indexed listingID
    );
    event SaleCancelled(
        uint256 indexed nftID,
        address indexed refundedTo,
        uint256 amount
    );


    modifier onlyBuyer(
        uint256 id
    ){
        require(msg.sender == buyer[id],  "Only buyer");
        _;
    }
    modifier onlySeller(
        uint256 id
    ) { 
        require(msg.sender == sellers[id],"Only seller");  
        _;
    }
    modifier onlyInspector(){ 
        require(msg.sender == inspector,   "Only inspector"); 
        _; 
    }
    modifier onlyLender()           { 
        require(msg.sender == lender,      "Only lender");
        _; 
    }

    constructor(
        address _realEstateAddress,
        address _inspector,
        address _lender
    ) {
        require(_realEstateAddress != address(0), "RealEstate=zero");
        require(_inspector           != address(0), "Inspector=zero");
        require(_lender              != address(0), "Lender=zero");

        realEstate = IRealEstate(_realEstateAddress);
        inspector  = _inspector;
        lender     = _lender;
    }


    /// @notice Mint NFT into escrow and create a new listing
    function proposeListing(
        string memory _tokenURI,
        uint256     _purchasePrice
    )external returns (uint256){
        _listingCounter.increment();
        uint256 listingID = _listingCounter.current();

        // mint the NFT into this contract
        realEstate.mint(address(this), listingID, _tokenURI);

        sellers[listingID]        = msg.sender;
        purchasePrice[listingID]  = _purchasePrice;
        escrowAmount[listingID]   = _purchasePrice;
        propertyStatus[listingID] = ListingStatus.PENDING_INSPECTION;
        isListed[listingID]       = true;
        _proposedTokenURIs[listingID] = _tokenURI;

        emit ProposedListing(listingID, msg.sender, _purchasePrice);
        return listingID;
    }

    /// @notice Buyer deposits earnest money
    function depositEarnest(uint256 listingID) external payable {
        require(isListed[listingID], "Not listed");
        require(msg.value == escrowAmount[listingID], "Wrong amount");
        buyer[listingID] = msg.sender;
        propertyStatus[listingID] = ListingStatus.EARNEST_PAID;
        emit DepositEarnest(listingID, msg.sender, msg.value);
    }

    /// @notice Inspector updates inspection status
    function updateInspection(uint256 listingID, bool passed)
        external onlyInspector
    {
        inspectionPassed[listingID] = passed;
        emit InspectionUpdated(listingID, passed);
    }

    /// @notice Buyer, Seller, Lender each call to approve
    function approveSale(uint256 listingID) external {
        require(isListed[listingID], "Not listed");
        bool ok;
        if (msg.sender == buyer[listingID]) {
            ok = true;
        } else if (msg.sender == sellers[listingID]) {
            ok = true;
        } else if (msg.sender == lender) {
            ok = true;
        }
        require(ok, "Not a participant");
        approval[listingID][msg.sender] = true;
        emit ApprovalUpdated(listingID, msg.sender);
    }

    /// @notice Finalize sale: checks and transfers funds + NFT
    function finalizeSale(uint256 listingID) external onlyLender {
        require(isListed[listingID],            "Not listed");
        require(inspectionPassed[listingID],    "Inspection pending");
        require(approval[listingID][buyer[listingID]],   "Buyer not approved");
        require(approval[listingID][sellers[listingID]], "Seller not approved");
        require(approval[listingID][lender],             "Lender not approved");

        uint256 price = purchasePrice[listingID];
        isListed[listingID]      = false;
        propertyStatus[listingID] = ListingStatus.SOLD;

        // transfer funds to seller
        payable(sellers[listingID]).transfer(price);

        // transfer the NFT to buyer
        realEstate.transferFrom(address(this), buyer[listingID], listingID);

        emit SaleFinalized(listingID);
    }

function rejectSale(uint256 _nftID) external{
    require(msg.sender == lender, "Only lender can cancel");

    ListingStatus status = propertyStatus[_nftID];

    // allow reject once earnest is paid
    require(
        status == ListingStatus.EARNEST_PAID,
        "Can only cancel when earnest is paid"
    );

    address _buyer = buyer[_nftID];
    uint256 amount = escrowAmount[_nftID];

    require(_buyer != address(0), "No buyer to refund");
    require(amount > 0, "No deposit to refund");
    require(address(this).balance >= amount, "Insufficient balance");

    // clear state before transfer
    buyer[_nftID]         = address(0);
    escrowAmount[_nftID]  = 0;
    propertyStatus[_nftID] = ListingStatus.VERIFIED;  
    isListed[_nftID]       = true;                   // relist

    // refund buyer
    (bool success, ) = payable(_buyer).call{ value: amount }("");
    require(success, "Refund failed");

    emit SaleCancelled(_nftID, _buyer, amount);
}


    /// @notice Fallback to receive lender’s payment
    receive() external payable {}

/// @notice Get the balance of the escrow contract
        function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
