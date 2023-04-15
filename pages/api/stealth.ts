import { BigNumber, Contract, providers, utils, Wallet } from "ethers"
import { getTextRecordFromEns } from "./ens"
import { KeyPair } from "@/umbra/classes/KeyPair"
import { RandomNumber } from "@/umbra/classes/RandomNumber"

import { abi as userOpHelperABI } from "./abis/UserOpHelper.json"
import { abi as yoruABI } from "./abis/Yoru.json"
import { abi as walletFactoryABI } from "./abis/StealthWalletFactory.json"

const userOpHelperAddress = "0x63087b831D80Db6f65930339cFA38D4f7E486db3"
const paymasterAddress = "0xb666fE2b562be86590c4DF43F12Ab1DBA9EC209C"
const STEALTH_CONTRACT_ADDRESS = "0x8D977171D2515f375d0E8E8623e7e27378eE70Fa"
const STEALTH_FACTORY_ADDRESS = "0xb1ae118a4f5089812296BC2714a0cB261f99cEBb"
const STEALTH_PUBKEY = "publickey"

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
    const keypair = new KeyPair(privateKey)
    const announcements = await fetchAnnouncements(provider, fromBlock, toBlock)
    let assetInfos: AssetInfo[] = []
    for (var i = 0; i < announcements.length; i++) {
        const announce = announcements[i]
        const event = announce.args
        if (event != undefined) {
            const pkx = event["pkx"]
            const publicKey = KeyPair.getUncompressedFromX(pkx)
            const newKeypair = keypair.mulPublicKey(publicKey)
            const ciphertext = event["ciphertext"]
            const randomNumberInHex = newKeypair.decrypt({
                ephemeralPublicKey: publicKey,
                ciphertext: ciphertext,
            })
            const newPrivateKey = keypair.mulPrivateKey(randomNumberInHex).privateKeyHex
            if (newPrivateKey != undefined) {
                const aaAddr = await getAAAddress(provider, newPrivateKey, randomNumberInHex)
                const salt = utils.keccak256(randomNumberInHex)
                if (aaAddr.toLowerCase() == event["receiver"].toLowerCase()) {
                    const amount: BigNumber = event["amount"]
                    assetInfos.push({
                        AccountAddress: aaAddr,
                        AssetAddress: event["token"],
                        Amount: amount,
                        Salt: salt,
                        PrivateKey: newPrivateKey,
                    })
                }
            }
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

export async function getDumpReceiverPkxAndCiphertext(provider: providers.Provider, ppk: string) {
    // get pkx and cipher text
    const pubkey = new KeyPair(ppk).publicKeyHex
    console.log(pubkey)
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

export async function getWithdrawUserOp(provider: any, asset: AssetInfo, toAddress: string) {
    const userOpHelper = new Contract(userOpHelperAddress, userOpHelperABI, provider)
    const feeData = await provider.getFeeData()

    const walletOwner = new Wallet(asset.PrivateKey)
    const userOpData =
        await userOpHelper.callstatic.transferERC20_withInitcode_withPaymaster_UserOp(
            asset.AssetAddress,
            toAddress, // token recipient
            asset.Amount, // token amount
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

    return userOp
}

async function getAAAddress(
    provider: providers.Provider,
    ownerAddr: string,
    randomNumberInHex: string,
) {
    const salt = utils.keccak256(randomNumberInHex)
    const factoryContract = new Contract(STEALTH_FACTORY_ADDRESS, walletFactoryABI, provider)
    const abstractAccountAddr: string = await factoryContract.getAddress(ownerAddr, salt)
    return abstractAccountAddr
}
