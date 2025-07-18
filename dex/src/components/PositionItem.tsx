import { ethers } from "ethers"
import { BigNumber } from "ethers"
import { useContext, useState, useEffect } from 'react'
import { MouseEvent } from 'react'
import Image from 'next/image'
import { MinusCircleIcon } from '@heroicons/react/24/outline'
import { ChainContext } from '@/components/ChainContext'
import TxDialog from '@/components/TxDialog'
import { loadChainData, loadTokenData, loadTokenLogo } from '@/lib/load'
import { positionItemStyle as style } from '@/styles/tailwindcss'
import UdexPool from '../../hardhat/artifacts/contracts/UdexPool.sol/UdexPool.json'
import UdexERC20 from '../../hardhat/artifacts/contracts/UdexERC20.sol/UdexERC20.json'
import UdexRouter from '../../hardhat/artifacts/contracts/UdexRouter.sol/UdexRouter.json'
const MAX_INT256 = BigNumber.from(2).pow(256).sub(1)

export interface PositionData {
    address0: string
    address1: string
    liquidity: BigNumber
}

interface PositionItemProps {
    value: PositionData
}

const PositionItem = (props: PositionItemProps) => {
    const address0 = props.value.address0
    const address1 = props.value.address1
    const liquidity = props.value.liquidity
    const [displayAmount0, setDisplayAmount0] = useState<string>('')
    const [displayAmount1, setDisplayAmount1] = useState<string>('')
    const [isTxSubmittedOpen, setIsTxSubmittedOpen] = useState<boolean>(false)
    const [isTxConfirmedOpen, setIsTxConfirmedOpen] = useState<boolean>(false)
    const emptyTxInfo = { displayAmount0: '', displayAmount1: '', blockHash: '', transactionHash: '' }
    const [txInfo, setTxInfo] = useState(emptyTxInfo)
    const { chainId, currentAccount, signer, routerAddress, getPoolAddress } = useContext(ChainContext)
    const token0Data = loadTokenData(chainId, address0)!
    const token1Data = loadTokenData(chainId, address1)!

    async function handleRemove(e: MouseEvent<HTMLElement>) {
        const success = await sendRemoveTransaction()

        if (success) {
            setDisplayAmount0('0')
            setDisplayAmount1('0')
        }
    }

    async function sendRemoveTransaction(): Promise<boolean> {
        // Step 1. Give allowance
        const poolAddress: string = await getPoolAddress(address0, address1)
        const pool = new ethers.Contract(poolAddress, UdexPool.abi, signer)
        const liquidity = await pool.balanceOf(currentAccount)
        const allowance = await pool.allowance(currentAccount, routerAddress)
        if (liquidity.gt(allowance)) {
            await pool.approve(routerAddress, MAX_INT256)
                .then((tx0: any) => tx0.wait())
                .catch((error: any) => {
                    console.log('Error while calling pool.approve in handleRemove')
                    return false
                })
        }

        // Step 2. Call removeLiquidity
        const router = new ethers.Contract(routerAddress, UdexRouter.abi, signer)
        const deadline = Math.floor(Date.now() / 1000) + 120
        try {
            const tx = await router.removeLiquidity(address0, address1, liquidity, 0, 0, currentAccount, deadline)
            setTxInfo({
                displayAmount0: displayAmount0,
                displayAmount1: displayAmount1,
                blockHash: '',
                transactionHash: tx.hash
            })
            setIsTxSubmittedOpen(true)
            const receipt = await tx.wait()

            // DEBUG
            await new Promise(resolve => setTimeout(resolve, 3000)); // wait 3 sec

            setTxInfo(prevState => {return { ...prevState, blockHash: receipt.blockHash }})
            setIsTxSubmittedOpen(false)
            setIsTxConfirmedOpen(true)
            return true
        } catch (error: any) {
            console.log('sendRemoveTransaction error', error)
            const code = error?.code
            const reason = error?.reason
            if ( code !== undefined && code !== "ACTION_REJECTED" && reason !== undefined) {
                alert(`[Reason for transaction failure] ${reason}`)
            }
            return false
        }
    }

    useEffect(() => {
        const updateDisplayAmount = async function() {
            const poolAddress = await getPoolAddress(address0, address1)
            const pool = new ethers.Contract(poolAddress, UdexPool.abi, signer.provider)
            const totalSupply = await pool.totalSupply()

            const token0Contract = new ethers.Contract(address0, UdexERC20.abi, signer.provider)
            token0Contract.balanceOf(pool.address).then((reserve0: BigNumber) => {
                const amount0: BigNumber = (reserve0.mul(liquidity)).div(totalSupply)
                setDisplayAmount0(ethers.utils.formatUnits(amount0.toString(), token0Data.decimals))
            })
            const token1Contract = new ethers.Contract(address1, UdexERC20.abi, signer.provider)
            token1Contract.balanceOf(pool.address).then((reserve1: BigNumber) => {
                const amount1: BigNumber = (reserve1.mul(liquidity)).div(totalSupply)
                setDisplayAmount1(ethers.utils.formatUnits(amount1.toString(), token1Data.decimals))
            })
        }
        updateDisplayAmount()
    }, [signer, getPoolAddress, address0, address1, liquidity, token0Data.decimals, token1Data.decimals])

    return (
        <div>
            {/* header (logo) */}
            <div className={style.header}>
                <div className={style.pairLogoContainer}>
                    <div> <Image src={loadTokenLogo(chainId, address0)} alt='logo0' height={18} width={18} />  </div>
                    <div className="-ml-2"> <Image src={loadTokenLogo(chainId, address1)} alt='logo1' height={18} width={18} /> </div>
                </div>
                <div className={style.pairTextContainer}>
                    <span>{token0Data.symbol}</span> <span> / </span> <span>{token1Data.symbol}</span>
                </div>
            </div>
            {/* balance, button */}
            <div className={style.balanceContainer}>
                <div className={style.balance}>
                    <div className={style.balanceText}>{token0Data.symbol} Locked Balance: {displayAmount0}</div>
                    <div className={style.balanceText}>{token1Data.symbol} Locked Balance: {displayAmount1}</div>
                </div>
                <div className={style.removeButtonContainer}>
                    { (displayAmount0 === '0' && displayAmount1 === '0') ?
                        (<div className={style.inactiveRemoveButton}>
                            <MinusCircleIcon className={style.circleIcon}/>
                            Remove
                        </div> ) : (
                        <div onClick={handleRemove} className={style.removeButton}>
                            <MinusCircleIcon className={style.circleIcon}/>
                            Remove
                        </div>)
                    }
                </div>
            </div>
            {/* Dialogs */}
            <TxDialog
                title="Remove Liquidity Transaction Submitted"
                txURL={`${loadChainData(chainId)?.explorer}/tx/${txInfo.transactionHash}`}
                show={isTxSubmittedOpen}
                onClose={() => setIsTxSubmittedOpen(false)}
            />
            <TxDialog
                title="Transaction Confirmed!"
                message= {`${txInfo.displayAmount0} ${token0Data.symbol} and ${txInfo.displayAmount1} ${token1Data.symbol} are sent to your address`}
                txURL={`${loadChainData(chainId)?.explorer}/tx/${txInfo.transactionHash}`}
                show={isTxConfirmedOpen}
                onClose={() => setIsTxConfirmedOpen(false)}
            />
        </div>
    )
}

export default PositionItem