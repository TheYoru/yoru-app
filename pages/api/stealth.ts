import { Contract, utils } from "ethers";
import { useProvider } from "wagmi";
import { KeyPair, RandomNumber } from "@umbracash/umbra-js/src";
import { getTextRecordFromEns } from "./ens";

const STEALTH_ANNOUNCEMENT_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"receiver","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":true,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"bytes32","name":"pkx","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"ciphertext","type":"bytes32"}],"name":"Announcement","type":"event"}];
const STEALTH_CONTRACT_ADDRESS = "0xfb2dc580eed955b528407b4d36ffafe3da685401";
const STEALTH_FACTORY_ADDRESS = "";
const STEALTH_FACTORY_ABI = 
[
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_entryPoint",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "EntryPoint",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "salt",
          "type": "uint256"
        }
      ],
      "name": "createAccount",
      "outputs": [
        {
          "internalType": "contract StealthWallet",
          "name": "ret",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "salt",
          "type": "uint256"
        }
      ],
      "name": "getAddress",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];
const STEALTH_PUBKEY = "publickey";

export function generateViewingPrivateKey(signatureData: string): string {
    const privateKey = utils.keccak256(utils.toUtf8Bytes(signatureData)); 
    return privateKey;
}

export async function fetchAnnouncements(fromBlock: number, toBlock: number) {
    const provider = useProvider();
    const stealthContract = new Contract(STEALTH_CONTRACT_ADDRESS, STEALTH_ANNOUNCEMENT_ABI, provider);
    const announcement = stealthContract.filters.Announcement();
    return stealthContract.queryFilter(announcement, fromBlock, toBlock);
}

export async function getReceiverPkxAndCiphertext(ens: string) {
    // get pkx and cipher text
    const pubkey = await getTextRecordFromEns(ens, STEALTH_PUBKEY);
    const keypair = new KeyPair(pubkey);
    const randomNumber = new RandomNumber();
    const encrypted = keypair.encrypt(randomNumber);
    const { pubKeyXCoordinate } = KeyPair.compressPublicKey(encrypted.ephemeralPublicKey);
    const stealthKeyPair = keypair.mulPublicKey(randomNumber);

    // get aa addr
    const ownerAddr = stealthKeyPair.address;
    const salt = utils.keccak256(randomNumber.asHex);
    const provider = useProvider();
    const factoryContract = new Contract(STEALTH_FACTORY_ADDRESS, STEALTH_FACTORY_ABI, provider);
    const abstractAccountAddr: string = await factoryContract.getAddress(ownerAddr, salt);

    return {
        "receiver": abstractAccountAddr,
        "pkx": pubKeyXCoordinate,
        "ciphertext": encrypted.ciphertext,
    };
}
