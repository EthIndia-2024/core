import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";

// let litNodeClientInstance: LitJsSdk.LitNodeClientNodeJs | null = null;

// async function getLitNodeClient(): Promise<LitJsSdk.LitNodeClientNodeJs> {
//   if (litNodeClientInstance) return litNodeClientInstance;

//   litNodeClientInstance = new LitJsSdk.LitNodeClientNodeJs({
//     alertWhenUnauthorized: false,
//     litNetwork: LIT_NETWORK.DatilDev, // DatilDev network for free usage
//     debug: false,
//   });

//   await litNodeClientInstance.connect();
//   return litNodeClientInstance;
// }

const litNodeClient = new LitNodeClient({
    litNetwork: LIT_NETWORK.DatilDev,
});

// Allow users with ≥ 0 ETH:
function getAccessControlConditions(address): object[] {
return [
    {
    contractAddress: "",
    standardContractType: "",
    chain: "baseSepolia",
    method: "eth_getBalance",
    parameters: [":userAddress", "latest"],
    returnValueTest: {
        comparator: ">=",
        value: "000000000000000000", // 0 ETH in wei
    },
    // method: "",
    // parameters: [":userAddress"],
    // returnValueTest: {
    //   comparator: "=",
    //   value: address, // User's wallet address who can decrypt
    // },
    },
];
}

  export const encryptString = async (text: string): Promise<{ ciphertext: string; dataToEncryptHash: string }> => {
    await litNodeClient.connect();
  
    const accessControlConditions = getAccessControlConditions();
  
    const { ciphertext, dataToEncryptHash } = await LitJsSdk.encryptString(
      {
        accessControlConditions,
        dataToEncrypt: text,
      },
      litNodeClient
    );
  
    console.log({ ciphertext, dataToEncryptHash });
    return { ciphertext, dataToEncryptHash };
  };