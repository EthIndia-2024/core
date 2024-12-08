import { Wallet } from "@coinbase/coinbase-sdk";
import { z } from "zod";
import nlp from 'compromise';

const CheckReviewHelpfulnessInput = z.object({
    reviewText: z.string().describe("The text of the review to evaluate."),
  });


/**
 * Calculates the helpfulness score of a review.
 *
 * @param wallet - The wallet instance (for consistency with other tools)
 * @param reviewText - The text of the review to evaluate
 * @returns A string summarizing the helpfulness score and contributing factors
 */
async function CalculateReviewHelpfulness(wallet: Wallet, args: z.infer<typeof CheckReviewHelpfulnessInput>): Promise<string> {
    // Analyze descriptiveness using TextBlob
    // const blob = new TextBlob(reviewText);
  
    const doc = nlp(args.reviewText);
    const adjectives = doc.adjectives().out('array').length;
    const adverbs = doc.adverbs().out('array').length;
    const wordCount = doc.wordCount();
    // const adjectives = blob.tags().filter(([_, tag]) => ["JJ", "JJR", "JJS"].includes(tag)).length;
    // const adverbs = blob.tags().filter(([_, tag]) => ["RB", "RBR", "RBS"].includes(tag)).length;
    // const wordCount = blob.words().length;
    const descriptivenessScore = wordCount ? ((adjectives + adverbs) / wordCount) * 100 : 0;
  
    // Actionability score (dummy logic for simplicity)
    const actionableKeywords = [
      "fix", "improve", "enhance", "upgrade", "address", "modify", "correct",
      "adjust", "update", "problem", "issue", "bug", "crash", "error", "defect", "lacks",
      "malfunction", "broken", "glitch", "recommend", "suggest", "consider",
      "would prefer", "should add", "needs", "could be better", "option for",
      "feature", "functionality", "option", "performance", "speed", "usability",
      "compatibility", "design", "quality", "durability", "customer service",
      "delivery", "support", "response", "shipping", "instructions",
      "communication", "setup", "disappointed", "frustrated", "annoyed",
      "confused", "unclear", "hard to use", "not satisfied"
    ];
    const actionabilityScore = actionableKeywords.some(keyword => args.reviewText.toLowerCase().includes(keyword)) ? 100 : 10;
  
    // Specificity score (based on noun phrases)
    const specificityScore = doc.nouns().out('array').length > 2 ? 100 : 10;
  
    // Length adequacy score
    const length = args.reviewText.split(" ").length;
    let lengthScore = 50;
    if (length >= 50 && length <= 200) lengthScore = 100;
    else if ((length >= 20 && length <= 50) || (length >= 200 && length <= 500)) lengthScore = 75;
  
    // Final score
    const finalScore = (
      0.10 * descriptivenessScore +
      0.30 * actionabilityScore +
      0.30 * specificityScore +
      0.30 * lengthScore
    );
  
    return `
      Review Helpfulness Score: ${finalScore.toFixed(2)}
      Contributing Scores:
      - Descriptiveness: ${descriptivenessScore.toFixed(2)}
      - Actionability: ${actionabilityScore.toFixed(2)}
      - Specificity: ${specificityScore.toFixed(2)}
      - Length Adequacy: ${lengthScore.toFixed(2)}
    `;
  }


export { CheckReviewHelpfulnessInput, CalculateReviewHelpfulness };