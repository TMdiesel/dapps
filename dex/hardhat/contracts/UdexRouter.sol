// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import './libraries/UdexLibrary.sol';
import './interfaces/IERC20.sol';
import './UdexPool.sol';
import './UdexFactory.sol';

contract UdexRouter {
    address public immutable factory;

    constructor(address _factory) {
        factory = _factory;
    }

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'UdexRouter: EXPIRED');
        _;
    }

    function _addLiquidity(
        address pool,
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin
    ) internal view returns (uint amountA, uint amountB) {
        uint reserve0 = UdexPool(pool).reserve0();
        uint reserve1 = UdexPool(pool).reserve1();
        (uint reserveA, uint reserveB) = tokenA < tokenB ? (reserve0, reserve1) : (reserve1, reserve0);

        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint amountBOptimal = UdexLibrary.quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, 'UdexRouter: INSUFFICIENT_B_AMOUNT');
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint amountAOptimal = UdexLibrary.quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, 'UdexRouter: INSUFFICIENT_A_AMOUNT');
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external ensure(deadline) returns (uint amountA, uint amountB, uint liquidity) {
        address pool = UdexFactory(factory).getPool(tokenA, tokenB);
        if (pool == address(0)) {
            UdexFactory(factory).createPool(tokenA, tokenB);
            pool = UdexFactory(factory).getPool(tokenA, tokenB);
        }
        (amountA, amountB) = _addLiquidity(pool, tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);

        bool successA = IERC20(tokenA).transferFrom(msg.sender, pool, amountA);
        require(successA, 'UdexRouter: TOKEN_A_TRANSFER_FAILED');
        bool successB = IERC20(tokenB).transferFrom(msg.sender, pool, amountB);
        require(successB, 'UdexRouter: TOKEN_B_TRANSFER_FAILED');

        liquidity = UdexPool(pool).mint(to);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external ensure(deadline) returns (uint amountA, uint amountB) {
        address pool = UdexFactory(factory).getPool(tokenA, tokenB);
        require(pool != address(0), 'UdexRouter: POOL_DOES_NOT_EXIST');
        UdexPool(pool).transferFrom(msg.sender, pool, liquidity);
        (uint amount0, uint amount1) = UdexPool(pool).burn(to);
        (amountA, amountB) = tokenA < tokenB ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, 'UdexRouter: INSUFFICIENT_A_AMOUNT');
        require(amountB >= amountBMin, 'UdexRouter: INSUFFICIENT_B_AMOUNT');
    }

    function swapTokenPair(
        address tokenIn,
        address tokenOut,
        uint amountIn,
        uint amountOutMin,
        address to,
        uint deadline
    ) external ensure(deadline) returns (uint amountOut) {
        address pool = UdexFactory(factory).getPool(tokenIn, tokenOut);
        require(pool != address(0), 'UdexRouter: POOL_DOES_NOT_EXIST');

        {  // Avoid stack too deep error
        uint reserve0 = UdexPool(pool).reserve0();
        uint reserve1 = UdexPool(pool).reserve1();
        (uint reserveIn, uint reserveOut) = tokenIn < tokenOut ? (reserve0, reserve1) : (reserve1, reserve0);
        amountOut = UdexLibrary.getAmountOut(amountIn, reserveIn, reserveOut);
        }
        require(amountOut >= amountOutMin, 'UdexRouter: INSUFFICIENT_OUTPUT_AMOUNT');

        bool success = IERC20(tokenIn).transferFrom(msg.sender, pool, amountIn);
        require(success, 'UdexRouter: TOKEN_IN_TRANSFER_FAILED');
        (uint amount0Out, uint amount1Out) = tokenIn < tokenOut ? (uint(0), amountOut) : (amountOut, uint(0));
        UdexPool(pool).swap(amount0Out, amount1Out, to);
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut) {
        amountOut = UdexLibrary.getAmountOut(amountIn, reserveIn, reserveOut);
    }
}