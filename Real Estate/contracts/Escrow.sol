//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}


contract Escrow {
    address public nftAddress;
    address public lender;
    address public inspector;
    address payable public seller;

    mapping (uint256=>bool) public isListed;
    mapping (uint256=>uint256) public purchasePrice;
    mapping (uint256=>uint256) public escrowAmount;
    mapping (uint256=>address) public buyer;
    mapping (uint256=>bool) public inspectionPassed;
    mapping(uint256 =>mapping(address=>bool)) public approval;


    // modifiers
    modifier onlyBuyer(uint256 _nftID) {
        require(msg.sender == buyer[_nftID], "Only seller can call this function");
        _;
    }
    
    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this function");
        _;
    }

    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector can call this function");
        _;
    }


// constructor to intilaize the address of diff parties
    constructor(
        address _nftAddress,
        address payable _seller,
        address _inspector,
        address _lender
    ){
            nftAddress=_nftAddress;
            seller=_seller;
            lender=_lender;
            inspector=_inspector;
    }


// function to transfer the nft from the seller to the escrow contract
    function list(
        uint256 _nftID,
        address _buyer,
        uint256 _purchasePrice,
        uint256 _escrowAmount
    )public payable onlySeller {
            IERC721(nftAddress).transferFrom(msg.sender,address(this),_nftID);
            isListed[_nftID]=true;
            purchasePrice[_nftID]=_purchasePrice;
            escrowAmount[_nftID]=_escrowAmount;
            buyer[_nftID]=_buyer;
    }

// function to pay the escrow amount by buyer
    function depositEarnest(uint256 _nftID) public payable onlyBuyer(_nftID) {
        require(isListed[_nftID], "NFT is not listed");
        require(msg.value == escrowAmount[_nftID], "Incorrect escrow amount");
    }
    receive() external payable {
    }
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

// function to update the inspection status of the nft
    function updateInspectionStatus(
        uint256 _nftID,
        bool _passed)
    public onlyInspector {
            require(isListed[_nftID], "NFT is not listed");
            inspectionPassed[_nftID] = _passed;
    }

// function to approve the Sale
    function approveSale(uint256 _nftID)public {
        approval[_nftID][msg.sender]=true;
    }

// func to finalize the sale
    function finalizeSale(uint256 _nftID) public{
        require(inspectionPassed[_nftID]);
        require(approval[_nftID][buyer[_nftID]]);
        require(approval[_nftID][seller]);
        require(approval[_nftID][lender]);
        require(address(this).balance>=purchasePrice[_nftID]);

        isListed[_nftID] = false;
        (bool success, ) =payable(seller).call{value:address(this).balance}("");
        require(success, "Transfer failed");
        IERC721(nftAddress).transferFrom(address(this), buyer[_nftID], _nftID);
    }

// function to cancel the sale
    function cancelSale(uint256 _nftID)public onlySeller(){
        if(inspectionPassed[_nftID]==false){
            payable(buyer[_nftID]).transfer(address(this).balance);
        }else{
            payable(seller).transfer(address(this).balance);
        }
    }
}
