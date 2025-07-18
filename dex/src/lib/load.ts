import _chains from '../../data/chains.json'
import _tokens from '../../data/tokens.json'
import _contracts from '../../data/contracts.json'

const chains: ChainData[] = _chains
const tokens: TokenData[] = _tokens
const contracts: ContractData[] = _contracts

export interface ChainData {
    chainId: number
    name: string
    symbol: string
    explorer: string
    logo: string
}

export interface TokenData {
    chainId: number
    address: string
    symbol: string
    name: string
    decimals: number
    logo: string
}

export interface ContractData {
    chainId: number
    factory: string
    router: string
}

export function loadChainData(chainId: number): ChainData | undefined {
    return chains.filter((d: ChainData) => d.chainId === chainId)[0]
}

export function loadChainLogo(chainId: number): string {
    const chain = loadChainData(chainId)
    if (chain !== undefined) {
        return `/${chain.logo}`
    } else {
        return ''
    }
}

export function loadTokenList(chainId: number): TokenData[] {
    return tokens.filter((d: TokenData) => d.chainId === chainId)
}

export function loadTokenData(chainId: number, address: string): TokenData | undefined {
    return tokens.filter(
        (d: TokenData) => (d.chainId === chainId) && d.address.toLowerCase() === address.toLowerCase()
    )[0]
}

export function loadTokenLogo(chainId: number, address: string): string {
    const token = loadTokenList(chainId).filter((tkn: TokenData) => tkn["address"] === address)[0]
    if (token !== undefined) {
        return `/${token["logo"]}`
    } else {
        return "/tokens/Default.svg"
    }
}

export function loadContractData(chainId: number): ContractData | undefined {
    return contracts.filter((d: ContractData) => d.chainId === chainId)[0]
}



