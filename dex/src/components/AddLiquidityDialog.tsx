import { ethers, BigNumber } from "ethers"
import { useContext, useState, useEffect } from 'react'
import type { ChangeEvent, MouseEvent } from 'react'
import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ChainContext } from '@/components/ChainContext'
import { loadChainData, loadTokenData } from '@/lib/load'
import type { TokenData } from '@/lib/load'
import type { TokenField } from '@/components/Swap'
import TokenCombobox from '@/components/TokenCombobox'
import TxDialog from '@/components/TxDialog'
import { AddLiquidityStyle as style } from '@/styles/tailwindcss'
import UdexPool from '../../hardhat/artifacts/contracts/UdexPool.sol/UdexPool.json'
import UdexRouter from '../../hardhat/artifacts/contracts/UdexRouter.sol/UdexRouter.json'
import UdexERC20 from '../../hardhat/artifacts/contracts/UdexERC20.sol/UdexERC20.json'

interface AddLiquidityDialogProps {
    show: boolean
    onClose: () => void
}

const AddLiquidityDialog = (props: AddLiquidityDialogProps) => {
    const { show, onClose } = props
    const emptyField: TokenField = { address: '', displayAmount: '', displayBalance: '' }
    const [AField, setAField] = useState<TokenField>(emptyField)
    const [BField, setBField] = useState<TokenField>(emptyField)
    const [isNewPair, setIsNewPair] = useState<boolean>(false)
    const [isFilled, setIsFilled] = useState<boolean>(false)
    const [hasAllowanceA, setHasAllowanceA] = useState<boolean>(false)
    const [hasAllowanceB, setHasAllowanceB] = useState<boolean>(false)
    const [isTxSubmittedOpen, setIsTxSubmittedOpen] = useState<boolean>(false)
    const [isTxConfirmedOpen, setIsTxConfirmedOpen] = useState<boolean>(false)
    const emptyTxInfo = { symbolA: '', symbolB: '', displayAmountDepositedA: '', displayAmountDepositedB: '', blockHash: '', transactionHash: '' }
    const [txInfo, setTxInfo] = useState(emptyTxInfo)
    const { chainId, currentAccount, signer, routerAddress, getDisplayBalance, getPoolAddress, getAllowance, sendApprovalTransaction } = useContext(ChainContext)

    function closeAndCleanUp() {
        onClose()
        setAField(emptyField)
        setBField(emptyField)
        setIsNewPair(false)
        setIsFilled(false)
        setHasAllowanceA(false)
        setHasAllowanceB(false)
    }

    function handleAmountAChange(e: ChangeEvent<HTMLInputElement>) {
        const cleansedDisplayAmountIn = e.target.value.replace(/[^0-9.]+/g, '')  // remove characters except numbers and DOT
        setAField((prevState: TokenField) => {return { ...prevState, displayAmount: cleansedDisplayAmountIn }})
    }

    function handleAmountBChange(e: ChangeEvent<HTMLInputElement>) {
        const cleansedDisplayAmountIn = e.target.value.replace(/[^0-9.]+/g, '')  // remove characters except numbers and DOT
        setBField((prevState: TokenField) => {return { ...prevState, displayAmount: cleansedDisplayAmountIn }})
    }

    async function handleApproval(e: MouseEvent<HTMLElement>, address: string, setterBoolean: React.Dispatch<React.SetStateAction<boolean>>) {
        const success: boolean = await sendApprovalTransaction(address)
        if (success) {
            setterBoolean(true)
        }
    }

    async function handleAdd(e: MouseEvent<HTMLElement>) {
        const success = await sendAddTransaction()
        if (success) {
            closeAndCleanUp()
        }
    }

    async function sendAddTransaction(): Promise<boolean> {
        const addressA = AField.address
        const displayAmountA = AField.displayAmount
        const decimalsA = loadTokenData(chainId, addressA)!.decimals
        const symbolA = loadTokenData(chainId, addressA)!.symbol
        const tokenA = new ethers.Contract(addressA, UdexERC20.abi, signer)
        const amountADesired = ethers.utils.parseUnits(displayAmountA, decimalsA)

        const addressB = BField.address
        const displayAmountB = BField.displayAmount
        const decimalsB = loadTokenData(chainId, addressB)!.decimals
        const symbolB = loadTokenData(chainId, addressB)!.symbol
        const tokenB = new ethers.Contract(addressB, UdexERC20.abi, signer)
        const amountBDesired = ethers.utils.parseUnits(displayAmountB, decimalsB)

        const deadline = Math.floor(Date.now() / 1000) + 120
        const router = new ethers.Contract(routerAddress, UdexRouter.abi, signer)

        try {
            const tx = await router.addLiquidity(tokenA.address, tokenB.address, amountADesired, amountBDesired, 0, 0, currentAccount, deadline)
            setTxInfo({
                ...emptyTxInfo,
                symbolA,
                symbolB,
                transactionHash: tx.hash
            })
            setIsTxSubmittedOpen(true)

            // Debug
            await new Promise(resolve => setTimeout(resolve, 3000)); // wait 3 sec

            const receipt = await tx.wait()
            const poolInterface = new ethers.utils.Interface(UdexPool.abi)
            const poolAddress = await getPoolAddress(addressA, addressB)
            const parsedLogs = receipt.logs
                .filter((log: any) => log.address.toLowerCase() === poolAddress.toLowerCase())
                .map((log: any) => poolInterface.parseLog(log))
            const MintEvent = parsedLogs.filter((event: any) => event.name === 'Mint')[0]
            const [sender, amount0, amount1] = MintEvent.args
            const [amountDepositedA, amountDepositedB] = addressA < addressB ? [amount0, amount1] : [amount1, amount0]
            const displayAmountDepositedA = ethers.utils.formatUnits(amountDepositedA, decimalsA)
            const displayAmountDepositedB = ethers.utils.formatUnits(amountDepositedB, decimalsB)
            setTxInfo(prevState => {return { ...prevState,
                blockHash: receipt.blockHash,
                displayAmountDepositedA: displayAmountDepositedA,
                displayAmountDepositedB: displayAmountDepositedB,
            }})
            setIsTxSubmittedOpen(false)
            setIsTxConfirmedOpen(true)
            return true
        } catch (error: any) {
            console.log('sendAddTransaction error', error)
            const code = error?.code
            const reason = error?.reason
            if ( code !== undefined && code !== "ACTION_REJECTED" && reason !== undefined) {
                alert(`[Reason for transaction failure] ${reason}`)
            }
            return false
        }
    }

    useEffect(() => {
        const updateDisplayAmountB = async function(addressA: string, addressB: string, amountA: BigNumber, decimalsB: number) {
            const poolAddress: string | undefined = await getPoolAddress(addressA, addressB)
            if (poolAddress !== undefined) {
                const pool = new ethers.Contract(poolAddress, UdexPool.abi, signer.provider);
                const reserve0 = await pool.reserve0()
                const reserve1 = await pool.reserve1()
                const [reserveA, reserveB] = (addressA < addressB) ? [reserve0, reserve1] : [reserve1, reserve0]
                const amountB: BigNumber = amountA.mul(reserveB).div(reserveA)
                const displayAmountB: string = ethers.utils.formatUnits(amountB, decimalsB)
                setBField((prevState: TokenField) => {return { ...prevState, displayAmount: displayAmountB }})
                hasAllowance(addressB, amountB).then(setHasAllowanceB)
            } else {
                let amountB: BigNumber
                try {
                    amountB = ethers.utils.parseUnits(BField.displayAmount, decimalsB)
                }
                catch (e: any) {
                    alert(`Invalid 2nd token input: ${e.reason}`)
                    return
                }
                hasAllowance(addressB, amountB).then(setHasAllowanceB)
            }
        }

        const hasAllowance = async function(address: string, requiredAllowance: BigNumber): Promise<boolean> {
            const allowance: BigNumber = await getAllowance(address)
            if (allowance.lt(requiredAllowance)) {
                return false
            } else {
                return true
            }
        }

        if ((AField.displayAmount !== "") && (!isNewPair || BField.displayAmount !== "") && (AField.address !== "") && (BField.address !== "") && (AField.address !== BField.address)) {
            const addressA = AField.address
            const addressB = BField.address
            const tokenAData: TokenData = loadTokenData(chainId, addressA)!
            const tokenBData: TokenData = loadTokenData(chainId, addressB)!
            let amountA: BigNumber
            try {
                amountA = ethers.utils.parseUnits(AField.displayAmount, tokenAData.decimals)
            } catch (e: any) {
                alert(`Invalid 1st token input: ${e.reason}`)
                return
            }
            hasAllowance(addressA, amountA).then(setHasAllowanceA)
            updateDisplayAmountB(addressA, addressB, amountA, tokenBData.decimals)
            setIsFilled(true)
        } else {
            setIsFilled(false)
        }

        // if input amount is empty, then clear the output amount
        if (AField.displayAmount === "") {
            setBField((prevState: TokenField) => {return { ...prevState, displayAmount: "" }})
        }
    }, [AField.address, AField.displayAmount, BField.address, BField.displayAmount, isNewPair, chainId, signer, getPoolAddress, getAllowance])

    useEffect(() => {
        if (AField.address !== "" && AField.address === BField.address) {
            alert("Please select a different token")
            return
        }

        if (AField.address !== "" && BField.address !=="") {
            getPoolAddress(AField.address, BField.address).then((poolAddress: string | undefined) => {
                if (poolAddress === undefined) { setIsNewPair(true) } else { setIsNewPair(false) }
            })
        }

        // Show "Balance" of each token
        if (AField.address !== "") {
            getDisplayBalance(AField.address).then((displayBalance: string) => {
                setAField((prevState: TokenField) => {return { ...prevState, displayBalance: displayBalance }})
            })
        }
        if (BField.address !== "") {
            getDisplayBalance(BField.address).then((displayBalance: string) => {
                setBField((prevState: TokenField) => {return { ...prevState, displayBalance: displayBalance }})
            })
        }
    }, [AField.address, BField.address, getDisplayBalance, getPoolAddress])

    return (
        <>
            <Transition appear show={show} as={Fragment}>
                <Dialog as="div" className={style.dialog} onClose={closeAndCleanUp}>
                    <Dialog.Overlay className={style.overlay}/>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <div className={style.panelContainer}>
                            <Dialog.Panel className={style.panel}>
                                <div className={style.titleContainer}>
                                    <Dialog.Title as="h3" className={style.title}>
                                        Add Liquidity to a Pool
                                    </Dialog.Title>
                                </div>
                                <div>
                                    {/* token A */}
                                    <div className={style.currencyContainer}>
                                        <div className={style.currencyInputContainer}>
                                            <input
                                                type='text'
                                                className={style.currencyInput}
                                                placeholder='0'
                                                onChange={handleAmountAChange}
                                                value={AField.displayAmount}
                                            />
                                        </div>
                                        <div className={style.currencySelector}>
                                            <TokenCombobox chainId={chainId} setTokenField={setAField}/>
                                        </div>
                                    </div>
                                    <div className={style.currencyBalanceContainer}>
                                        <div className={style.currencyBalance}>
                                            { AField.displayBalance !== "" ? (<>{`Balance: ${AField.displayBalance}`}</>) : null }
                                        </div>
                                    </div>
                                    {/* token B*/}
                                    <div className={style.currencyContainer}>
                                        <div className={style.currencyInputContainer}>
                                            <input
                                                type='text'
                                                className={style.currencyInput}
                                                placeholder='0'
                                                disabled={!isNewPair}
                                                onChange={handleAmountBChange}
                                                value={BField.displayAmount}
                                            />
                                        </div>
                                        <div className={style.currencySelector}>
                                            <TokenCombobox chainId={chainId} setTokenField={setBField}/>
                                        </div>
                                    </div>
                                    <div className={style.currencyBalanceContainer}>
                                        <div className={style.currencyBalance}>
                                            { BField.displayBalance !== "" ? (<>{`Balance: ${BField.displayBalance}`}</>) : null }
                                        </div>
                                    </div>
                                    {/* buttons */}
                                    <div className={style.messageContainer}>
                                        {isNewPair ? (<div>New Pool will be created. Please deposit tokens of equal value at current market prices.</div>) : null }
                                    </div>
                                    <div className={style.buttonOuterContainer}>
                                        {!isFilled ? (<button type="button" className={style.inactiveConfirmButton}>Confirm</button>) : null }
                                        {(isFilled && (!hasAllowanceA || !hasAllowanceB) ) ? (
                                            <div className={style.buttonListContainer}>
                                                { !hasAllowanceA ? (
                                                    <button onClick={e => handleApproval(e, AField.address, setHasAllowanceA)} className={style.approveButton}>
                                                        {`Allow to use your ${loadTokenData(chainId, AField.address)?.symbol} (one time approval)`}
                                                    </button>) : null }
                                                { !hasAllowanceB ? (
                                                    <button onClick={e => handleApproval(e, BField.address, setHasAllowanceB)} className={style.approveButton}>
                                                        {`Allow to use your ${loadTokenData(chainId, BField.address)?.symbol} (one time approval)`}
                                                    </button>) : null }
                                            </div>
                                        ) : null }
                                        {(isFilled && hasAllowanceA && hasAllowanceB) ? (
                                            <button type="button" className={style.confirmButton} onClick={handleAdd}>Confirm</button>
                                        ) : null }
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </div>
                    </Transition.Child>
                </Dialog>
            </Transition>
            {/* AddLiquidity Transaction Dialogs */}
            <TxDialog
                title="Transaction Submitted"
                txURL={`${loadChainData(chainId)?.explorer}/tx/${txInfo.transactionHash}`}
                show={isTxSubmittedOpen}
                onClose={() => setIsTxSubmittedOpen(false)}
            />
            <TxDialog
                title="Transaction Confirmed!"
                message= {`${txInfo.displayAmountDepositedA} ${txInfo.symbolA} and ${txInfo.displayAmountDepositedB} ${txInfo.symbolB} are sent from your address to the pool.`}
                txURL={`${loadChainData(chainId)?.explorer}/tx/${txInfo.transactionHash}`}
                show={isTxConfirmedOpen}
                onClose={() => setIsTxConfirmedOpen(false)}
            />
        </>
    )
}

export default AddLiquidityDialog