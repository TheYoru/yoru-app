import { BigNumber, Contract, providers, utils, Wallet } from "ethers"
import { getTextRecordFromEns } from "./ens"
import { KeyPair } from "@/umbra/classes/KeyPair"
import { RandomNumber } from "@/umbra/classes/RandomNumber"

import { abi as userOpHelperABI } from "./abis/UserOpHelper.json"
import { abi as yoruABI } from "./abis/Yoru.json"
import { abi as walletFactoryABI } from "./abis/StealthWalletFactory.json"
import { abi as entryPointABI } from "./abis/EntryPoint.json"

const ETH_TOKEN_PLACHOLDER = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
const userOpHelperAddress = "0x63087b831D80Db6f65930339cFA38D4f7E486db3"
const paymasterAddress = "0xb666fE2b562be86590c4DF43F12Ab1DBA9EC209C"
const entryPointAddress = "0x0576a174D229E3cFA37253523E645A78A0C91B57"
export const STEALTH_CONTRACT_ADDRESS = "0x8D977171D2515f375d0E8E8623e7e27378eE70Fa"
export const STEALTH_FACTORY_ADDRESS = "0xb1ae118a4f5089812296BC2714a0cB261f99cEBb"
export const STEALTH_PUBKEY = "publickey"
export const contractBlock = 8838032
const transferERC20_withInitcode_withPaymaster_UserOp_FUNCTION_SIG =
    "transferERC20_withInitcode_withPaymaster_UserOp(address,address,uint256,address,uint256,address,uint256,uint256,uint256)"
const transferETH_withInitcode_withPaymaster_UserOp_FUNCTION_SIG =
    "transferETH_withInitcode_withPaymaster_UserOp(address,uint256,address,uint256,address,uint256,uint256,uint256)"

export interface AssetInfo {
    AccountAddress: string
    AssetAddress: string
    Amount: BigNumber
    Salt: string
    PrivateKey: string
}

export function generateViewingPrivateKey(signatureData: string): string {
    const privateKey = utils.keccak256(utils.toUtf8Bytes(signatureData))
    return privateKey
}

async function fetchAnnouncements(
    provider: providers.Provider,
    fromBlock: number,
    toBlock: number,
) {
    const stealthContract = new Contract(STEALTH_CONTRACT_ADDRESS, yoruABI, provider)
    const announcement = stealthContract.filters.Announcement()
    return stealthContract.queryFilter(announcement, fromBlock, toBlock)
}

export async function getAssets(
    provider: providers.Provider,
    privateKey: string,
    fromBlock: number,
    toBlock: number,
) {
    console.log(fromBlock);
    console.log(toBlock);
    const keypair = new KeyPair(privateKey)
    const announcements = await fetchAnnouncements(provider, fromBlock, toBlock)
    let assetInfos: AssetInfo[] = []
    for (var i = 0; i < announcements.length; i++) {
        try {
            const announce = announcements[i]
            const event = announce.args
            if (event != undefined) {
                const pkx = event["pkx"]
                console.log(`tx: ${announce.transactionHash}, pkx: ${pkx}`)
                const publicKey = KeyPair.getUncompressedFromX(pkx)
                console.log(`publicKey: ${publicKey}`)
                const ciphertext = event["ciphertext"]
                const randomNumberInHex = keypair.decrypt({
                    ephemeralPublicKey: publicKey,
                    ciphertext: ciphertext,
                })
                const newKeypair = keypair.mulPrivateKey(randomNumberInHex)
    
                const aaAddr = await getAAAddress(provider, newKeypair.address, randomNumberInHex)
                const salt = utils.keccak256(randomNumberInHex)
                console.log(aaAddr)
                console.log(newKeypair)
                if (aaAddr[0].toLowerCase() == event["receiver"].toLowerCase()) {
                    const amount: BigNumber = event["amount"]
                    assetInfos.push({
                        AssetAddress: event["token"],
                        Amount: amount,
                        PrivateKey: newKeypair.privateKeyHex!,
                        AccountAddress: aaAddr,
                        Salt: salt,
                    })
                }
            }
        } catch (e) {
            console.log(e)
        }

    }
    return assetInfos
}

export async function getReceiverPkxAndCiphertext(provider: providers.Provider, ens: string) {
    // get pkx and cipher text
    const pubkey = await getTextRecordFromEns(ens, STEALTH_PUBKEY)
    const keypair = new KeyPair(pubkey)
    const randomNumber = new RandomNumber()
    const encrypted = keypair.encrypt(randomNumber)
    const { pubKeyXCoordinate } = KeyPair.compressPublicKey(encrypted.ephemeralPublicKey)
    const stealthKeyPair = keypair.mulPublicKey(randomNumber)

    // get aa addr
    const abstractAccountAddr = getAAAddress(provider, stealthKeyPair.address, randomNumber.asHex)

    return {
        receiver: abstractAccountAddr,
        pkx: pubKeyXCoordinate,
        ciphertext: encrypted.ciphertext,
    }
}

export async function getDumpReceiverPkxAndCiphertext(provider: providers.Provider, publicKey: string) {
    // get pkx and cipher text
    const pubkey = publicKey;
    console.log(pubkey)
    const keypair = new KeyPair(pubkey)
    const randomNumber = new RandomNumber()
    const encrypted = keypair.encrypt(randomNumber)
    const { pubKeyXCoordinate } = KeyPair.compressPublicKey(encrypted.ephemeralPublicKey)
    const stealthKeyPair = keypair.mulPublicKey(randomNumber)

    // get aa addr
    const abstractAccountAddr = await getAAAddress(provider, stealthKeyPair.address, randomNumber.asHex)

    return {
        receiver: abstractAccountAddr,
        pkx: pubKeyXCoordinate,
        ciphertext: encrypted.ciphertext,
    }
}

export async function getWithdrawUserOps(provider: any, assets: AssetInfo[], toAddress: string) {
    const userOpHelper = new Contract(userOpHelperAddress, userOpHelperABI, provider)
    const feeData = await provider.getFeeData()

    let userOps = []
    for (let asset of assets) {
        const walletOwner = new Wallet(asset.PrivateKey)
        if (asset.AssetAddress.toLowerCase() == ETH_TOKEN_PLACHOLDER.toLowerCase()) {
            const userOpData = await userOpHelper.functions[
                transferETH_withInitcode_withPaymaster_UserOp_FUNCTION_SIG
            ](
                toAddress, // eth recipient
                asset.Amount, // amount
                walletOwner.address, // wallet owner
                asset.Salt,
                paymasterAddress,
                Math.floor(Date.now() / 1000), // current timestamp
                feeData.maxFeePerGas,
                feeData.maxPriorityFeePerGas,
            )
            const userOp = [...userOpData[0]]
            const userOpHash = userOpData[1]
            const userOpSignature = await walletOwner.signMessage(utils.arrayify(userOpHash))
            // put signature into user op
            userOp[10] = userOpSignature

            userOps.push(userOp)
        } else {
            const userOpData = await userOpHelper.functions[
                transferERC20_withInitcode_withPaymaster_UserOp_FUNCTION_SIG
            ](
                asset.AssetAddress,
                toAddress, // recipient
                asset.Amount, // amount
                walletOwner.address, // wallet owner
                asset.Salt,
                paymasterAddress,
                Math.floor(Date.now() / 1000), // current timestamp
                feeData.maxFeePerGas,
                feeData.maxPriorityFeePerGas,
            )
            const userOp = [...userOpData[0]]
            const userOpHash = userOpData[1]
            const userOpSignature = await walletOwner.signMessage(utils.arrayify(userOpHash))
            // put signature into user op
            userOp[10] = userOpSignature

            userOps.push(userOp)
        }
    }
    return userOps
}

export async function sendUserOpsToEP(provider: any, userOps: any, beneficiary: any) {
    console.log(userOps)
    const entryPoint = new Contract(entryPointAddress, entryPointABI, provider)
    await entryPoint.handleOps(userOps, beneficiary)
    // await entryPoint.functions["handleOps((address,uint256,bytes,bytes,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],address)"](userOps, beneficiary);
}

async function getAAAddress(
    provider: providers.Provider,
    ownerAddr: string,
    randomNumberInHex: string,
) {
    const salt = utils.keccak256(randomNumberInHex)
    const factoryContract = new Contract(STEALTH_FACTORY_ADDRESS, walletFactoryABI, provider)
    const abstractAccountAddr: string = await factoryContract.functions[
        "getAddress(address,uint256)"
    ](ownerAddr, salt)
    return abstractAccountAddr
}
