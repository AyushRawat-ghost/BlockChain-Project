//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract RealEstate is ERC721URIStorage {
    // Using Counters library to manage token IDs
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

// Maintaining the address of the escrow minter
    address public escrowMinter;


    constructor(address _escrowMinterAddress) ERC721("Real Estate", "REAL") {
        escrowMinter = _escrowMinterAddress;
    }

    function mint(
        address _to,
        string memory _tokenURI
    )
    public returns (uint256){
        require(msg.sender==escrowMinter, "Only escrow minter can mint tokens");
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(_to, newItemId);
        _setTokenURI(newItemId, _tokenURI);
        return newItemId;
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }
}
