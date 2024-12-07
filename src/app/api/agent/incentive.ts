import { Wallet } from "@coinbase/coinbase-sdk";
import { z } from "zod";


const CalculateIncentiveInput = z.object({
    score: z
      .number()
      .min(1, "The score must be at least 1.")
      .max(100, "The score must be at most 100.")
      .describe(
        "The review score provided by the reviewer. Should be a number between 1 and 100."
      ),
  });




/**
 * Calculate the incentive to pay a reviewer based on their review score.
 *
 * @param wallet - The wallet parameter is required to comply with the toolkit structure, though not used in this function.
 * @param score - The review score, a number between 1 and 100.
 * @returns The calculated incentive, a value between 10^-6 and 10^-4.
 */
async function CalculateIncentive(
    wallet: Wallet,
    args: z.infer<typeof CalculateIncentiveInput>
  ): Promise<string> {
    // Define the incentive range
    const minIncentive = 1e-6;
    const maxIncentive = 1e-4;
  
    // Scale the score to calculate the incentive
    const incentive =
      minIncentive +
      ((args.score - 1) / (100 - 1)) * (maxIncentive - minIncentive);
  
    return incentive.toString();
  }

export { CalculateIncentiveInput, CalculateIncentive };