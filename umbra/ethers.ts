/**
 * @notice Helper file to import all ethers.js methods used in umbra-js (excluding tests). This has two benefits:
 *   1. Easy to track all ethers packages used since all imports are in this file
 *   2. Removes noise from having a lot of import lines in other packages
 */

export { defaultAbiCoder } from "@ethersproject/abi"
export { getAddress } from "@ethersproject/address"
export { BigNumber } from "@ethersproject/bignumber"
export type { BigNumberish } from "@ethersproject/bignumber"
export { arrayify, hexlify, hexZeroPad, isHexString, splitSignature } from "@ethersproject/bytes"
export type { SignatureLike } from "@ethersproject/bytes"
export { AddressZero, HashZero, Zero } from "@ethersproject/constants"
export { Contract } from "@ethersproject/contracts"
export type {
    ContractInterface,
    ContractTransaction,
    Event,
    Overrides,
} from "@ethersproject/contracts"
export { namehash } from "@ethersproject/hash"
export { keccak256 } from "@ethersproject/keccak256"
export { resolveProperties } from "@ethersproject/properties"
export {
    EtherscanProvider,
    JsonRpcSigner,
    StaticJsonRpcProvider,
    Web3Provider,
} from "@ethersproject/providers"
export type {
    Block,
    ExternalProvider,
    JsonRpcFetchFunc,
    TransactionReceipt,
    TransactionResponse,
} from "@ethersproject/providers"
export { sha256 } from "@ethersproject/sha2"
export { toUtf8Bytes } from "@ethersproject/strings"
export { computeAddress, serialize } from "@ethersproject/transactions"
export type { UnsignedTransaction } from "@ethersproject/transactions"
export { Wallet } from "@ethersproject/wallet"
