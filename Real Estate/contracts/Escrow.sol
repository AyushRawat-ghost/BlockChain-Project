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

// constructor to intilaize the address of diff parties
    constructor(
        address _nftAddress,
        address payable _seller,
        address _inspector,
        address _lender
    ){
            nftAddress=_nftAddress;
            lender=_lender;
            seller=_seller;
            inspector=_inspector;
    }


}
