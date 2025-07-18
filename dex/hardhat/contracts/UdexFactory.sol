// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import './UdexPool.sol';

contract UdexFactory {
    mapping(address => mapping(address => address)) public getPool;

    event PoolCreated(address indexed token0, address indexed token1, address pool);

    function createPool(address tokenA, address tokenB) external returns (address pool) {
        require(tokenA != tokenB, 'UdexFactory: IDENTICAL_TOKEN_ADDRESS');
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'UdexFactory: ZERO_ADDRESS');
        require(getPool[token0][token1] == address(0), 'UdexFactory: TOKEN_POOL_EXISTS');
        
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        UdexPool poolContract = new UdexPool{salt: salt}();
        poolContract.initialize(token0, token1);

        pool = address(poolContract);
        getPool[token0][token1] = pool;
        getPool[token1][token0] = pool;
        emit PoolCreated(token0, token1, pool);
    }
}