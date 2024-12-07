import { Wallet } from "@coinbase/coinbase-sdk";
import { z } from "zod";

const GeneratePayoutJSONInput = z.object({
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
 * Generate a structured JSON for payout information.
 *
 * @param wallet - The wallet parameter is included for consistency but not used in this function.
 * @param incentive - The incentive amount as a string.
 * @param clientWallet - The wallet address of the client.
 * @param serviceId - The unique identifier for the service.
 * @returns A JSON string containing the payout information.
 */
async function GeneratePayoutJSON(
  wallet: Wallet,
  args: z.infer<typeof GeneratePayoutJSONInput>
): Promise<string> {
  const payoutJSON = {
    incentive: args.incentive,
    clientWallet: args.clientWallet,
    serviceId: args.serviceId,
    timestamp: new Date().toISOString(), // Add timestamp for record-keeping
  };

  return JSON.stringify(payoutJSON, null, 2); // Pretty-print JSON
}

export { GeneratePayoutJSONInput, GeneratePayoutJSON };