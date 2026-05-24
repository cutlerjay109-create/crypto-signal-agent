
const { SapClient, Pdas } = require("@oobe-protocol-labs/synapse-sap-sdk");
const { Keypair, Connection, Transaction, SystemProgram, PublicKey } = require("@solana/web3.js");
const crypto = require("crypto");
const bs58 = require("bs58").default;
require("dotenv").config();

function hashString(str) {
  return Array.from(crypto.createHash("sha256").update(str).digest());
}

async function publishSignalTool() {
  const keypair = Keypair.fromSecretKey(bs58.decode(process.env.SOLANA_PRIVATE_KEY));
  const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
  const wallet = {
    publicKey: keypair.publicKey,
    payer: keypair,
    signTransaction: async (tx) => { tx.sign([keypair]); return tx; },
    signAllTransactions: async (txs) => { txs.forEach(tx => tx.sign([keypair])); return txs; },
  };
  const client = new SapClient({ connection, wallet, commitment: "confirmed" });

  const agentPdaResult = Pdas.getAgentPDA(keypair.publicKey);
  const agentPda = Array.isArray(agentPdaResult) ? agentPdaResult[0] : agentPdaResult;

  const toolName = "CryptoSignalTool";

  const toolPdaResult = Pdas.getToolPDA(agentPda, toolName);
  const toolPda = Array.isArray(toolPdaResult) ? toolPdaResult[0] : toolPdaResult;

  const globalPdaResult = Pdas.getGlobalPDA();
  const globalPda = Array.isArray(globalPdaResult) ? globalPdaResult[0] : globalPdaResult;

  console.log("Wallet:", keypair.publicKey.toBase58());
  console.log("AgentPDA:", agentPda.toBase58());
  console.log("ToolPDA:", toolPda.toBase58());
  console.log("Publishing tool:", toolName);

  // Check if tool already exists
  const existing = await connection.getAccountInfo(toolPda);
  if(existing) {
    console.log("Tool already published!");
    return;
  }

  const toolDescription = "Autonomous crypto BUY/SELL/HOLD signal generator for BTC/ETH/SOL using real news and AI sentiment analysis";
  const inputSchema = JSON.stringify({ coin: "BTC|ETH|SOL" });
  const outputSchema = JSON.stringify({ signal: "BUY|SELL|HOLD", entry: "number", tp1: "number", tp2: "number", sl: "number", rr: "number", confidence: "number" });

  const ix = await client.methods.publishTool(
    toolName,
    hashString(toolName),
    hashString("crypto-signals-v1"),
    hashString(toolDescription),
    hashString(inputSchema),
    hashString(outputSchema),
    0,  // httpMethod: GET
    1,  // category: AI/Data
    1,  // paramsCount
    0,  // requiredParams
    false // isCompound
  )
  .accounts({
    wallet: keypair.publicKey,
    agent: agentPda,
    tool: toolPda,
    globalRegistry: globalPda,
    systemProgram: SystemProgram.programId,
  })
  .instruction();

  console.log("Instruction built ✅");
  ix.keys.forEach((k, i) => console.log(i, k.pubkey.toBase58(), "w:", k.isWritable));

  const { blockhash } = await connection.getLatestBlockhash("finalized");
  const tx = new Transaction();
  tx.recentBlockhash = blockhash;
  tx.feePayer = keypair.publicKey;
  tx.add(ix);
  tx.sign(keypair);

  const sig = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: true, maxRetries: 3
  });
  console.log("Tool published! TX:", sig);
  console.log("Tool PDA:", toolPda.toBase58());
  console.log("CryptoSignalTool is now discoverable on SAP network!");
}

publishSignalTool().catch(err => {
  console.log("Error:", err.message);
  if(err.logs) console.log("Logs:", err.logs.slice(0, 8));
});
