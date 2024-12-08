//@ts-nocheck

import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import { z } from "zod";
import fs from "fs";
import path from "path";
import contractABI from "@/contract/abi.json";
import contractAddress from "@/contract/address.json";
const { ethers } = require("ethers");

const RPC_URL = "https://sepolia.base.org";

let payouts = [];

const SavePayoutToFileInput = z.object({
  incentive: z
    .string()
    .describe("The incentive amount as a string, typically between 10^-6 and 10^-4."),
    userAddress: z
    .string()
    .describe("The wallet address of the user."),
  serviceId: z
    .string()
    .describe("The unique identifier for the service."),
});

/**
 * Save the payout information to a local file and perform the transaction on the blockchain.
 *
 * @param wallet - The wallet parameter is included for consistency but not used in this function.
 * @param incentive - The incentive amount as a string.
 * @param userAddress - The wallet address of the client.
 * @param serviceId - The unique identifier for the service.
 * @returns A success message or an error if saving fails.
 */
async function SavePayoutToFile(
  wallet: Wallet,
  args: z.infer<typeof SavePayoutToFileInput>
): Promise<string> {
  const payoutData = {
    incentive: args.incentive,
    userAddress: args.userAddress,
    serviceId: args.serviceId,
  };

  // payouts.push(payoutData);
  // console.log("payouts: ", payouts);

  // if(payouts.length >= 2) {

  // TODO ALWAYS EXECUTE
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress.address, contractABI, signer);

    const amount = ethers.parseEther(payoutData.incentive);
    console.log("amount: ", amount);
    const tx = await contract.attestRewardAndPay(payoutData.userAddress, amount, { value: amount });
    await tx.wait();
    console.log("Transaction hash: ", tx.hash);
    // }

    // payouts = [];
  // }

// //   console.log(invocation);
//   // Default file path
//   const outputPath = path.resolve("payouts.json");
  

//   try {
//     // Check if file exists
//     let existingData: Array<{ incentive: string; userAddress: string; serviceId: string; }> = [];
//     if (fs.existsSync(outputPath)) {
//       const fileContent = fs.readFileSync(outputPath, "utf8");
//       existingData = JSON.parse(fileContent); // Parse existing data
//     }

//     // Append the new payout
//     existingData.push(payoutData);

//     // Save updated data back to file
//     fs.writeFileSync(outputPath, JSON.stringify(existingData, null, 2), "utf8");

//     console.log("Payout data saved to file:");


//     return `Payout successfully saved to ${outputPath} and transaction completed`;
//   } catch (error) {
//     throw new Error(`Failed to save payout to file or transaction failed: ${error.message}`);
//   }
}

export { SavePayoutToFileInput, SavePayoutToFile };
