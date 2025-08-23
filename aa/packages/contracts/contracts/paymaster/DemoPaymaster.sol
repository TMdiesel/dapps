// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";

contract DemoPaymaster is BasePaymaster {
    mapping(address => uint256) public balanceOf;
    mapping(address => bool) public whitelistedUsers;
    
    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event UserWhitelisted(address indexed user);
    
    constructor(IEntryPoint _entryPoint) BasePaymaster(_entryPoint) {}
    
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
    
    function _validatePaymasterUserOp(PackedUserOperation calldata userOp, bytes32, uint256 maxCost)
        internal override returns (bytes memory context, uint256 validationData) {
        
        // Simple whitelist check
        if (!whitelistedUsers[userOp.sender]) {
            return ("", 1); // validation failed
        }
        
        return (abi.encode(userOp.sender, maxCost), 0); // validation success
    }
    
    // No postOp needed for simple demo
    
    receive() external payable {
        depositFor(msg.sender);
    }
}