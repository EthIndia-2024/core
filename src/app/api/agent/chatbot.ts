import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatXAI } from "@langchain/xai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as readline from "readline";
import { CdpTool, CdpToolkit } from "@coinbase/cdp-langchain";
import { CheckReviewHelpfulnessInput, CalculateReviewHelpfulness } from "./checkreviewscore";
import { CalculateIncentiveInput, CalculateIncentive } from "./incentivecalculation";
import { GeneratePayoutJSONInput, GeneratePayoutJSON } from "./generatestructuredoutput";

dotenv.config();

/**
 * Validates that required environment variables are set
 *
 * @throws {Error} - If required environment variables are missing
 * @returns {void}
 */
function validateEnvironment(): void {
  const missingVars: string[] = [];


  // Check required variables
  const requiredVars = ["XAI_API_KEY", "CDP_API_KEY_NAME", "CDP_API_KEY_PRIVATE_KEY"];
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Exit if any required variables are missing
  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set");
    missingVars.forEach(varName => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }

  // Warn about optional NETWORK_ID
  if (!process.env.NETWORK_ID) {
    console.warn("Warning: NETWORK_ID not set, defaulting to base-sepolia testnet");
  }
}

// Add this right after imports and before any other code
validateEnvironment();

// Configure a file to persist the agent's CDP MPC Wallet Data
const WALLET_DATA_FILE = "wallet_data.txt";

/**
 * Initialize the agent with CDP Agentkit
 *
 * @returns Agent executor and config
 */
async function initializeAgent() {
  try {
    // Initialize LLM
    const llm = new ChatXAI({
      model: "grok-beta",
    });

    let walletDataStr: string | null = null;

    // Read existing wallet data if available
    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
      } catch (error) {
        console.error("Error reading wallet data:", error);
        // Continue without wallet data
      }
    }

    // Configure CDP AgentKit
    const config = {
      cdpWalletData: walletDataStr || undefined,
      networkId: process.env.NETWORK_ID || "base-sepolia",
    };

    // Initialize CDP AgentKit
    const agentkit = await CdpAgentkit.configureWithWallet(config);

    // Initialize CDP AgentKit Toolkit and get tools
    const cdpToolkit = new CdpToolkit(agentkit);
    const tools = cdpToolkit.getTools();

    const HELPFULNESS_PROMPT = `This tool evaluates how helpful a review is to a company by analyzing its descriptiveness, sentiment, actionability, uniqueness, specificity, and length adequacy.`;

    const CALCULATE_INCENTIVE_PROMPT = `
    This tool calculates the incentive to pay to a reviewer based on their review score. 
    The score ranges between 1 and 100, and the incentive is a value between 10^-6 and 10^-4.
    `;

    const GENERATE_PAYOUT_JSON_PROMPT = `
    This tool generates a structured JSON output for payout information.
    The JSON contains the incentive amount, client wallet address, service ID.
    `;



    const reviewHelpfulnessTool = new CdpTool(
      {
        name: "check_review_helpfulness",
        description: HELPFULNESS_PROMPT,
        argsSchema: CheckReviewHelpfulnessInput,
        func: CalculateReviewHelpfulness,
      },
      agentkit  // Assuming agentkit is already instantiated
    );

    const calculateIncentiveTool = new CdpTool(
      {
      name: "calculate_incentive",
      description: CALCULATE_INCENTIVE_PROMPT,
      argsSchema: CalculateIncentiveInput,
      func: CalculateIncentive,
    },
      agentkit // Replace with the correct instantiation of CdpWrapper
    );

    const generateJSONoutput = new CdpTool(
      {
      name: "generate_payout_json",
      description: GENERATE_PAYOUT_JSON_PROMPT,
      argsSchema: GeneratePayoutJSONInput,
      func: GeneratePayoutJSON,
    },
      agentkit // Replace with the correct instantiation of CdpWrapper
    );


    tools.push(reviewHelpfulnessTool);
    tools.push(calculateIncentiveTool);
    tools.push(generateJSONoutput);

    // Store buffered conversation history in memory
    const memory = new MemorySaver();
    const agentConfig = { configurable: { thread_id: "CDP AgentKit Chatbot Example!" } };

    // Create React Agent using the LLM and CDP AgentKit tools
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier: `
        Your purpose is to look for incoming user reviews and generate score of those reviews of how much helpful they are.
        After calculating the score, you must calculate the incentive to pay to the reviewer based on their review score. You must also generate a
        structured JSON output for the payout information. You have access to these tools: check_review_helpfulness,
        calculate_incentive, and generate_payout_json. You should use them in the process. Don't generate the JSON by yourself only use the tool provided to you 
        and strictly give the final response of generated JSON as a code block output and nothing else with it.
        `,
    });

    // Save wallet data
    const exportedWallet = await agentkit.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, exportedWallet);

    return { agent, config: agentConfig };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error; // Re-throw to be handled by caller
  }
}

/**
 * Run the agent autonomously with specified intervals
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 * @param interval - Time interval between actions in seconds
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runAutonomousMode(agent: any, config: any, interval = 10) {
  console.log("Starting autonomous mode...");

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const thought =
        "Be creative and do something interesting on the blockchain. " +
        "Choose an action or set of actions and execute it that highlights your abilities.";

      const stream = await agent.stream({ messages: [new HumanMessage(thought)] }, config);

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }

      await new Promise(resolve => setTimeout(resolve, interval * 1000));
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
      }
      process.exit(1);
    }
  }
}

/**
 * Run the agent interactively based on user input
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runChatMode(agent: any, config: any) {
  console.log("Starting chat mode... Type 'exit' to end.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const userInput = await question("\nPrompt: ");

      if (userInput.toLowerCase() === "exit") {
        break;
      }

      const stream = await agent.stream({ messages: [new HumanMessage(userInput)] }, config);

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

/**
 * Choose whether to run in autonomous or chat mode based on user input
 *
 * @returns Selected mode
 */
async function chooseMode(): Promise<"chat" | "auto"> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  // eslint-disable-next-line no-constant-condition
  while (true) {
    console.log("\nAvailable modes:");
    console.log("1. chat    - Interactive chat mode");
    console.log("2. auto    - Autonomous action mode");

    const choice = (await question("\nChoose a mode (enter number or name): "))
      .toLowerCase()
      .trim();

    if (choice === "1" || choice === "chat") {
      rl.close();
      return "chat";
    } else if (choice === "2" || choice === "auto") {
      rl.close();
      return "auto";
    }
    console.log("Invalid choice. Please try again.");
  }
}

/**
 * Start the chatbot agent
 */
async function main(userReview: string, clientWallet: string, serviceId: string){
  try {
    
    const { agent, config } = await initializeAgent();
    const UserData = "The user_review is: " + userReview + " The client_wallet is: " + clientWallet + " The service_id is: " + serviceId;
    // const mode = await chooseMode();
    // runChatMode(agent, config);

    // if (mode === "chat") {
    //   await runChatMode(agent, config);
    // } else {
    //   await runAutonomousMode(agent, config);
    // }
    const stream = await agent.stream({ messages: [new HumanMessage(UserData)] }, config);

    let output = "";
    for await (const chunk of stream) {
      if ("agent" in chunk) {
        console.log(chunk.agent.messages[0].content);
        output += chunk.agent.messages[0].content;
      } else if ("tools" in chunk) {
        console.log(chunk.tools.messages[0].content);
        output += chunk.tools.messages[0].content;
      }
      console.log("-------------------");
    // }
    }
    return output;
    
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

export { main };

if (require.main === module) {
  console.log("Starting Agent...");
  main("This is such a good product.", "0x88C5553e7712a9c8130D798e44EbF8Cc62f136d6", "Amazon123").catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
