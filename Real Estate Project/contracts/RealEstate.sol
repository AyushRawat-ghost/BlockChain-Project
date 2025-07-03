// // SPDX-License-Identifier: Unlicense
// pragma solidity ^0.8.0;

// import "@openzeppelin/contracts/utils/Counters.sol";
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

// contract RealEstate is ERC721URIStorage {
//     using Counters for Counters.Counter;
//     Counters.Counter private _tokenIds; // Used for totalSupply, but mint uses external ID

//     address public escrowMinter;

//     constructor(address _escrowMinterAddress) ERC721("Real Estate", "REAL") {
//         require(_escrowMinterAddress != address(0), "RealEstate: Minter cannot be zero address");
//         escrowMinter = _escrowMinterAddress;
//     }

//     function mint(
//         address _to,
//         uint256 _tokenId, // Accepts specific token ID
//         string memory _tokenURI
//     ) public {
//         require(msg.sender == escrowMinter, "Only escrow minter can mint tokens");
//         require(_to != address(0), "RealEstate: Cannot mint to the zero address");
//         require(_tokenId > 0, "RealEstate: Token ID must be greater than zero"); // Ensure valid ID
//         require(bytes(_tokenURI).length > 0, "RealEstate: Token URI cannot be empty");
        
//         _mint(_to, _tokenId); // Mints with the provided ID
//         _setTokenURI(_tokenId, _tokenURI); // Sets URI for the provided ID
//     }

//     function totalSupply() public view returns (uint256) {
//         return _tokenIds.current(); 
//     }
// }



pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract RealEstate is ERC721URIStorage, Ownable {
    address public escrowMinter;

    constructor() ERC721("Real Estate", "REAL") {
        escrowMinter = msg.sender;
    }

    function setEscrowMinter(
        address _escrowMinter
    ) external onlyOwner {
        require(_escrowMinter != address(0), "RealEstate: zero minter");
        escrowMinter = _escrowMinter;
    }

    function mint(
        address _to,
        uint256 _tokenId,
        string memory _tokenURI
    ) external {
        require(msg.sender == escrowMinter, "Only escrow minter");
        _mint(_to, _tokenId);
        _setTokenURI(_tokenId, _tokenURI);
    }
}