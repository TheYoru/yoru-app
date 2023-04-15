import Image from "next/image";
import { Inter } from "next/font/google";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Dropdown from "react-bootstrap/Dropdown";

import { EnsIcon } from "@/components/ensIcon";
import { LensIcon } from "@/components/LensIcon";
import { PlusIcon } from "@/components/PlusIcon";

import * as Select from '@radix-ui/react-select';


import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";

import { useState, useEffect } from "react";

import useSWR from "swr";
import { UsdcWrapper } from "@/components/UsdcWrapper";
import { EthWrapper } from "@/components/EthWrapper";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

const inter = Inter({ subsets: ["latin"] });

function triggerSend() {}

export default function Home() {
  const { data, error } = useSWR('/api/query-ens', fetcher)
  // const { ensResult, ensError } = useSWR('/api/query-ens', fetcher)
  // const { data, error } = useSWR('/api/query-lens', fetcher)

  function queryENS() {
  }

  function queryLens() {
    
  }

  function scanTokens() {
    console.log("scanTokens");
    
  }

  const [key, setKey] = useState("send");
  const [ scanResults, setScanResults ] = useState(null);

  useEffect(() => {});

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
                <div className="input-combine">
                  <input className="input-element" type="text" />
                  <Dropdown
                    onSelect={(eventKey) => {
                      console.log(eventKey);
                      if (eventKey === "lens") {
                        
                      } else {

                      }
                    }}
                  >
                    <Dropdown.Toggle variant="button" id="dropdown-query">
                      Find Address
                    </Dropdown.Toggle>

                    <Dropdown.Menu variant="button">
                      <Dropdown.Item eventKey="lens">
                        <div className="input-combine">
                          <LensIcon />
                          <span>LENS</span>
                        </div>
                      </Dropdown.Item>
                      <Dropdown.Item eventKey="ens">
                        <div className="input-combine">
                          <EnsIcon />
                          <span>ENS</span>
                        </div>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
                <div className="address-container">
                  <div className="address">0xdfdsfldfjsadfdjsfsdfsdfsdfsd</div>
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
                  <Dropdown
                    onSelect={(eventKey) => {
                      console.log(eventKey);
                      if (eventKey === "lens") {
                      } else {
                        queryENS();
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
                  </Dropdown>
                </div>
                <div className="address-container">
                  <div className="address">0xdfdsfldfjsadfdjsfsdfsdfsdfsd</div>
                </div>
              </div>
            </div>
            <button className="button w-full">Send</button>
          </Tab>
          <Tab eventKey="receive" title="Receive">
            <button className="button w-full" onClick={()=>{

            }}>Scan</button>
            <hr className="hr" />
            {!scanResults && <div className="text-center font-size-5">No results</div>}
            {scanResults && scanResults?.map((item) => {
              return (
                <div className="input-combine">
                  <div className="scan-result">{item.receiver}</div>
                  <div className="scan-result">{item.token}</div>
                  <div className="scan-result">{item.amount}</div>
                </div>
              )
            })}
            
          </Tab>
        </Tabs>
      </div>
      <div id="background-radial-gradient"></div>
    </main>
  );
}
