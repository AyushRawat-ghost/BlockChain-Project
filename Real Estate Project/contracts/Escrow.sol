//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
interface IRealEstate{
    // It creates a new digital collectible and assigns it to someone, linking it to its unique digital details.
    function mint(address _to,string memory _tokenURI) external returns (uint256);
    // Who owns this specific NFT
    function ownerOf(uint256 _tokenId) external view returns (address);
    // I, the owner of NFT X, give permission to Wallet Y to move NFT X
    function approve(address _to, uint256 _tokenId) external;

    // Who is currently approved to move NFT X
    function getApproved(uint256 _tokenId) external view returns (address);
    // Has this specific operator (e.g., a marketplace) been given permission to move all of this owner's NFTs
    function isApprovedForAll(address _owner, address _operator) external view returns (bool);
    // Move NFT X from Wallet A to Wallet B
    function transferFrom(address _from, address _to, uint256 _tokenId) external;
    // How many NFTs have been created by this contract so far
    function totalSupply() external view returns(uint256);
}

contract Escrow {
    IRealEstate public realEstate;
    // address public nftAddress;
    // address payable public seller;
    address public inspector;
    address public lender;
    // Controls visibilty and progression of property listings
    enum ListingStatus{
        PROPOSED,
        PENDING_INSPECTION,
        VERIFIED,
        REJECTED,
        SOLD
    }
    using Counters for Counters.Counter;
    Counters.Counter private _listingCounter;


    // Mapping to store data in key-value pairs
    mapping(uint256=>address) public sellers;
    mapping(uint256=>ListingStatus)public propertyStatus;
    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionPassed;
    mapping(uint256 => mapping(address => bool)) public approval;


// Modifiers to restrict access to certain functions
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


// Constructor to initialize the contract with the real estate address and other necessary addresses
    constructor(
        address _realEstateAddress,
        // address payable _seller,
        address _inspector,
        address _lender
    ) {
        realEstate = IRealEstate(_realEstateAddress);
        // seller = _seller;
        inspector = _inspector;
        lender = _lender;
    }


// Events for workflow stages
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


    // Function to propose a new property listing
    function proposeListing(
        uint256 _purchasePrice
    )public{

        _listingCounter.increment();
        uint256 listingID = _listingCounter.current();
        require(propertyStatus[listingID]== ListingStatus.PROPOSED, "Property already proposed");

        sellers[listingID] = msg.sender;
        purchasePrice[listingID]=_purchasePrice;
        propertyStatus[listingID]=ListingStatus.PENDING_INSPECTION;
        emit ProposedListing(listingID,msg.sender, _purchasePrice);
    }


    // Function to verify a property listing after inspection
    function verifyListing(
        uint256 _nftID,
        string memory _tokenURI
    )public onlyInspector{

        require(propertyStatus[_nftID]==ListingStatus.PENDING_INSPECTION, "Property not pending inspection");
        realEstate.mint(sellers[_nftID], _tokenURI);

        propertyStatus[_nftID]=ListingStatus.VERIFIED;
        isListed[_nftID]=true;
        emit ListingVerified(_nftID, msg.sender, sellers[_nftID], _tokenURI);
    }


    // function to reject a property listing by inspector
    function rejectListing(
        uint256 _nftID
    )public onlyInspector{

        require(propertyStatus[_nftID]==ListingStatus.PENDING_INSPECTION, "Property not pending inspection");
        propertyStatus[_nftID]=ListingStatus.REJECTED;

        isListed[_nftID]=false;
        emit ListingRejected(_nftID, msg.sender);
    }
    
    
    // We add a require statement to ensure the address is not already set and is not the zero address
        function setRealEstateAddress(
            address _realEstateAddress
        ) public {
            
        require(address(realEstate) == address(0), "RealEstate address already set");
        require(_realEstateAddress != address(0), "RealEstate: New address cannot be zero");
        realEstate = IRealEstate(_realEstateAddress);
    }
}








//     function list(
//         uint256 _nftID,
//         address _buyer,
//         uint256 _purchasePrice,
//         uint256 _escrowAmount
//     ) public payable onlySeller {
//         // Transfer NFT from seller to this contract
//         IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);

//         isListed[_nftID] = true;
//         purchasePrice[_nftID] = _purchasePrice;
//         escrowAmount[_nftID] = _escrowAmount;
//         buyer[_nftID] = _buyer;
//     }

//     // Put Under Contract (only buyer - payable escrow)
//     function depositEarnest(uint256 _nftID) public payable onlyBuyer(_nftID) {
//         require(msg.value >= escrowAmount[_nftID]);
//     }

//     // Update Inspection Status (only inspector)
//     function updateInspectionStatus(uint256 _nftID, bool _passed)
//         public
//         onlyInspector
//     {
//         inspectionPassed[_nftID] = _passed;
//     }

//     // Approve Sale
//     function approveSale(uint256 _nftID) public {
//         approval[_nftID][msg.sender] = true;
//     }

//     // Finalize Sale
//     // -> Require inspection status (add more items here, like appraisal)
//     // -> Require sale to be authorized
//     // -> Require funds to be correct amount
//     // -> Transfer NFT to buyer
//     // -> Transfer Funds to Seller
//     function finalizeSale(uint256 _nftID) public {
//         require(inspectionPassed[_nftID]);
//         require(approval[_nftID][buyer[_nftID]]);
//         require(approval[_nftID][seller]);
//         require(approval[_nftID][lender]);
//         require(address(this).balance >= purchasePrice[_nftID]);

//         isListed[_nftID] = false;

//         (bool success, ) = payable(seller).call{value: address(this).balance}(
//             ""
//         );
//         require(success);

//         IERC721(nftAddress).transferFrom(address(this), buyer[_nftID], _nftID);
//     }

//     // Cancel Sale (handle earnest deposit)
//     // -> if inspection status is not approved, then refund, otherwise send to seller
//     function cancelSale(uint256 _nftID) public {
//         if (inspectionPassed[_nftID] == false) {
//             payable(buyer[_nftID]).transfer(address(this).balance);
//         } else {
//             payable(seller).transfer(address(this).balance);
//         }
//     }

//     receive() external payable {}

//     function getBalance() public view returns (uint256) {
//         return address(this).balance;
//     }
// }
