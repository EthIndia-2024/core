// @ts-nocheck

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";
import { LIT_ABILITY } from "@lit-protocol/constants";
import {
  LitAccessControlConditionResource,
  LitActionResource,
  createSiweMessage,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";
import { encryptString, decryptToString } from "@lit-protocol/encryption";

function getAccessControlConditions(address: string): object[] {
    return [
        {
            contractAddress: "",
            standardContractType: "",
            chain: "baseSepolia",
            method: "",
            parameters: [":userAddress"],
            returnValueTest: {
                comparator: "=",
                value: address,
            },
        },
    ];
}

export function fromUrlSafeBase64(urlSafeString) {
    let base64 = urlSafeString.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return base64;
}

export default function Feedback() {
    let litNodeClient = new LitNodeClient({
        litNetwork: LIT_NETWORK.DatilTest,
    });
  const params = useParams();
  const urlSafeCiphertext = params.cipher;
  const dataToEncryptHash = params.dataHash;
  const ciphertext = fromUrlSafeBase64(urlSafeCiphertext);

  const connectWallet = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    // Prompt user for account connections
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    console.log("Account:", await signer.getAddress());
  };

  

    const generateSignature = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        console.log(signer);
        console.log(await signer.getAddress());
        await litNodeClient.connect();
        const sessionSignatures = await litNodeClient.getSessionSigs({
            chain: "baseSepolia",
            expiration: new Date(Date.now() + 1000 * 60 * 10 ).toISOString(), // 10 minutes
            // capabilityAuthSigs: [capacityDelegationAuthSig], // Unnecessary on datil-dev
            resourceAbilityRequests: [
              {
                resource: new LitAccessControlConditionResource("*"),
                ability: LIT_ABILITY.AccessControlConditionDecryption,
              },
              {
                resource: new LitActionResource('*'),
                ability: LIT_ABILITY.LitActionExecution,
              },
            ],
            authNeededCallback: async ({
              uri,
              expiration,
              resourceAbilityRequests,
            }) => {
              const toSign = await createSiweMessage({
                uri,
                expiration,
                resources: resourceAbilityRequests,
                walletAddress: await signer.getAddress(),
                nonce: await litNodeClient.getLatestBlockhash(),
                litNodeClient,
              });
          
              return await generateAuthSig({
                signer: signer,
                toSign,
              });
            },
          });
         return sessionSignatures;
    }

    const decryptPath = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();

        const accessControlConditions = getAccessControlConditions(await signer.getAddress());
        litNodeClient.connect();

        console.log(accessControlConditions);

        // const code = `(async () => {
        //     const resp = await Lit.Actions.decryptAndCombine({
        //       accessControlConditions,
        //       ciphertext,
        //       dataToEncryptHash,
        //       authSig: null,
        //       chain: 'baseSepolia',
        //     });
          
        //     Lit.Actions.setResponse({ response: resp });
        //   })();`

          const sessionSigs = await generateSignature();
        //   console.log(sessionSigs);
          
        //   const res = await litNodeClient.executeJs({
        //       code,
        //       sessionSigs,
        //       jsParams: {
        //           accessControlConditions,
        //           ciphertext,
        //           dataToEncryptHash
        //       }
        //   });
          
        // console.log(res);
        console.log("decrypting");
        const decryptionResponse = await litNodeClient.decrypt(
            {
                chain: "baseSepolia",
                ciphertext,
                dataToEncryptHash,
                accessControlConditions,
                sessionSigs,
            }
          );
          const decryptedString = new TextDecoder().decode(
            decryptionResponse.decryptedData
          );
          console.log(`ℹ️  decryptedString: ${decryptedString}`);
        //     console.log(decryptionResult);
    };

    return (
        <div>
            <h1>Feedback</h1>
            <p>Feedback for {ciphertext} with data hash {dataToEncryptHash}</p>
            <button onClick={connectWallet}>Connect Wallet</button>
            <button onClick={generateSignature}>Generate Signature</button>
            <button onClick={decryptPath}>Decrypt</button>
        </div>
    )
}