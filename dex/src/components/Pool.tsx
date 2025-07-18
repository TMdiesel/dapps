import { ethers } from "ethers"
import { BigNumber } from "ethers"
import { useContext, useState, useEffect } from 'react'
import type { MouseEvent } from 'react'
import { InboxIcon, MinusCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { ChainContext } from '@/components/ChainContext'
import { loadTokenList } from '@/lib/load'
import type { TokenData } from '@/lib/load'
import PositionItem from '@/components/PositionItem'
import type { PositionData } from '@/components/PositionItem'
import AddLiquidityDialog from '@/components/AddLiquidityDialog'
import { poolStyle as style } from '@/styles/tailwindcss'
import UdexPool from '../../hardhat/artifacts/contracts/UdexPool.sol/UdexPool.json'

const Pool = () => {
    const [positions, setPositions] = useState<Map<string, PositionData>>(new Map())
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const { chainId, currentAccount, signer, getPoolAddress } = useContext(ChainContext)

    const positionsArray = Array.from(positions.entries())
    positionsArray.sort(function(x, y) { if (x[0] < y[0]) { return -1 } return 1}) // sort by key

    function handleOpenAddLiquidity(e: MouseEvent<HTMLElement>) {
        setIsOpen(true)
    }

    useEffect(() => {
        const retrievePosition = async function(token0: TokenData, token1: TokenData) {
            const address0 = token0.address
            const address1 = token1.address

            const poolAddress = await getPoolAddress(address0, address1)
            if (poolAddress === undefined) { return }
            const pool = new ethers.Contract(poolAddress, UdexPool.abi, signer.provider)
            const liquidity: BigNumber = await pool.balanceOf(currentAccount)

            if (liquidity.gt(0)) {
                const value = { address0, address1, liquidity }
                setPositions((prevPositions) => {const positions = new Map(prevPositions); positions.set(address0 + address1, value); return positions})
            }
        }

        const retrieveAllPositions = async function(tokenList: TokenData[]) {
            await setPositions(new Map())
            for (let token0 of tokenList) {
                for (let token1 of tokenList) {
                    if (token0.address < token1.address) {
                        retrievePosition(token0, token1)
                    }
                }
            }
        }

        if (currentAccount !== undefined && chainId !== undefined) {
            const tokenList = loadTokenList(chainId)
            retrieveAllPositions(tokenList)
        }

    }, [currentAccount, chainId, signer, getPoolAddress, isOpen])

    return (
        <div className={style.outerContainer}>
            <div className={style.container}>
                <div className={style.headerContainer}>
                    <div className={style.title}> Pools </div>
                    <div className={style.addLiquidityButtonContainer}>
                        <div className={style.addLiquidityButton}>
                            <div onClick={handleOpenAddLiquidity} className={style.addLiquidityButtonText}> + Add Liquidity </div>
                        </div>
                    </div>
                </div>
                {/* Positions */}
                <div className={style.positionsContainer}>
                    {(positionsArray.length === 0) ?
                    (<div className={style.positionsDefault}>
                        <InboxIcon className={style.inboxIcon}/>
                        <div> Your positions will appear here. </div>
                    </div>) :
                    (<>{positionsArray.map((pos, posIdx) =>
                        <PositionItem key={pos[0]} value={pos[1]}/>
                    )}</>)
                    }
                </div>
            </div>
            <AddLiquidityDialog show={isOpen} onClose={() => {setIsOpen(false)}}/>
        </div>
    )
}

export default Pool