const { SapClient, Pdas } = require("@oobe-protocol-labs/synapse-sap-sdk");
const { Keypair, Connection, Transaction } = require("@solana/web3.js");
const crypto = require("crypto");
const bs58 = require("bs58").default;
require("dotenv").config();

function hashString(str) {
  return Array.from(crypto.createHash("sha256").update(str).digest());
}

async function inscribeSchema() {
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

  const toolPdaResult = Pdas.getToolPDA(agentPda, "CryptoSignalTool");
  const toolPda = Array.isArray(toolPdaResult) ? toolPdaResult[0] : toolPdaResult;

  console.log("ToolPDA:", toolPda.toBase58());

  const inputSchema = '{"type":"object","properties":{"coin":{"type":"string","enum":["BTC","ETH","SOL"]}},"required":["coin"]}';
  const outputSchema = '{"type":"object","properties":{"signal":{"type":"string"},"entry":{"type":"number"},"tp1":{"type":"number"},"sl":{"type":"number"},"rr":{"type":"number"}}}';

  async function sendSchema(schemaType, schemaStr, label) {
    console.log("Inscribing", label, "...");
    const schemaBuffer = Buffer.from(schemaStr, "utf8");
    
    const ix = await client.methods.inscribeToolSchema(
      schemaType,
      schemaBuffer,
      hashString(schemaStr),
      0
    )
    .accounts({
      wallet: keypair.publicKey,
      agent: agentPda,
      tool: toolPda,
    })
    .instruction();

    const { blockhash } = await connection.getLatestBlockhash("finalized");
    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.feePayer = keypair.publicKey;
    tx.add(ix);
    tx.sign(keypair);

    const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: true, maxRetries: 3 });
    console.log(label, "inscribed! TX:", sig);
    await new Promise(r => setTimeout(r, 3000));
  }

  await sendSchema(0, inputSchema, "Input schema");
  await sendSchema(1, outputSchema, "Output schema");
  console.log("All schemas inscribed! CryptoSignalTool fully configured!");
}

inscribeSchema().catch(err => {
  console.log("Error:", err.message);
  if(err.logs) console.log("Logs:", err.logs.slice(0, 8));
});
