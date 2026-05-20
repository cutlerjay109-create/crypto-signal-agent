require("dotenv").config();
const { Keypair, Connection, SystemProgram, TransactionMessage, VersionedTransaction, PublicKey } = require("@solana/web3.js");
const { SapClient, Pdas } = require("@oobe-protocol-labs/synapse-sap-sdk");
const bs58 = require("bs58").default;
const sapConfig = require("../../config/sap.config");
const { log } = require("../utils/logger");

const PUBLIC_RPC = "https://api.mainnet-beta.solana.com";

async function registerAgent() {
  try {
    log("Starting agent registration on SAP mainnet...");

    const privateKey = process.env.SOLANA_PRIVATE_KEY;
    const keypair = privateKey.startsWith("[")
      ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(privateKey)))
      : Keypair.fromSecretKey(bs58.decode(privateKey));

    log(`Wallet loaded: ${keypair.publicKey.toString()}`);

    const publicConnection = new Connection(PUBLIC_RPC, "confirmed");

    const wallet = {
      publicKey: keypair.publicKey,
      signTransaction: async (tx) => { tx.sign([keypair]); return tx; },
      signAllTransactions: async (txs) => { txs.forEach(tx => tx.sign([keypair])); return txs; },
    };

    const client = new SapClient({ connection: publicConnection, wallet, commitment: "confirmed" });

    const agentPdaResult = Pdas.getAgentPDA(keypair.publicKey);
    const agentPda = Array.isArray(agentPdaResult) ? agentPdaResult[0] : agentPdaResult;

    const globalPdaResult = Pdas.getGlobalPDA();
    const globalPda = Array.isArray(globalPdaResult) ? globalPdaResult[0] : globalPdaResult;

    // Check if already registered
    const agentInfo = await publicConnection.getAccountInfo(agentPda);
    if (agentInfo) {
      log(`Agent already registered: ${keypair.publicKey.toString()}`);
      return {
        success: true,
        alreadyExists: true,
        publicKey: keypair.publicKey.toString(),
      };
    }

    log("Building registration instruction...");

    // First get the instruction to find correct statsPDA
    const tempStatsPda = Pdas.getAgentStatsPDA(keypair.publicKey);
    const tempStats = Array.isArray(tempStatsPda) ? tempStatsPda[0] : tempStatsPda;

    let ix;
    try {
      ix = await client.methods.registerAgent(
        sapConfig.agent.name,
        sapConfig.agent.description,
        sapConfig.agent.capabilities,
        sapConfig.agent.pricing,
        sapConfig.agent.protocols,
        null, null, null
      )
      .accounts({
        wallet: keypair.publicKey,
        agent: agentPda,
        agentStats: tempStats,
        global: globalPda,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
    } catch(e) {
      throw e;
    }

    log("Sending registration transaction...");

    const { blockhash, lastValidBlockHeight } =
      await publicConnection.getLatestBlockhash("finalized");

    const msg = new TransactionMessage({
      payerKey: keypair.publicKey,
      recentBlockhash: blockhash,
      instructions: [ix],
    }).compileToV0Message();

    const tx = new VersionedTransaction(msg);
    tx.sign([keypair]);

    const sig = await publicConnection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    await publicConnection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed"
    );

    log(`Agent registered on-chain! TX: ${sig}`);
    log(`Explorer: https://explorer.oobeprotocol.ai/agents/${keypair.publicKey.toString()}`);

    return {
      success: true,
      alreadyExists: false,
      publicKey: keypair.publicKey.toString(),
      txSignature: sig,
    };

  } catch (error) {
    // Handle seeds constraint - get correct PDA from error
    if (error.logs) {
      const rightLine = error.logs.find(l => l.includes("Right:"));
      const rightIdx = error.logs.indexOf(rightLine);
      if (rightIdx >= 0 && error.logs[rightIdx + 1]) {
        const correctStatsPda = new PublicKey(error.logs[rightIdx + 1].trim());
        log(`Retrying with correct StatsPDA: ${correctStatsPda.toString()}`);

        const privateKey = process.env.SOLANA_PRIVATE_KEY;
        const keypair = privateKey.startsWith("[")
          ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(privateKey)))
          : Keypair.fromSecretKey(bs58.decode(privateKey));

        const publicConnection = new Connection(PUBLIC_RPC, "confirmed");
        const wallet = {
          publicKey: keypair.publicKey,
          signTransaction: async (tx) => { tx.sign([keypair]); return tx; },
          signAllTransactions: async (txs) => { txs.forEach(tx => tx.sign([keypair])); return txs; },
        };

        const client = new SapClient({ connection: publicConnection, wallet, commitment: "confirmed" });

        const agentPdaResult = Pdas.getAgentPDA(keypair.publicKey);
        const agentPda = Array.isArray(agentPdaResult) ? agentPdaResult[0] : agentPdaResult;

        const globalPdaResult = Pdas.getGlobalPDA();
        const globalPda = Array.isArray(globalPdaResult) ? globalPdaResult[0] : globalPdaResult;

        const ix = await client.methods.registerAgent(
          sapConfig.agent.name,
          sapConfig.agent.description,
          sapConfig.agent.capabilities,
          sapConfig.agent.pricing,
          sapConfig.agent.protocols,
          null, null, null
        )
        .accounts({
          wallet: keypair.publicKey,
          agent: agentPda,
          agentStats: correctStatsPda,
          global: globalPda,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

        const { blockhash, lastValidBlockHeight } =
          await publicConnection.getLatestBlockhash("finalized");

        const msg = new TransactionMessage({
          payerKey: keypair.publicKey,
          recentBlockhash: blockhash,
          instructions: [ix],
        }).compileToV0Message();

        const tx = new VersionedTransaction(msg);
        tx.sign([keypair]);

        const sig = await publicConnection.sendRawTransaction(tx.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        });

        await publicConnection.confirmTransaction(
          { signature: sig, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        log(`Agent registered! TX: ${sig}`);
        return {
          success: true,
          alreadyExists: false,
          publicKey: keypair.publicKey.toString(),
          txSignature: sig,
        };
      }
    }

    if (error.message && error.message.includes("already in use")) {
      log("Agent already registered");
      const privateKey = process.env.SOLANA_PRIVATE_KEY;
      const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
      return { success: true, alreadyExists: true, publicKey: keypair.publicKey.toString() };
    }

    log(`Registration failed: ${error.message}`, "ERROR");
    throw error;
  }
}

module.exports = { registerAgent };
