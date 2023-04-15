import { BigNumber, Contract, providers, utils, Wallet } from "ethers";
import { getTextRecordFromEns } from "./ens";
import { KeyPair } from "@/umbra/classes/KeyPair";
import { RandomNumber } from "@/umbra/classes/RandomNumber";

import { abi as userOpHelperABI } from "./abis/UserOpHelper.json";

const userOpHelperAddress = "0x63087b831D80Db6f65930339cFA38D4f7E486db3";
const paymasterAddress = "0xb666fE2b562be86590c4DF43F12Ab1DBA9EC209C";

const STEALTH_ANNOUNCEMENT_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      { indexed: false, internalType: "bytes32", name: "pkx", type: "bytes32" },
      {
        indexed: false,
        internalType: "bytes32",
        name: "ciphertext",
        type: "bytes32",
      },
    ],
    name: "Announcement",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "_recipient", type: "address" },
      { internalType: "address", name: "_tokenAddr", type: "address" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
      { internalType: "bytes32", name: "_pkx", type: "bytes32" },
      { internalType: "bytes32", name: "_ciphertext", type: "bytes32" },
    ],
    name: "sendERC20",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_recipient", type: "address" },
      { internalType: "address", name: "_tokenAddr", type: "address" },
      { internalType: "uint256", name: "_tokenId", type: "uint256" },
      { internalType: "bytes32", name: "_pkx", type: "bytes32" },
      { internalType: "bytes32", name: "_ciphertext", type: "bytes32" },
    ],
    name: "sendERC721",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address payable", name: "_recipient", type: "address" },
      { internalType: "bytes32", name: "_pkx", type: "bytes32" },
      { internalType: "bytes32", name: "_ciphertext", type: "bytes32" },
    ],
    name: "sendEth",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];
const STEALTH_CONTRACT_ADDRESS = "0x8D977171D2515f375d0E8E8623e7e27378eE70Fa";
const STEALTH_FACTORY_ADDRESS = "0xb1ae118a4f5089812296BC2714a0cB261f99cEBb";
const STEALTH_FACTORY_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_entryPoint",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "EntryPoint",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "salt",
        type: "uint256",
      },
    ],
    name: "createAccount",
    outputs: [
      {
        internalType: "contract StealthWallet",
        name: "ret",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "salt",
        type: "uint256",
      },
    ],
    name: "getAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
const STEALTH_PUBKEY = "publickey";

export interface AssetInfo {
  AccountAddress: string;
  AssetAddress: string;
  Amount: BigNumber;
  Salt: string;
  PrivateKey: string;
}

export function generateViewingPrivateKey(signatureData: string): string {
  const privateKey = utils.keccak256(utils.toUtf8Bytes(signatureData));
  return privateKey;
}

async function fetchAnnouncements(
  provider: providers.Provider,
  fromBlock: number,
  toBlock: number
) {
  const stealthContract = new Contract(
    STEALTH_CONTRACT_ADDRESS,
    STEALTH_ANNOUNCEMENT_ABI,
    provider
  );
  const announcement = stealthContract.filters.Announcement();
  return stealthContract.queryFilter(announcement, fromBlock, toBlock);
}

export async function getAssets(
  provider: providers.Provider,
  privateKey: string,
  fromBlock: number,
  toBlock: number
) {
  const keypair = new KeyPair(privateKey);
  const announcements = await fetchAnnouncements(provider, fromBlock, toBlock);
  let assetInfos: AssetInfo[] = [];
  for (var i = 0; i < announcements.length; i++) {
    const announce = announcements[i];
    const event = announce.args;
    if (event != undefined) {
      const pkx = event["pkx"];
      const publicKey = KeyPair.getUncompressedFromX(pkx);
      const newKeypair = keypair.mulPublicKey(publicKey);
      const ciphertext = event["ciphertext"];
      const randomNumberInHex = newKeypair.decrypt({
        ephemeralPublicKey: publicKey,
        ciphertext: ciphertext,
      });
      const newPrivateKey =
        keypair.mulPrivateKey(randomNumberInHex).privateKeyHex;
      if (newPrivateKey != undefined) {
        const aaAddr = await getAAAddress(
          provider,
          newPrivateKey,
          randomNumberInHex
        );
        const salt = utils.keccak256(randomNumberInHex);
        if (aaAddr.toLowerCase() == event["receiver"].toLowerCase()) {
          const amount: BigNumber = event["amount"];
          assetInfos.push({
            AccountAddress: aaAddr,
            AssetAddress: event["token"],
            Amount: amount,
            Salt: salt,
            PrivateKey: newPrivateKey,
          });
        }
      }
    }
  }
  return assetInfos;
}

export async function getReceiverPkxAndCiphertext(
  provider: providers.Provider,
  ens: string
) {
  // get pkx and cipher text
  const pubkey = await getTextRecordFromEns(ens, STEALTH_PUBKEY);
  const keypair = new KeyPair(pubkey);
  const randomNumber = new RandomNumber();
  const encrypted = keypair.encrypt(randomNumber);
  const { pubKeyXCoordinate } = KeyPair.compressPublicKey(
    encrypted.ephemeralPublicKey
  );
  const stealthKeyPair = keypair.mulPublicKey(randomNumber);

  // get aa addr
  const abstractAccountAddr = getAAAddress(
    provider,
    stealthKeyPair.address,
    randomNumber.asHex
  );

  return {
    receiver: abstractAccountAddr,
    pkx: pubKeyXCoordinate,
    ciphertext: encrypted.ciphertext,
  };
}

export async function getDumpReceiverPkxAndCiphertext(
  provider: providers.Provider,
  ppk: string
) {
  // get pkx and cipher text
  const pubkey = new Wallet(ppk).publicKey;
  const keypair = new KeyPair(pubkey);
  const randomNumber = new RandomNumber();
  const encrypted = keypair.encrypt(randomNumber);
  const { pubKeyXCoordinate } = KeyPair.compressPublicKey(
    encrypted.ephemeralPublicKey
  );
  const stealthKeyPair = keypair.mulPublicKey(randomNumber);

  // get aa addr
  const abstractAccountAddr = getAAAddress(
    provider,
    stealthKeyPair.address,
    randomNumber.asHex
  );

  return {
    receiver: abstractAccountAddr,
    pkx: pubKeyXCoordinate,
    ciphertext: encrypted.ciphertext,
  };
}

async function getAAAddress(
  provider: providers.Provider,
  ownerAddr: string,
  randomNumberInHex: string
) {
  const salt = utils.keccak256(randomNumberInHex);
  const factoryContract = new Contract(
    STEALTH_FACTORY_ADDRESS,
    STEALTH_FACTORY_ABI,
    provider
  );
  const abstractAccountAddr: string = await factoryContract.getAddress(
    ownerAddr,
    salt
  );
  return abstractAccountAddr;
}
