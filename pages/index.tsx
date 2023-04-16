import Image from "next/image";
import { Inter } from "next/font/google";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Dropdown from "react-bootstrap/Dropdown";

import { KeyPair } from "@/umbra/classes/KeyPair"

import { EnsIcon } from "@/components/ensIcon";
import { LensIcon } from "@/components/LensIcon";
import { PlusIcon } from "@/components/PlusIcon";
import { QueryIcon } from "@/components/QueryIcon";

import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";

import { useState, useEffect } from "react";
import { useSignMessage, useProvider, useContractWrite, usePrepareContractWrite, useAccount, useBlockNumber, useSigner } from "wagmi";

import { UsdcWrapper } from "@/components/UsdcWrapper";
import { EthWrapper } from "@/components/EthWrapper";
import { NftWrapper } from "@/components/NftWrapper";

import { BigNumber, Contract, providers, utils } from "ethers";
import { dumpObj } from '@/pages/api/ppk';
import { abi as YoruAbi } from '@/pages/api/abis/Yoru.json'

import { getDumpReceiverPkxAndCiphertext, STEALTH_CONTRACT_ADDRESS, getAssets, contractBlock, getWithdrawUserOps, sendUserOpsToEP } from '@/pages/api/stealth';

// import { generateViewingPrivateKey } from './api/stealth'
function generateViewingPrivateKey(signatureData: string): string {
  const privateKey = utils.keccak256(utils.toUtf8Bytes(signatureData));
  return privateKey;
}

const inter = Inter({ subsets: ["latin"] });

function triggerSend() {}

const message = "ethtokyo";

export default function Home() {
  const provider = useProvider();
  const [key, setKey] = useState("send");
  const [scanResults, setScanResults] = useState(null);

  const [stealPrivateK, setStealPrivateK] = useState("");
  const [sendAmount, setSendAmount] = useState("0");
  const [commitAmount, setCommitAmount] = useState("0");
  const { data, isError, isLoading, isSuccess, signMessage } = useSignMessage({
    message,
    onSettled(data, error) {
      console.log("Settled", { data, error });
      const ppk = generateViewingPrivateKey(data);
      console.log(ppk);
      saveToLocalStorage(ppk);
      // const result = getDumpReceiverPkxAndCiphertext(provider, ); //use to send address
      // Promise.resolve(result).then((value) => {
      //   console.log(value);
      // });
    }
  });

  const [ targetPubKey, setTargetPubKey ] = useState(null);

  const [ targetAddress, setTargetAddress ] = useState(null);

  const [ targetObj, setTargetObj ] = useState({
    pkx: null,
    ciphertext: null,
    receiver: null
  })

  const { data: blockData, isError: blockIsError, isLoading: blockIsLoading } = useBlockNumber()

  const { address: senderAddress, isConnecting, isDisconnected } = useAccount()

  const { data: signer, isError: signerIsError, isLoading: signerIsLoading } = useSigner()


  const { config } = usePrepareContractWrite({
    address: STEALTH_CONTRACT_ADDRESS,
    abi: YoruAbi,
    functionName: 'sendEth',
    args: [
      targetObj?.receiver?.[0], 
      targetObj?.pkx, 
      targetObj?.ciphertext
    ],
    overrides: {
      from: senderAddress,
      value: utils.parseEther(commitAmount),
    }
  });

  function getToken(address, amount: number) {
    if (address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
      return <EthWrapper value={amount} />
    else
      return <UsdcWrapper value={amount} />
  }

  const { config: erc20Config } = usePrepareContractWrite({
    address: STEALTH_CONTRACT_ADDRESS,
    abi: YoruAbi,
    functionName: 'sendERC20',
    args: [
      targetObj?.receiver?.[0], 
      "0x395faf30eC5DBEe560B8386704003cB6Cef50fCE",
      utils.parseEther(commitAmount),
      targetObj?.pkx, 
      targetObj?.ciphertext
    ],
    overrides: {
      from: senderAddress,
    }
  });
  const { data: contractErc20Data, isLoading: contractErc20IsLoading, isSuccess: contractErc20IsSuccess, write: contractErc20Write } = useContractWrite(erc20Config)

  const { data: contractData, isLoading: contractIsLoading, isSuccess: contractIsSuccess, write: contractWrite } = useContractWrite(config)

  const [address, setAddress] = useState(null);

  function queryENS(ens) {
    console.log(ens);
    return fetch(`/api/query/${ens}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setTargetPubKey(stealPrivateK)
        return data;
      });
  }

  const [assets, setAssets] = useState([]);

  async function queryName(e) {
    // Prevent the browser from reloading the page
    e.preventDefault();

    // Read the form data
    const form = e.target;
    const formData = new FormData(form);

    // You can pass formData as a fetch body directly:
    const result = await queryENS(formData.get("did-input"));
    console.log(result);
    setAddress(result);
  }

  async function sendEth() {
    console.log(sendAmount.toString())
    const ppk = localStorage.getItem("setStealPrivateK");
    const targetPubKey = new KeyPair(ppk).publicKeyHex
    const result = await getDumpReceiverPkxAndCiphertext(provider, targetPubKey); //use to send address
    console.log('send eth..')
    console.log(result);
    Promise.resolve(result).then((value) => { 
      setTargetAddress(value.receiver[0]);
      setTargetObj(value);
      setCommitAmount(sendAmount);
      console.log(`targetAddress: ${value.receiver[0]} - ${targetObj}`);
      contractWrite?.();
    });
    
  }

  async function sendERC20() {
    console.log(sendAmount.toString())
    const ppk = localStorage.getItem("setStealPrivateK");
    const targetPubKey = new KeyPair(ppk).publicKeyHex
    const result = await getDumpReceiverPkxAndCiphertext(provider, targetPubKey); //use to send address
    console.log('send erc20..')
    console.log(result);
    Promise.resolve(result).then((value) => { 
      setTargetAddress(value.receiver[0]);
      setTargetObj(value);
      setCommitAmount(sendAmount);
      console.log(`targetAddress: ${value.receiver[0]} - ${targetObj}`);
      contractErc20Write?.();
    });
  }

  async function scanTokens() {
    console.log("scanTokens");
    const ppk = localStorage.getItem("setStealPrivateK");
    console.log('ppk: ' + ppk);
    console.log(ppk);
    const scanResult = await getAssets(provider, ppk, contractBlock, blockData);
    console.log(scanResult);
    setAssets(scanResult);
  }

  async function withdraw() {
    console.log('withdraw called')
    const userOp = await getWithdrawUserOps(provider, assets, senderAddress);
    const sendResult = await sendUserOpsToEP(signer, userOp, senderAddress)
    
  }

  const supportServices = [
    'ens',
    'lens'
  ]

  const [selectedService, setSelectedService] = useState(supportServices[0]);

  function changeService() {
    const current = selectedService;
    const currentIndex = supportServices.indexOf(current);
    setSelectedService(supportServices[(currentIndex + 1) % supportServices.length]);
    console.log(selectedService);
  }

  const supportTokens = [
    'eth',
    'usdc',
    // 'nft'
  ];

  function changeToken() {
    const currentToken = selectedToken;
    const currentIndex = supportTokens.indexOf(currentToken);
    setSelectedToken(supportTokens[(currentIndex + 1) % supportTokens.length]);
    console.log(selectedToken);
  }

  const [selectedToken, setSelectedToken] = useState(supportTokens[0]);

  useEffect(() => {
    let value;
    // Get the value from local storage if it exists
    value = localStorage.getItem("stealPrivateK") || "";
    setStealPrivateK(value);
  }, []);

  // When user submits the form, save the favorite number to the local storage
  const saveToLocalStorage = (stealPrivate) => {
    localStorage.setItem("setStealPrivateK", stealPrivate)
  };

  return (
    <main
      className={
        inter.className +
        " flex min-h-screen flex-col items-center justify-center p-24"
      }
      style={{
        background: "rgba(0,0,0, 0.2)",
        width: "960px"
      }}
    >
      <div className="z-10 items-center font-mono text-sm lg:flex mb-2">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30"
        style={{"color": "#eee"}}>
          Yoru send funds secretly...
        </p>
      </div>
      <div className="mb-2">
        <div className="input-combine">
          <ConnectButton />
          <button className="btn btn-button mx-2" onClick={()=>{
            signMessage();
          }}>Register</button>
        </div>
      </div>

      <div className="container">
        <Tabs
          id="controlled-tab-example"
          activeKey={key}
          onSelect={(k) => setKey(k)}
          className="mb-3"
          variant="universal"
        >
          <Tab eventKey="send" title="Send">
            <div className="input-container-wrapper">
              <div className="input-container">
                <form method="get" onSubmit={queryName}>
                  <div className="input-combine">
                    <input
                      className="input-element"
                      type="text"
                      id="did-input"
                      name="did-input"
                    />
                    <button type="submit">
                      <QueryIcon width="36px" height="36px" />
                    </button>
                    <button className="btn-button button-wrapper" onClick={()=>{
                      changeService();
                    }}>
                      {selectedService === 'ens' && <div className="input-combine" style={{"width":"120px"}}><EnsIcon /><span>ENS</span></div>}
                      {selectedService === 'lens' && <div className="input-combine" style={{"width":"120px"}}><LensIcon /><span>LENS</span></div>}
                    </button>
                    {/* <Dropdown>
                      <Dropdown.Toggle variant="button" id="dropdown-query">
                        Find Address
                      </Dropdown.Toggle>

                      <Dropdown.Menu variant="button">
                        <Dropdown.Item eventKey="lens">
                          <button className="input-combine" type="submit">
                            <LensIcon />
                            <span>LENS</span>
                          </button>
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="ens">
                          <button className="input-combine" type="submit">
                            <EnsIcon />
                            <span>ENS</span>
                          </button>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown> */}
                  </div>
                </form>

                <div className="address-container">
                  <div className="address">
                    {address && <div>{address}</div>}
                  </div>
                </div>
              </div>
            </div>
            <hr className="hr" />
            <div className="img-plus">
              <PlusIcon />
            </div>
            <div className="input-container-wrapper">
              <div className="input-container">
                <div className="input-combine">
                  <input className="input-element" type="text" value={sendAmount} onChange={(e)=>{
                    console.log(e.target.value);
                    if (e.target?.value !== null || e.target.value !== undefined || e.target.value !== "")
                      setSendAmount(e.target.value);
                    else {
                      setSendAmount("0");
                    }
                  }} />
                  {/* <Dropdown
                    onSelect={(eventKey) => {
                      console.log(eventKey);
                      if (eventKey === "lens") {
                      } else {
                        // queryENS();
                      }
                    }}
                  >
                    <Dropdown.Toggle variant="button" id="dropdown-query">
                      Select Tokens
                    </Dropdown.Toggle>

                    <Dropdown.Menu variant="button">
                      <Dropdown.Item eventKey="eth">
                        <div className="input-combine">
                          <EthWrapper />
                        </div>
                      </Dropdown.Item>
                      <Dropdown.Item eventKey="usdc">
                        <div className="input-combine">
                          <UsdcWrapper />
                        </div>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown> */}
                  <button className="btn-button button-wrapper" onClick={()=>{
                    changeToken();
                  }}>
                    {selectedToken === 'eth' && <EthWrapper />}
                    {selectedToken === 'usdc' && <UsdcWrapper />}
                    {selectedToken === 'nft' && <NftWrapper />}
                  </button>
                </div>
                <div className="address-container">
                  <div className="address"></div>
                </div>
              </div>
            </div>
            <button className="button w-full" onClick={()=>{
              if (selectedToken === 'eth')
                sendEth();
              else
                sendERC20();
            }}>Send</button>
          </Tab>
          <Tab eventKey="receive" title="Receive">
            <button
              className="button w-full"
              disabled={isLoading}
              onClick={() => {
                // signMessage();
                scanTokens();
              }}
            >
              Scan
            </button>
            <hr className="hr" />
            {!assets && (
              <div className="text-center font-size-5">No results</div>
            )}
            {/* {scanResults && scanResults?.map((item) => {
              return (
                <div className="input-combine">
                  <div className="scan-result">{item.receiver}</div>
                  <div className="scan-result">{item.token}</div>
                  <div className="scan-result">{item.amount}</div>
                </div>
              )
            })} */}
            {assets && (
              <div className="assets-wrapper">
                  {assets.map((asset, i) => {
                    return (
                      <div className="input-combine asset-item" key={i}>
                      {asset.AccountAddress} {getToken(asset.AssetAddress, utils.formatEther(asset.Amount))}
                      </div>
                    )
                  })}
                <button className="button w-full" onClick={()=>{
                  withdraw();
                }}>Withdraw</button>
              </div>
            )}
          </Tab>
        </Tabs>
      </div>
      <div id="background-radial-gradient"></div>
    </main>
  );
}
