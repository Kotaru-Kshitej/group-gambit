import idl from "../contract/vault_telegram.json"
import { VaultTelegram } from "../contract/vault_telegram"
import { Connection, Keypair, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js"
import base58 from "bs58"
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor"
const idl_object = JSON.parse(JSON.stringify(idl))
import dotenv from "dotenv"
import { BN } from "bn.js"
dotenv.config();
export async function join_bet(id: number, creatorAddress: string, seeds: number) {
    const rpcUrl = process.env.RPC_URL || ""
    const privateKey = process.env.SOLANA_PRIVATE_KEY || ""
    const programId = new PublicKey(idl.address)
    const connection = new Connection(rpcUrl)
    const wallet = Keypair.fromSecretKey(base58.decode(privateKey))
    const anchorWallet = new Wallet(wallet)
    const provider = new AnchorProvider(connection, anchorWallet, { commitment: "confirmed" })
    const program = new Program<VaultTelegram>(idl_object, provider)
    const creator = new PublicKey(creatorAddress)
    const seed = new BN(seeds)
    const [betState] =
        PublicKey.findProgramAddressSync(
            [
                Buffer.from("bet_state"),
                creator.toBuffer(),
                seed.toArrayLike(Buffer, "le", 8),
            ],
            program.programId
        );
    const [vaultPool] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), betState.toBuffer()],
        program.programId
    );
    const ix = await program.methods
        .join(seed)
        .accountsPartial({
            maker: creator,
            user: creator, //CHANGE THIS CREATE A ID TO ADDRESS FUNCTION
            betState: betState,
            vaultPool: vaultPool,
        })
        .instruction()
    const instructions = []
    const blockhash = (await connection.getLatestBlockhash()).blockhash
    instructions.push(ix)
    const message = new TransactionMessage({
        instructions,
        payerKey: creator,
        recentBlockhash: blockhash,
    }).compileToV0Message()
    const transaction = new VersionedTransaction(message)
    try {

        const response = await fetch(`https://staging.crossmint.com/api/v1-alpha2/wallets/userId:${id}:solana-mpc-wallet/transactions`, {
            method: "POST",
            headers: {
                "X-API-KEY": process.env.CROSSMINT_API_KEY || '',
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                params: {
                    transaction: base58.encode(transaction.serialize())
                }
            })
        });
        const data = await response.json()
        return {
            error: false,
            data: data
        }
    } catch (e) {
        return {
            data: e,
            error: true
        }
    }
}