
const { createSapClient, Pdas } = require("@oobe-protocol-labs/synapse-sap-sdk");
const { Keypair, PublicKey, TransactionInstruction } = require("@solana/web3.js");
const crypto = require("crypto");
const bs58 = require("bs58").default;
require("dotenv").config();

const SAP_PROGRAM_ID = new PublicKey("SAPpUhsWLJG1FfkGRcXagEDMrMsWGjbky7AyhGpFETZ");

function anchorDiscriminator(ixName) {
  return crypto.createHash("sha256").update("global:" + ixName).digest().subarray(0, 8);
}

async function main() {
  console.log("MAINNET AGENT CLOSURE");
  const dryRun = process.env.AGENT_CLOSE_CONFIRM !== "YES";
  console.log("Dry run:", dryRun ? "YES" : "NO");

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

  const agentStatsPdaResult = Pdas.getAgentStatsPDA(agentPda);
  const agentStatsPda = Array.isArray(agentStatsPdaResult) ? agentStatsPdaResult[0] : agentStatsPdaResult;

  const globalPdaResult = Pdas.getGlobalPDA();
  const globalRegistryPda = Array.isArray(globalPdaResult) ? globalPdaResult[0] : globalPdaResult;

  const vaultPdaResult = Pdas.getVaultPDA(agentPda);
  const vaultCheckPda = Array.isArray(vaultPdaResult) ? vaultPdaResult[0] : vaultPdaResult;

  console.log("Wallet:", walletPubkey.toBase58());
  console.log("AgentPDA:", agentPda.toBase58());
  console.log("AgentStatsPDA:", agentStatsPda.toBase58());
  console.log("GlobalRegistry:", globalRegistryPda.toBase58());
  console.log("VaultCheck:", vaultCheckPda.toBase58());

  const balance = await client.connection.getBalance(walletPubkey);
  console.log("Balance:", balance / 1e9, "SOL");

  const agentInfo = await client.connection.getAccountInfo(agentPda);
  if(agentInfo === null) throw new Error("No agent account found");
  console.log("Agent exists: YES");

  const statsInfo = await client.connection.getAccountInfo(agentStatsPda);
  console.log("AgentStats exists:", statsInfo !== null);
  if(statsInfo === null) throw new Error("agentStatsPda missing");

  const globalInfo = await client.connection.getAccountInfo(globalRegistryPda);
  console.log("GlobalRegistry exists:", globalInfo !== null);
  if(globalInfo === null) throw new Error("globalRegistryPda missing");

  const vaultInfo = await client.connection.getAccountInfo(vaultCheckPda);
  console.log("VaultCheck exists:", vaultInfo !== null);
  if(vaultInfo !== null && vaultInfo.data.length > 0) {
    throw new Error("VaultCheck not empty - close vault first");
  }
  console.log("VaultCheck precondition satisfied");

  if(dryRun) {
    console.log("DRY RUN complete - all checks passed");
    console.log("To actually close run:");
    console.log("AGENT_CLOSE_CONFIRM=YES node close_agent_fixed.js");
    return;
  }

  console.log("Building RAW closeAgent instruction...");

  const ix = new TransactionInstruction({
    programId: SAP_PROGRAM_ID,
    keys: [
      { pubkey: walletPubkey,      isSigner: true,  isWritable: true  },
      { pubkey: agentPda,          isSigner: false, isWritable: true  },
      { pubkey: agentStatsPda,     isSigner: false, isWritable: true  },
      { pubkey: vaultCheckPda,     isSigner: false, isWritable: false },
      { pubkey: globalRegistryPda, isSigner: false, isWritable: true  },
    ],
    data: anchorDiscriminator("close_agent"),
  });

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
  console.log("Agent closed! TX:", sig);

  const agentAfter = await client.connection.getAccountInfo(agentPda);
  const statsAfter = await client.connection.getAccountInfo(agentStatsPda);
  console.log("Agent exists after close:", agentAfter !== null);
  console.log("AgentStats exists after close:", statsAfter !== null);

  if(agentAfter === null && statsAfter === null) {
    console.log("SUCCESS - SOL returned to wallet!");
  }
}

main().catch(err => {
  console.error("Error:", err.message);
  if(err.logs) console.error("Logs:", err.logs);
  process.exit(1);
});
