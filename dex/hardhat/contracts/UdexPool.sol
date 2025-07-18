// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import './libraries/Math.sol';
import './interfaces/IERC20.sol';
import './UdexERC20.sol';

contract UdexPool is UdexERC20("Udex Token", "UDX", 18) {
    uint public constant MINIMUM_LIQUIDITY = 10**3;

    address immutable public factory;
    address public token0;
    address public token1;
    uint public reserve0;
    uint public reserve1;

    event Mint(address indexed sender, uint amount0, uint amount1);
    event Burn(address indexed sender, uint amount0, uint amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint amount0In,
        uint amount1In,
        uint amount0Out,
        uint amount1Out,
        address indexed to
    );

    constructor() {
        factory = msg.sender;
    }

    function initialize(address _token0, address _token1) external {
        require(msg.sender == factory, 'UdexPool: INITIALIZATION_FORBIDDEN');
        token0 = _token0;
        token1 = _token1;
    }

    function mint(address to) external returns (uint liquidity) {
        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));
        uint amount0 = balance0 - reserve0;
        uint amount1 = balance1 - reserve1;

        if (_totalSupply == 0) {
            require(amount0 * amount1 > MINIMUM_LIQUIDITY * MINIMUM_LIQUIDITY, 'UdexPool: BELOW_MINIMUM_LIQUIDITY');
            liquidity = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            _mint(address(0), MINIMUM_LIQUIDITY);
        } else {
            liquidity = Math.min(amount0 * _totalSupply / reserve0, amount1 * _totalSupply / reserve1);
        }
        require(liquidity > 0, 'UdexPool: INSUFFICIENT_LIQUIDITY_MINTED');
        _mint(to, liquidity);
        reserve0 = balance0;
        reserve1 = balance1;
        emit Mint(msg.sender, amount0, amount1);
    }

    function burn(address to) external returns (uint amount0, uint amount1) {
        IERC20 token0Contract = IERC20(token0);
        IERC20 token1Contract = IERC20(token1);

        uint balance0 = token0Contract.balanceOf(address(this));
        uint balance1 = token1Contract.balanceOf(address(this));
        uint liquidity = _balances[address(this)];

        amount0 = liquidity * balance0 / _totalSupply;
        amount1 = liquidity * balance1 / _totalSupply;
        require(amount0 > 0 && amount1 > 0, 'UdexPool: INSUFFICIENT_LIQUIDITY_BURNED');
        _burn(address(this), liquidity);
        bool success0 = token0Contract.transfer(to, amount0);
        require(success0, 'UdexPool: TOKEN0_TRANSFER_FAILED');
        bool success1 = token1Contract.transfer(to, amount1);
        require(success1, 'UdexPool: TOKEN1_TRANSFER_FAILED');

        reserve0 = token0Contract.balanceOf(address(this));
        reserve1 = token1Contract.balanceOf(address(this));
        emit Burn(msg.sender, amount0, amount1, to);
    }

    function swap(uint amount0Out, uint amount1Out, address to) external {
        require(amount0Out > 0 || amount1Out > 0, 'UdexPool: INSUFFICIENT_OUTPUT_AMOUNT');
        require(amount0Out < reserve0 && amount1Out < reserve1, 'UdexPool: INSUFFICIENT_LIQUIDITY');
        require(to != token0 && to != token1, 'UdexPool: INVALID_TO');

        uint balance0;
        uint balance1;
        {
        IERC20 token0Contract = IERC20(token0);
        IERC20 token1Contract = IERC20(token1);
        if (amount0Out > 0) {
            bool success0 = token0Contract.transfer(to, amount0Out);
            require(success0, 'UdexPool: TOKEN0_TRANSFER_FAILED');
        }
        if (amount1Out > 0) {
            bool success1 = token1Contract.transfer(to, amount1Out);
            require(success1, 'udexPool: TOKEN1_TRANSFER_FAILED');
        }
        balance0 = token0Contract.balanceOf(address(this));
        balance1 = token1Contract.balanceOf(address(this));
        }

        uint amount0In = balance0 > reserve0 - amount0Out ? balance0 - (reserve0 - amount0Out) : 0;
        uint amount1In = balance1 > reserve1 - amount1Out ? balance1 - (reserve1 - amount1Out) : 0;
        require(amount0In > 0 || amount1In > 0, 'UdexPool: INSUFFICIENT_INPUT_AMOUNT');

        // fee 0.3%
        uint balance0Adjusted = (balance0 * 1000) - (amount0In * 3);
        uint balance1Adjusted = (balance1 * 1000) - (amount1In * 3);
        require(balance0Adjusted * balance1Adjusted >= reserve0 * reserve1 * 1000**2, 'UdexPool: K');

        reserve0 = balance0;
        reserve1 = balance1;
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }
}