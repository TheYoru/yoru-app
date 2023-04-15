import Image from "next/image";
import { Inter } from "next/font/google";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Dropdown from "react-bootstrap/Dropdown";

import { EnsIcon } from "@/components/ensIcon";
import { LensIcon } from "@/components/LensIcon";
import { PlusIcon } from "@/components/PlusIcon";

import * as Select from "@radix-ui/react-select";

import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";

import { useState, useEffect } from "react";
import { useSignMessage, useProvider } from "wagmi";

import { UsdcWrapper } from "@/components/UsdcWrapper";
import { EthWrapper } from "@/components/EthWrapper";

import { BigNumber, Contract, providers, utils } from "ethers";
import { getDumpReceiverPkxAndCiphertext } from "@/utils/stealth";

// import { generateViewingPrivateKey } from './api/stealth'
function generateViewingPrivateKey(signatureData: string): string {
  const privateKey = utils.keccak256(utils.toUtf8Bytes(signatureData));
  return privateKey;
}

const fetcher = (...args) => fetch(...args).then((res) => res.json());

const inter = Inter({ subsets: ["latin"] });

function triggerSend() {}

const message = "ethtokyo";

export default function Home() {
  const provider = useProvider();
  const { data, isError, isLoading, isSuccess, signMessage } = useSignMessage({
    message,
    onSettled(data, error) {
      console.log("Settled", { data, error });
      const ppk = generateViewingPrivateKey(data);
      console.log(ppk);
      saveToLocalStorage(ppk);
      const result = getDumpReceiverPkxAndCiphertext(provider, ppk);
      console.log(result);
    },
  });

  const [address, setAddress] = useState(null);

  function queryENS(ens) {
    console.log(ens);
    return fetch(`/api/query/${ens}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        return data;
      });
  }

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

  function queryLens() {}

  function scanTokens() {
    console.log("scanTokens");
  }

  const [key, setKey] = useState("send");
  const [scanResults, setScanResults] = useState(null);

  const [stealPrivateK, setStealPrivateK] = useState("");

  useEffect(() => {
    let value;
    // Get the value from local storage if it exists
    value = localStorage.getItem("stealPrivateK") || "";
    setStealPrivateK(value);
  }, []);

  // When user submits the form, save the favorite number to the local storage
  const saveToLocalStorage = (stealPrivateK) => {
    localStorage.setItem("setStealPrivateK", stealPrivateK);
  };

  return (
    <main
      className={
        inter.className +
        " flex min-h-screen flex-col items-center justify-center p-24"
      }
      style={{
        background: "rgba(0,0,0, 0.2)",
      }}
    >
      <div className="z-10 items-center font-mono text-sm lg:flex mb-2">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Yoru send funds secretly...
        </p>
      </div>
      <div className="mb-2">
        <ConnectButton />
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
                    <button className="btn-button button-wrapper" type="submit">
                      <EnsIcon />
                      <span>ENS</span>
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
                  <input className="input-element" type="text" value="100" />
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
                  <button className="btn-button button-wrapper" type="submit">
                    <EthWrapper />
                  </button>
                </div>
                <div className="address-container">
                  <div className="address"></div>
                </div>
              </div>
            </div>
            <button className="button w-full">Send</button>
          </Tab>
          <Tab eventKey="receive" title="Receive">
            <button
              className="button w-full"
              disabled={isLoading}
              onClick={() => {
                signMessage();
              }}
            >
              Scan
            </button>
            <hr className="hr" />
            {!scanResults && (
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
          </Tab>
        </Tabs>
      </div>
      <div id="background-radial-gradient"></div>
    </main>
  );
}
