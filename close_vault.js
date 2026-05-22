
const { createSapClient, Pdas } = require("@oobe-protocol-labs/synapse-sap-sdk");
const { Keypair, PublicKey, TransactionInstruction } = require("@solana/web3.js");
const crypto = require("crypto");
const bs58 = require("bs58").default;
require("dotenv").config();

const SAP_PROGRAM_ID = new PublicKey("SAPpUhsWLJG1FfkGRcXagEDMrMsWGjbky7AyhGpFETZ");

async function closeVault() {
  const keypair = Keypair.fromSecretKey(bs58.decode(process.env.SOLANA_PRIVATE_KEY));
  const wallet = {
    publicKey: keypair.publicKey,
    payer: keypair,
    signTransaction: async (tx) => { tx.sign([keypair]); return tx; },
    signAllTransactions: async (txs) => { return txs.map(tx => { tx.sign([keypair]); return tx; }); },
  };

  const client = createSapClient("https://api.mainnet-beta.solana.com", wallet);
  const walletPubkey = keypair.publicKey;

  const agentPdaResult = Pdas.getAgentPDA(walletPubkey);
  const agentPda = Array.isArray(agentPdaResult) ? agentPdaResult[0] : agentPdaResult;

  const vaultPdaResult = Pdas.getVaultPDA(agentPda);
  const vaultPda = Array.isArray(vaultPdaResult) ? vaultPdaResult[0] : vaultPdaResult;

  const globalPdaResult = Pdas.getGlobalPDA();
  const globalPda = Array.isArray(globalPdaResult) ? globalPdaResult[0] : globalPdaResult;

  console.log("Wallet:", walletPubkey.toBase58());
  console.log("AgentPDA:", agentPda.toBase58());
  console.log("VaultPDA:", vaultPda.toBase58());

  const vaultInfo = await client.connection.getAccountInfo(vaultPda);
  console.log("Vault exists:", vaultInfo !== null);
  if(vaultInfo === null) {
    console.log("Vault already closed or never existed");
    return;
  }

  console.log("Closing vault...");

  const ix = await client.methods.closeVault()
  .accounts({
    wallet: walletPubkey,
    agent: agentPda,
    vault: vaultPda,
    global: globalPda,
  })
  .instruction();

  console.log("Accounts:");
  ix.keys.forEach((k, i) => {
    console.log(i, k.pubkey.toBase58(), k.isWritable ? "writable" : "readonly");
  });

  const tx = await client.buildTransaction([ix], walletPubkey);
  tx.sign([keypair]);

  const sig = await client.connection.sendTransaction(tx, {
    preflightCommitment: "confirmed",
    maxRetries: 3,
  });

  await client.connection.confirmTransaction(sig, "confirmed");
  console.log("Vault closed! TX:", sig);

  const vaultAfter = await client.connection.getAccountInfo(vaultPda);
  console.log("Vault exists after close:", vaultAfter !== null);
  if(vaultAfter === null) {
    console.log("Vault closed successfully - now run close_agent_fixed.js");
  }
}

closeVault().catch(err => {
  console.error("Error:", err.message);
  if(err.logs) console.error("Logs:", err.logs.slice(0, 8));
});
