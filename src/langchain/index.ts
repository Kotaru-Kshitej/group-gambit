import { PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import { Tool } from "langchain/tools";
import { SolanaAgentKit } from "../index";
import { create_image } from "../tools/create_image";
import { fetchPrice } from "../tools/fetch_price";
import { BN } from "@coral-xyz/anchor";
import { toJSON } from "../utils/toJSON";

export class CreateBet extends Tool {
  name = "solana_create_bet";
  description = `Create a new bet.
  The bet creator can create a new bet/wager/prediction market using the creator wallet address, seed, pool amount, minimum amount, and maximum amount
  This will run the createBet tool with the specified parameters
   Inputs (input is a JSON string):
      userId: number, eg 1158700339 (required)
      creatorAddress: string, eg "91Q1XdVxobuAjX8vcKj4PruC7KZsaEL3cU5cH61WyDmw" (required)
      poolAmount: number, eg 4 (required)
      min: number, eg 0.5 (required)
      max: number, eg 2 (required)
      seed: number, eg 11234 (required)
   
  `
  constructor(private solanaKit: SolanaAgentKit) {
    super()
  }
  protected async _call(input: any): Promise<string> {
    // protected async _call(input: string, x?: string): Promise<string> {
    const inp = JSON.parse(input)
    try {
      const result = await this.solanaKit.createBet(inp.userId, inp.creatorAddress, inp.poolAmount, inp.min, inp.max, inp.seed)
      if (!result.error) {
        console.log("bet created!", result)
      } else {
        console.log("error creating bet", result.data)
      }
      return JSON.stringify(result)
    }
    catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class JoinBet extends Tool {
  name = "solana_join_bet";
  description = `Join an existing bet.
  The participant can join an already created bet/wager/prediction market using the userId, creator wallet address, and the seed of the bet. 
  This will run the joinBet tool with the specified parameters. 

  Inputs (input is a JSON string):
    userId: number, eg 1158700339 (required)
    creatorAddress: string, eg "91Q1XdVxobuAjX8vcKj4PruC7KZsaEL3cU5cH61WyDmw" (required) - The wallet address of the bet creator.
    seed: number, eg 11234 (required) - The seed value used to uniquely identify the bet.
`;
  constructor(private solanaKit: SolanaAgentKit) {
    super()
  }
  protected async _call(input: string) {
    const inp = JSON.parse(input)
    try {
      const result = await this.solanaKit.joinBet(inp.userId, inp.creatorAddress, inp.seed)
      if (!result.error) {
        console.log("bet joined!", result)
      } else {
        console.log("error joining bet", result.data)
      }
      return JSON.stringify(result)
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}
export class ResolveBet extends Tool {
  name = "solana_resolve_bet";
  description = `Resolve an existing bet.
    The creator can resolve an active bet/wager/prediction market to determine the outcome using the bet ID, creator wallet address, seed of the bet, and the winner of the bet. 
This will run the resolveBet tool with the specified parameters.

Inputs (input is a JSON string):
   id: number, eg 1158700339 (required) - The unique identifier of the bet to resolve.
   creatorAddress: string, eg "91Q1XdVxobuAjX8vcKj4PruC7KZsaEL3cU5cH61WyDmw" (required) - The wallet address of the bet creator.
   seed: number, eg 11234 (required) - The seed value used to uniquely identify the bet.
   winner: string, eg "91Q1XdVxobuAjX8vcKj4PruC7KZsaEL3cU5cH61WyDmw" (required) - The winner of the bet. 
`;
  constructor(private solanaKit: SolanaAgentKit) {
    super()
  }
  protected async _call(input: string) {
    const inp = JSON.parse(input)
    try {
      const result = await this.solanaKit.resolveBet(inp.userId, inp.creatorAddress, inp.seed, inp.winner)
      if (!result.error) {
        console.log("bet joined!", result)
      } else {
        console.log("error joining bet", result.data)
      }
      return JSON.stringify(result)
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class CreateUserWallet extends Tool {
  name = "create_user_wallet";
  description = `Create a new wallet for the user.
    Creates a solana wallet for the user based on their userId
    Inputs:
    userId: number, eg 1158700339 (required)
    `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: number): Promise<string> {
    try {
      const result = await this.solanaKit.createUserWallet(input);
      return JSON.stringify({
        status: "success",
        message: "Created a new wallet sucessfully ".concat(result.address),
        data: result,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}


export class SolanaBalanceTool extends Tool {
  name = "solana_balance";
  description = `Get the balance of the Solana wallet.

  Get the solana wallet balance of the specific user based on the userId of the user

  Inputs:
  userId: number, eg 1158700339 (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(userId: number): Promise<string> {
    try {
      const response = await this.solanaKit.getUserWalletBalance(userId)
      if (response.error) {
        return JSON.stringify({
          status: "error",
          response: response.message,
          token: "SOL",
        });
      } else {
        return JSON.stringify({
          status: "success",
          response: response,
          token: "SOL",
        });
      }
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaTransferTool extends Tool {
  name = "solana_transfer";
  description = `Transfer tokens or SOL to another address ( also called as wallet address ).`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const recipient = new PublicKey(parsedInput.to);
      const mintAddress = parsedInput.mint
        ? new PublicKey(parsedInput.mint)
        : undefined;

      const tx = await this.solanaKit.transfer(
        recipient,
        parsedInput.amount,
        mintAddress
      );

      return JSON.stringify({
        status: "success",
        message: "Transfer completed successfully",
        amount: parsedInput.amount,
        recipient: parsedInput.to,
        token: parsedInput.mint || "SOL",
        transaction: tx,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaDeployTokenTool extends Tool {
  name = "solana_deploy_token";
  description = `Deploy a new token on Solana blockchain.`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.solanaKit.deployToken(
        parsedInput.name,
        parsedInput.uri,
        parsedInput.symbol,
        parsedInput.decimals,
        parsedInput.initialSupply
      );

      return JSON.stringify({
        status: "success",
        message: "Token deployed successfully",
        mintAddress: result.mint.toString(),
        decimals: parsedInput.decimals || 9,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaDeployCollectionTool extends Tool {
  name = "solana_deploy_collection";
  description = `Deploy a new NFT collection on Solana blockchain.

  Inputs (input is a JSON string):
  name: string, eg "My Collection" (required)
  uri: string, eg "https://example.com/collection.json" (required)
  royaltyBasisPoints?: number, eg 500 for 5% (optional)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.solanaKit.deployCollection(parsedInput);

      return JSON.stringify({
        status: "success",
        message: "Collection deployed successfully",
        collectionAddress: result.collectionAddress.toString(),
        name: parsedInput.name,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaMintNFTTool extends Tool {
  name = "solana_mint_nft";
  description = `Mint a new NFT in a collection on Solana blockchain.

    Inputs (input is a JSON string):
    collectionMint: string, eg "J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w" (required) - The address of the collection to mint into
    name: string, eg "My NFT" (required)
    uri: string, eg "https://example.com/nft.json" (required)
    recipient?: string, eg "9aUn5swQzUTRanaaTwmszxiv89cvFwUCjEBv1vZCoT1u" (optional) - The wallet to receive the NFT, defaults to agent's wallet which is ${this.solanaKit.wallet_address.toString()}`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.solanaKit.mintNFT(
        new PublicKey(parsedInput.collectionMint),
        {
          name: parsedInput.name,
          uri: parsedInput.uri,
        },
        parsedInput.recipient
          ? new PublicKey(parsedInput.recipient)
          : this.solanaKit.wallet_address
      );

      return JSON.stringify({
        status: "success",
        message: "NFT minted successfully",
        mintAddress: result.mint.toString(),
        metadata: {
          name: parsedInput.name,
          symbol: parsedInput.symbol,
          uri: parsedInput.uri,
        },
        recipient: parsedInput.recipient || result.mint.toString(),
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaTradeTool extends Tool {
  name = "solana_trade";
  description = `This tool can be used to swap tokens to another token ( It uses Jupiter Exchange ).

  Inputs ( input is a JSON string ):
  outputMint: string, eg "So11111111111111111111111111111111111111112" or "SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa" (required)
  inputAmount: number, eg 1 or 0.01 (required)
  inputMint?: string, eg "So11111111111111111111111111111111111111112" (optional)
  slippageBps?: number, eg 100 (optional)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const tx = await this.solanaKit.trade(
        new PublicKey(parsedInput.outputMint),
        parsedInput.inputAmount,
        parsedInput.inputMint
          ? new PublicKey(parsedInput.inputMint)
          : new PublicKey("So11111111111111111111111111111111111111112"),
        parsedInput.slippageBps
      );

      return JSON.stringify({
        status: "success",
        message: "Trade executed successfully",
        transaction: tx,
        inputAmount: parsedInput.inputAmount,
        inputToken: parsedInput.inputMint || "SOL",
        outputToken: parsedInput.outputMint,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaRequestFundsTool extends Tool {
  name = "solana_request_funds";
  description = "Request SOL from Solana faucet (devnet/testnet only)";

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(_input: string): Promise<string> {
    try {
      await this.solanaKit.requestFaucetFunds();

      return JSON.stringify({
        status: "success",
        message: "Successfully requested faucet funds",
        network: this.solanaKit.connection.rpcEndpoint.split("/")[2],
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaRegisterDomainTool extends Tool {
  name = "solana_register_domain";
  description = `Register a .sol domain name for your wallet.

  Inputs:
  name: string, eg "pumpfun.sol" (required)
  spaceKB: number, eg 1 (optional, default is 1)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  private validateInput(input: any): void {
    if (!input.name || typeof input.name !== "string") {
      throw new Error("name is required and must be a string");
    }
    if (
      input.spaceKB !== undefined &&
      (typeof input.spaceKB !== "number" || input.spaceKB <= 0)
    ) {
      throw new Error("spaceKB must be a positive number when provided");
    }
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = toJSON(input);
      this.validateInput(parsedInput);

      const tx = await this.solanaKit.registerDomain(
        parsedInput.name,
        parsedInput.spaceKB || 1
      );

      return JSON.stringify({
        status: "success",
        message: "Domain registered successfully",
        transaction: tx,
        domain: `${parsedInput.name}.sol`,
        spaceKB: parsedInput.spaceKB || 1,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaResolveDomainTool extends Tool {
  name = "solana_resolve_domain";
  description = `Resolve a .sol domain to a Solana PublicKey.

  Inputs:
  domain: string, eg "pumpfun.sol" or "pumpfun"(required)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const domain = input.trim();
      const publicKey = await this.solanaKit.resolveSolDomain(domain);

      return JSON.stringify({
        status: "success",
        message: "Domain resolved successfully",
        publicKey: publicKey.toBase58(),
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaGetDomainTool extends Tool {
  name = "solana_get_domain";
  description = `Retrieve the .sol domain associated for a given account address.

  Inputs:
  account: string, eg "4Be9CvxqHW6BYiRAxW9Q3xu1ycTMWaL5z8NX4HR3ha7t" (required)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const account = new PublicKey(input.trim());
      const domain = await this.solanaKit.getPrimaryDomain(account);

      return JSON.stringify({
        status: "success",
        message: "Primary domain retrieved successfully",
        domain,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaGetWalletAddressTool extends Tool {
  name = "solana_get_wallet_address";
  description = `Get the wallet address of the agent`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(_input: string): Promise<string> {
    return this.solanaKit.wallet_address.toString();
  }
}

export class SolanaPumpfunTokenLaunchTool extends Tool {
  name = "solana_launch_pumpfun_token";

  description = `This tool can be used to launch a token on Pump.fun,
   do not use this tool for any other purpose, or for creating SPL tokens.
   If the user asks you to chose the parameters, you should generate valid values.
   For generating the image, you can use the solana_create_image tool.

   Inputs:
   tokenName: string, eg "PumpFun Token",
   tokenTicker: string, eg "PUMP",
   description: string, eg "PumpFun Token is a token on the Solana blockchain",
   imageUrl: string, eg "https://i.imgur.com/UFm07Np_d.png`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  private validateInput(input: any): void {
    if (!input.tokenName || typeof input.tokenName !== "string") {
      throw new Error("tokenName is required and must be a string");
    }
    if (!input.tokenTicker || typeof input.tokenTicker !== "string") {
      throw new Error("tokenTicker is required and must be a string");
    }
    if (!input.description || typeof input.description !== "string") {
      throw new Error("description is required and must be a string");
    }
    if (!input.imageUrl || typeof input.imageUrl !== "string") {
      throw new Error("imageUrl is required and must be a string");
    }
    if (
      input.initialLiquiditySOL !== undefined &&
      typeof input.initialLiquiditySOL !== "number"
    ) {
      throw new Error("initialLiquiditySOL must be a number when provided");
    }
  }

  protected async _call(input: string): Promise<string> {
    try {
      // Parse and normalize input
      input = input.trim();
      let parsedInput = JSON.parse(input);

      this.validateInput(parsedInput);

      // Launch token with validated input
      await this.solanaKit.launchPumpFunToken(
        parsedInput.tokenName,
        parsedInput.tokenTicker,
        parsedInput.description,
        parsedInput.imageUrl,
        {
          twitter: parsedInput.twitter,
          telegram: parsedInput.telegram,
          website: parsedInput.website,
          initialLiquiditySOL: parsedInput.initialLiquiditySOL,
        }
      );

      return JSON.stringify({
        status: "success",
        message: "Token launched successfully on Pump.fun",
        tokenName: parsedInput.tokenName,
        tokenTicker: parsedInput.tokenTicker,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaCreateImageTool extends Tool {
  name = "solana_create_image";
  description =
    "Input should be a string prompt for the image.";

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  private validateInput(input: string): void {
    if (typeof input !== "string" || input.trim().length === 0) {
      throw new Error("Input must be a non-empty string prompt");
    }
  }

  protected async _call(input: string): Promise<string> {
    try {
      this.validateInput(input);
      const result = await create_image(this.solanaKit, input.trim());

      return JSON.stringify({
        status: "success",
        message: "Image created successfully",
        ...result,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaLendAssetTool extends Tool {
  name = "solana_lend_asset";
  description = `Lend idle USDC for yield using Lulo. ( only USDC is supported )

  Inputs (input is a json string):
  amount: number, eg 1, 0.01 (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      let amount = JSON.parse(input).amount || input;

      const tx = await this.solanaKit.lendAssets(amount);

      return JSON.stringify({
        status: "success",
        message: "Asset lent successfully",
        transaction: tx,
        amount: amount,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaTPSCalculatorTool extends Tool {
  name = "solana_get_tps";
  description = "Get the current TPS of the Solana network";

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(_input: string): Promise<string> {
    try {
      const tps = await this.solanaKit.getTPS();
      return `Solana (mainnet-beta) current transactions per second: ${tps}`;
    } catch (error: any) {
      return `Error fetching TPS: ${error.message}`;
    }
  }
}

export class SolanaStakeTool extends Tool {
  name = "solana_stake";
  description = `This tool can be used to stake your SOL (Solana), also called as SOL staking or liquid staking.

  Inputs ( input is a JSON string ):
  amount: number, eg 1 or 0.01 (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input) || Number(input);

      const tx = await this.solanaKit.stake(parsedInput.amount);

      return JSON.stringify({
        status: "success",
        message: "Staked successfully",
        transaction: tx,
        amount: parsedInput.amount,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

/**
 * Tool to fetch the price of a token in USDC
 */
export class SolanaFetchPriceTool extends Tool {
  name = "solana_fetch_price";
  description = `Fetch the price of a given token in USDC.
  
  Inputs:
  - tokenId: string, the mint address of the token, e.g., "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const price = await fetchPrice(this.solanaKit, input.trim());
      return JSON.stringify({
        status: "success",
        tokenId: input.trim(),
        priceInUSDC: price,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaTokenDataTool extends Tool {
  name = "solana_token_data";
  description = `Get the token data for a given token mint address

  Inputs: mintAddress is required.
  mintAddress: string, eg "So11111111111111111111111111111111111111112" (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = input.trim();

      const tokenData = await this.solanaKit.getTokenDataByAddress(parsedInput);

      return JSON.stringify({
        status: "success",
        tokenData: tokenData,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaTokenDataByTickerTool extends Tool {
  name = "solana_token_data_by_ticker";
  description = `Get the token data for a given token ticker

  Inputs: ticker is required.
  ticker: string, eg "USDC" (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const ticker = input.trim();
      const tokenData = await this.solanaKit.getTokenDataByTicker(ticker);
      return JSON.stringify({
        status: "success",
        tokenData: tokenData,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaCompressedAirdropTool extends Tool {
  name = "solana_compressed_airdrop";
  description = `Airdrop SPL tokens with ZK Compression (also called as airdropping tokens)
  
  Inputs (input is a JSON string):
  mintAddress: string, the mint address of the token, e.g., "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" (required)
  amount: number, the amount of tokens to airdrop per recipient, e.g., 42 (required)
  decimals: number, the decimals of the token, e.g., 6 (required)
  recipients: string[], the recipient addresses, e.g., ["1nc1nerator11111111111111111111111111111111"] (required)
  priorityFeeInLamports: number, the priority fee in lamports. Default is 30_000. (optional)
  shouldLog: boolean, whether to log progress to stdout. Default is false. (optional)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const txs = await this.solanaKit.sendCompressedAirdrop(
        parsedInput.mintAddress,
        parsedInput.amount,
        parsedInput.decimals,
        parsedInput.recipients,
        parsedInput.priorityFeeInLamports || 30_000,
        parsedInput.shouldLog || false
      );

      return JSON.stringify({
        status: "success",
        message: `Airdropped ${parsedInput.amount} tokens to ${parsedInput.recipients.length} recipients.`,
        transactionHashes: txs,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}
export class SolanaRaydiumCreateAmmV4 extends Tool {
  name = "raydium_create_ammV4";
  description = `Raydium's Legacy AMM that requiers an OpenBook marketID

  Inputs (input is a json string):
  marketId: string (required)
  baseAmount: number(int), eg: 111111 (required)
  quoteAmount: number(int), eg: 111111 (required)
  startTime: number(seconds), eg: now number or zero (required)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      let inputFormat = JSON.parse(input)

      const tx = await this.solanaKit.raydiumCreateAmmV4(
        new PublicKey(inputFormat.marketId),
        new BN(inputFormat.baseAmount),
        new BN(inputFormat.quoteAmount),
        new BN(inputFormat.startTime),
      );

      return JSON.stringify({
        status: "success",
        message: "Create raydium amm v4 pool successfully",
        transaction: tx,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaRaydiumCreateClmm extends Tool {
  name = "raydium_create_clmm";
  description = `Concentrated liquidity market maker, custom liquidity ranges, increased capital efficiency

  Inputs (input is a json string):
  mint1: string (required)
  mint2: string (required)
  configId: string (required) stores pool info, id, index, protocolFeeRate, tradeFeeRate, tickSpacing, fundFeeRate
  initialPrice: number, eg: 123.12 (required)
  startTime: number(seconds), eg: now number or zero (required)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      let inputFormat = JSON.parse(input)

      const tx = await this.solanaKit.raydiumCreateClmm(
        new PublicKey(inputFormat.mint1),
        new PublicKey(inputFormat.mint2),

        new PublicKey(inputFormat.configId),

        new Decimal(inputFormat.initialPrice),
        new BN(inputFormat.startTime),
      );

      return JSON.stringify({
        status: "success",
        message: "Create raydium clmm pool successfully",
        transaction: tx,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaRaydiumCreateCpmm extends Tool {
  name = "raydium_create_cpmm";
  description = `Raydium's newest CPMM, does not require marketID, supports Token 2022 standard 

  Inputs (input is a json string):
  mint1: string (required)
  mint2: string (required)
  configId: string (required), stores pool info, index, protocolFeeRate, tradeFeeRate, fundFeeRate, createPoolFee
  mintAAmount: number(int), eg: 1111 (required)
  mintBAmount: number(int), eg: 2222 (required)
  startTime: number(seconds), eg: now number or zero (required)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      let inputFormat = JSON.parse(input)

      const tx = await this.solanaKit.raydiumCreateCpmm(
        new PublicKey(inputFormat.mint1),
        new PublicKey(inputFormat.mint2),

        new PublicKey(inputFormat.configId),

        new BN(inputFormat.mintAAmount),
        new BN(inputFormat.mintBAmount),

        new BN(inputFormat.startTime),
      );

      return JSON.stringify({
        status: "success",
        message: "Create raydium cpmm pool successfully",
        transaction: tx,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class SolanaOpenbookCreateMarket extends Tool {
  name = "solana_openbook_create_market";
  description = `Openbook marketId, required for ammv4 

  Inputs (input is a json string):
  baseMint: string (required)
  quoteMint: string (required)
  lotSize: number (required)
  tickSize: number (required)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      let inputFormat = JSON.parse(input)

      const tx = await this.solanaKit.openbookCreateMarket(
        new PublicKey(inputFormat.baseMint),
        new PublicKey(inputFormat.quoteMint),

        inputFormat.lotSize,
        inputFormat.tickSize,
      );

      return JSON.stringify({
        status: "success",
        message: "Create openbook market successfully",
        transaction: tx,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export function createSolanaTools(solanaKit: SolanaAgentKit) {
  return [
    new CreateBet(solanaKit),
    new JoinBet(solanaKit),
    new ResolveBet(solanaKit),
    new CreateUserWallet(solanaKit),
    new SolanaBalanceTool(solanaKit),
    new SolanaTransferTool(solanaKit),
    // new SolanaMintNFTTool(solanaKit),
    // new SolanaTradeTool(solanaKit),
    // new SolanaRequestFundsTool(solanaKit),
    // new SolanaRegisterDomainTool(solanaKit),
    // new SolanaGetWalletAddressTool(solanaKit),
    // new SolanaPumpfunTokenLaunchTool(solanaKit),
    // new SolanaCreateImageTool(solanaKit),
    // new SolanaLendAssetTool(solanaKit),
    // new SolanaTPSCalculatorTool(solanaKit),
    // new SolanaStakeTool(solanaKit),
    // new SolanaFetchPriceTool(solanaKit),
    // new SolanaResolveDomainTool(solanaKit),
    // new SolanaGetDomainTool(solanaKit),
    // new SolanaTokenDataTool(solanaKit),
    // new SolanaTokenDataByTickerTool(solanaKit),
    // new SolanaCompressedAirdropTool(solanaKit),
    // new SolanaRaydiumCreateAmmV4(solanaKit),
    // new SolanaRaydiumCreateClmm(solanaKit),
    // new SolanaRaydiumCreateCpmm(solanaKit),
    // new SolanaOpenbookCreateMarket(solanaKit),
  ];
}
