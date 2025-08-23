// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SimpleDEX is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct Pool {
        IERC20 tokenA;
        IERC20 tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidity;
    }
    
    mapping(bytes32 => Pool) public pools;
    mapping(address => mapping(address => bytes32)) public getPoolId;
    
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    uint256 public constant FEE_RATE = 3; // 0.3%
    uint256 public constant FEE_DENOMINATOR = 1000;
    
    event PoolCreated(address indexed tokenA, address indexed tokenB, bytes32 poolId);
    event LiquidityAdded(address indexed user, bytes32 poolId, uint256 amountA, uint256 amountB, uint256 liquidity);
    event LiquidityRemoved(address indexed user, bytes32 poolId, uint256 amountA, uint256 amountB, uint256 liquidity);
    event Swap(address indexed user, bytes32 poolId, address tokenIn, uint256 amountIn, uint256 amountOut);
    
    constructor() Ownable(msg.sender) {}
    
    function createPool(address tokenA, address tokenB) external returns (bytes32 poolId) {
        require(tokenA != tokenB, "Identical tokens");
        require(tokenA != address(0) && tokenB != address(0), "Zero address");
        
        // Sort tokens to ensure consistent pool ID
        if (tokenA > tokenB) {
            (tokenA, tokenB) = (tokenB, tokenA);
        }
        
        require(getPoolId[tokenA][tokenB] == bytes32(0), "Pool already exists");
        
        poolId = keccak256(abi.encodePacked(tokenA, tokenB));
        
        Pool storage pool = pools[poolId];
        pool.tokenA = IERC20(tokenA);
        pool.tokenB = IERC20(tokenB);
        
        getPoolId[tokenA][tokenB] = poolId;
        getPoolId[tokenB][tokenA] = poolId;
        
        emit PoolCreated(tokenA, tokenB, poolId);
    }
    
    function addLiquidity(
        bytes32 poolId,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        Pool storage pool = pools[poolId];
        require(address(pool.tokenA) != address(0), "Pool does not exist");
        
        if (pool.reserveA == 0 && pool.reserveB == 0) {
            // First liquidity provision
            amountA = amountADesired;
            amountB = amountBDesired;
            liquidity = sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
            pool.totalLiquidity = liquidity + MINIMUM_LIQUIDITY;
        } else {
            // Calculate optimal amounts
            uint256 amountBOptimal = (amountADesired * pool.reserveB) / pool.reserveA;
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "Insufficient B amount");
                amountA = amountADesired;
                amountB = amountBOptimal;
            } else {
                uint256 amountAOptimal = (amountBDesired * pool.reserveA) / pool.reserveB;
                require(amountAOptimal <= amountADesired && amountAOptimal >= amountAMin, "Insufficient A amount");
                amountA = amountAOptimal;
                amountB = amountBDesired;
            }
            
            liquidity = min(
                (amountA * pool.totalLiquidity) / pool.reserveA,
                (amountB * pool.totalLiquidity) / pool.reserveB
            );
        }
        
        require(liquidity > 0, "Insufficient liquidity minted");
        
        pool.tokenA.safeTransferFrom(msg.sender, address(this), amountA);
        pool.tokenB.safeTransferFrom(msg.sender, address(this), amountB);
        
        pool.reserveA += amountA;
        pool.reserveB += amountB;
        pool.totalLiquidity += liquidity;
        pool.liquidity[msg.sender] += liquidity;
        
        emit LiquidityAdded(msg.sender, poolId, amountA, amountB, liquidity);
    }
    
    function removeLiquidity(
        bytes32 poolId,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        Pool storage pool = pools[poolId];
        require(address(pool.tokenA) != address(0), "Pool does not exist");
        require(pool.liquidity[msg.sender] >= liquidity, "Insufficient liquidity");
        
        amountA = (liquidity * pool.reserveA) / pool.totalLiquidity;
        amountB = (liquidity * pool.reserveB) / pool.totalLiquidity;
        
        require(amountA >= amountAMin && amountB >= amountBMin, "Insufficient amounts");
        
        pool.liquidity[msg.sender] -= liquidity;
        pool.totalLiquidity -= liquidity;
        pool.reserveA -= amountA;
        pool.reserveB -= amountB;
        
        pool.tokenA.safeTransfer(msg.sender, amountA);
        pool.tokenB.safeTransfer(msg.sender, amountB);
        
        emit LiquidityRemoved(msg.sender, poolId, amountA, amountB, liquidity);
    }
    
    function swap(
        bytes32 poolId,
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin
    ) external nonReentrant returns (uint256 amountOut) {
        Pool storage pool = pools[poolId];
        require(address(pool.tokenA) != address(0), "Pool does not exist");
        
        bool isTokenA = tokenIn == address(pool.tokenA);
        require(isTokenA || tokenIn == address(pool.tokenB), "Invalid token");
        
        (uint256 reserveIn, uint256 reserveOut, IERC20 tokenInContract, IERC20 tokenOutContract) = 
            isTokenA ? 
            (pool.reserveA, pool.reserveB, pool.tokenA, pool.tokenB) :
            (pool.reserveB, pool.reserveA, pool.tokenB, pool.tokenA);
        
        require(amountIn > 0 && reserveIn > 0 && reserveOut > 0, "Invalid swap");
        
        // Calculate output amount with fee
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_RATE);
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * FEE_DENOMINATOR + amountInWithFee);
        
        require(amountOut >= amountOutMin, "Insufficient output amount");
        require(amountOut < reserveOut, "Insufficient liquidity");
        
        tokenInContract.safeTransferFrom(msg.sender, address(this), amountIn);
        tokenOutContract.safeTransfer(msg.sender, amountOut);
        
        if (isTokenA) {
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
        }
        
        emit Swap(msg.sender, poolId, tokenIn, amountIn, amountOut);
    }
    
    function getAmountOut(bytes32 poolId, address tokenIn, uint256 amountIn) 
        external view returns (uint256 amountOut) {
        Pool storage pool = pools[poolId];
        require(address(pool.tokenA) != address(0), "Pool does not exist");
        
        bool isTokenA = tokenIn == address(pool.tokenA);
        require(isTokenA || tokenIn == address(pool.tokenB), "Invalid token");
        
        (uint256 reserveIn, uint256 reserveOut) = 
            isTokenA ? (pool.reserveA, pool.reserveB) : (pool.reserveB, pool.reserveA);
        
        require(amountIn > 0 && reserveIn > 0 && reserveOut > 0, "Invalid input");
        
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_RATE);
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * FEE_DENOMINATOR + amountInWithFee);
    }
    
    function getReserves(bytes32 poolId) external view returns (uint256 reserveA, uint256 reserveB) {
        Pool storage pool = pools[poolId];
        reserveA = pool.reserveA;
        reserveB = pool.reserveB;
    }
    
    function getUserLiquidity(bytes32 poolId, address user) external view returns (uint256) {
        return pools[poolId].liquidity[user];
    }
    
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
    
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}