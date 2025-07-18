// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import '../libraries/UdexLibrary.sol';

contract UdexLibraryTest {
    function quote(uint amountA, uint reserveA, uint reserveB) public pure returns (uint amountB) {
        amountB = UdexLibrary.quote(amountA, reserveA, reserveB);
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) public pure returns (uint amountOut) {
        amountOut = UdexLibrary.getAmountOut(amountIn, reserveIn, reserveOut);
    }
}