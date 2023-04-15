import Image from "next/image";
import { Inter } from "next/font/google";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Dropdown from 'react-bootstrap/Dropdown';

import { EnsIcon } from '@/components/ensIcon';
import { LensIcon } from "@/components/LensIcon";

import { useRef, useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

function triggerSend() {}

export default function Home() {

  useEffect(() => {

  })

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-24"
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
        <div className="select-tab-container">
          <a className="select-tab">Send</a>
          <a className="select-tab">Receive</a>
        </div>
        <div className="input-container-wrapper">
          <div className="input-container">
            <div className="input-combine">
              <input className="input-element" type="text" />
              <Dropdown onSelect={
                (eventKey) => {
                  console.log(eventKey)
                }
              }>
                <Dropdown.Toggle variant="success" id="dropdown-query">
                  Query
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item eventKey="lens">
                    <LensIcon />
                  </Dropdown.Item>
                  <Dropdown.Item eventKey="ens">
                    <EnsIcon />
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
          <div color="#FFFFFF" className="sc-1es900k-0 hbdxeO">
            <svg
              height="24px"
              width="24px"
              version="1.1"
              id="Layer_1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 495 495"
              fill="#fff"
            >
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                {" "}
                <polygon
                  style={{"fill":"#fff;"}}
                  points="495,227.5 267.5,227.5 267.5,0 227.5,0 227.5,227.5 0,227.5 0,267.5 227.5,267.5 227.5,495 267.5,495 267.5,267.5 495,267.5 "
                ></polygon>{" "}
              </g>
            </svg>
          </div>
        </div>
        <div className="input-container-wrapper">
          <div className="input-container">
            <div className="input-combine">
              <input className="input-element" type="text" value="100" />
              <img
                alt="WETH logo"
                src="https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/arbitrum/assets/0x82aF49447D8a07e3bd95BD0d56f35241523fBab1/logo.png"
                className="img-icon"
              />
            </div>
            <div className="address-container">
              <div className="address">0xdfdsfldfjsadfdjsfsdfsdfsdfsd</div>
            </div>
          </div>
        </div>
        <button className="button w-full">Send</button>
      </div>
      <div id="background-radial-gradient"></div>
    </main>
  );
}
