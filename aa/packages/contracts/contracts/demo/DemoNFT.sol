// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DemoNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public mintPrice = 0.01 ether;
    
    mapping(address => uint256) public mintedCount;
    uint256 public constant MAX_MINT_PER_ADDRESS = 5;
    
    string private _baseTokenURI;
    
    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    
    constructor() ERC721("Demo NFT", "DNFT") Ownable(msg.sender) {
        _baseTokenURI = "https://demo-nft.example.com/metadata/";
    }
    
    function mint(address to) external payable {
        require(_tokenIdCounter < MAX_SUPPLY, "Max supply reached");
        require(mintedCount[to] < MAX_MINT_PER_ADDRESS, "Max mint per address reached");
        require(msg.value >= mintPrice, "Insufficient payment");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        mintedCount[to]++;
        _safeMint(to, tokenId);
        
        string memory uri = string(abi.encodePacked(_baseTokenURI, _toString(tokenId)));
        _setTokenURI(tokenId, uri);
        
        emit NFTMinted(to, tokenId, uri);
    }
    
    function freeMint(address to) external onlyOwner {
        require(_tokenIdCounter < MAX_SUPPLY, "Max supply reached");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        
        string memory uri = string(abi.encodePacked(_baseTokenURI, _toString(tokenId)));
        _setTokenURI(tokenId, uri);
        
        emit NFTMinted(to, tokenId, uri);
    }
    
    function setMintPrice(uint256 _mintPrice) external onlyOwner {
        mintPrice = _mintPrice;
    }
    
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
    
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    

    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}