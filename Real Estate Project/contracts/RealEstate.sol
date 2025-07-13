// SPDX-License-Identifier: LicenseRef-PersonalUseOnly
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