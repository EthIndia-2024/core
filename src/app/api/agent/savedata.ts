//@ts-nocheck

import { Wallet } from "@coinbase/coinbase-sdk";
import { z } from "zod";
import fs from "fs";
import path from "path";

const SavePayoutToFileInput = z.object({
  incentive: z
    .string()
    .describe("The incentive amount as a string, typically between 10^-6 and 10^-4."),
  clientWallet: z
    .string()
    .describe("The wallet address of the client."),
  serviceId: z
    .string()
    .describe("The unique identifier for the service."),
});

/**
 * Save the payout information to a local file.
 *
 * @param wallet - The wallet parameter is included for consistency but not used in this function.
 * @param incentive - The incentive amount as a string.
 * @param clientWallet - The wallet address of the client.
 * @param serviceId - The unique identifier for the service.
 * @returns A success message or an error if saving fails.
 */
async function SavePayoutToFile(
  wallet: Wallet,
  args: z.infer<typeof SavePayoutToFileInput>
): Promise<string> {
  const payoutData = {
    incentive: args.incentive,
    clientWallet: args.clientWallet,
    serviceId: args.serviceId,
  };

  // Default file path
  const outputPath = path.resolve("payouts.json");

  try {
    // Check if file exists
    let existingData: Array<{ incentive: string; clientWallet: string; serviceId: string; }> = [];
    if (fs.existsSync(outputPath)) {
      const fileContent = fs.readFileSync(outputPath, "utf8");
      existingData = JSON.parse(fileContent); // Parse existing data
    }

    // Append the new payout
    existingData.push(payoutData);

    // Save updated data back to file
    fs.writeFileSync(outputPath, JSON.stringify(existingData, null, 2), "utf8");

    return `Payout successfully saved to ${outputPath}`;
  } catch (error) {
    throw new Error(`Failed to save payout to file: ${error.message}`);
  }
}

export { SavePayoutToFileInput, SavePayoutToFile };
