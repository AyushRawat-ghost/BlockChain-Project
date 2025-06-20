//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";



contract RealEstate is ERC721URIStorage{

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    constructor ()ERC721("Real Estate","REAL"){}

// NFT id creation and assigning it to func caller
    function mint(string memory tokenURI)public returns(uint256){
        _tokenIds.increment();
        uint256 newItemId=_tokenIds.current();
        _mint(msg.sender,newItemId);
        _setTokenURI(newItemId,tokenURI);
        return newItemId;
    }

// retrieve current NFT

    function totalSupply() public view returns(uint256) {
        return _tokenIds.current();
    }
}

