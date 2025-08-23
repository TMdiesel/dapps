// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// Simplified Paymaster for demo purposes (without Account Abstraction dependencies)
contract MockPaymaster {
    mapping(address => uint256) public balanceOf;
    mapping(address => bool) public whitelistedUsers;
    
    address public owner;
    
    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event UserWhitelisted(address indexed user);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function depositFor(address account) public payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        balanceOf[account] += msg.value;
        emit Deposited(account, msg.value);
    }
    
    function withdraw(uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdrawn(msg.sender, amount);
    }
    
    function addToWhitelist(address user) external onlyOwner {
        whitelistedUsers[user] = true;
        emit UserWhitelisted(user);
    }
    
    function removeFromWhitelist(address user) external onlyOwner {
        whitelistedUsers[user] = false;
    }
    
    function isWhitelisted(address user) external view returns (bool) {
        return whitelistedUsers[user];
    }
    
    receive() external payable {
        depositFor(msg.sender);
    }
}