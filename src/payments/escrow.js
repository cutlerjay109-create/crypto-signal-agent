
require("dotenv").config();
const { Keypair, Connection, Transaction, SystemProgram } = require("@solana/web3.js");
const { SapClient, Pdas } = require("@oobe-protocol-labs/synapse-sap-sdk");
const BN = require("bn.js");
const bs58 = require("bs58").default;
const { log } = require("../utils/logger");

const PUBLIC_RPC = process.env.SYNAPSE_RPC_URL || "https://api.mainnet-beta.solana.com";

let client = null;
let keypair = null;
let connection = null;
let escrowNonce = null;
let escrowCreated = false;
let escrowPdaAddress = null;

async function initEscrowClient() {
  if (client) return { client, keypair, connection };

  const privateKey = process.env.SOLANA_PRIVATE_KEY;
  keypair = privateKey.startsWith("[")
    ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(privateKey)))
    : Keypair.fromSecretKey(bs58.decode(privateKey));

  connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

  const wallet = {
    publicKey: keypair.publicKey,
    payer: keypair,
    signTransaction: async (tx) => { tx.sign([keypair]); return tx; },
    signAllTransactions: async (txs) => { txs.forEach(tx => tx.sign([keypair])); return txs; },
  };

  client = new SapClient({ connection, wallet, commitment: "confirmed" });

  log("Escrow client initialized");
  return { client, keypair, connection };
}

async function setupEscrow() {
  try {
    await initEscrowClient();
    log("Setting up real on-chain escrow...");

    const agentPdaResult = Pdas.getAgentPDA(keypair.publicKey);
    const agentPda = Array.isArray(agentPdaResult) ? agentPdaResult[0] : agentPdaResult;

    escrowNonce = new BN(Date.now());

    const escrowPdaResult = Pdas.getEscrowV2PDA(agentPda, escrowNonce);
    const escrowPda = Array.isArray(escrowPdaResult) ? escrowPdaResult[0] : escrowPdaResult;
    escrowPdaAddress = escrowPda;

    const existing = await connection.getAccountInfo(escrowPda);
    if (existing) {
      log("Escrow already exists: " + escrowPda.toBase58());
      escrowCreated = true;
      return { success: true, escrowPda: escrowPda.toBase58() };
    }

    log("Creating new escrow on-chain...");

    const ix = await client.methods.createEscrowV2(
      escrowNonce,
      new BN(100000),
      new BN(1000),
      new BN(1000000),
      new BN(0),
      [],
      null,
      0,
      0,
      new BN(0),
      null,
      null
    )
    .accounts({
      depositor: keypair.publicKey,
      agent: agentPda,
      escrow: escrowPda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

    const { blockhash } = await connection.getLatestBlockhash("finalized");
    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.feePayer = keypair.publicKey;
    tx.add(ix);
    tx.sign(keypair);

    const sig = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: true, maxRetries: 3
    });

    log("Escrow created on-chain! TX: " + sig);
    log("Escrow PDA: " + escrowPda.toBase58());
    escrowCreated = true;

    return { success: true, txSignature: sig, escrowPda: escrowPda.toBase58() };

  } catch (error) {
    log("Escrow setup failed: " + error.message, "ERROR");
    escrowCreated = false;
    return { success: false, error: error.message };
  }
}

async function settleEscrowPayment(serviceData, calls = 1) {
  try {
    await initEscrowClient();

    if (!escrowCreated) {
      const setup = await setupEscrow();
      if (!setup.success) {
        log("Escrow not available - skipping settlement", "WARN");
        return { success: false, error: "Escrow not set up" };
      }
    }

    log("Settling escrow payment for " + calls + " call(s)...");

    const agentPdaResult = Pdas.getAgentPDA(keypair.publicKey);
    const agentPda = Array.isArray(agentPdaResult) ? agentPdaResult[0] : agentPdaResult;

    const agentStatsPdaResult = Pdas.getAgentStatsPDA(agentPda);
    const agentStatsPda = Array.isArray(agentStatsPdaResult) ? agentStatsPdaResult[0] : agentStatsPdaResult;

    const escrowPda = escrowPdaAddress;
    const receiptNonce = new BN(Date.now());

    const receiptPdaResult = Pdas.getPendingSettlementPDA(escrowPda, receiptNonce);
    const receiptPda = Array.isArray(receiptPdaResult) ? receiptPdaResult[0] : receiptPdaResult;

    const ix = await client.methods.settleCallsV2(
      escrowNonce,
      new BN(calls),
      receiptNonce,
      Array(32).fill(0)
    )
    .accounts({
      wallet: keypair.publicKey,
      agent: agentPda,
      agentStats: agentStatsPda,
      escrow: escrowPda,
      settlementReceipt: receiptPda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

    const { blockhash } = await connection.getLatestBlockhash("finalized");
    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.feePayer = keypair.publicKey;
    tx.add(ix);
    tx.sign(keypair);

    const sig = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: true, maxRetries: 3
    });

    log("Escrow settled on-chain! TX: " + sig);
    return { success: true, receipt: sig, calls };

  } catch (error) {
    log("Escrow settlement failed: " + error.message, "ERROR");
    return { success: false, error: error.message };
  }
}

async function getEscrowBalance() {
  try {
    await initEscrowClient();
    const info = escrowPdaAddress ? await connection.getAccountInfo(escrowPdaAddress) : null;
    return { balance: info ? info.lamports : 0 };
  } catch (error) {
    return { balance: 0 };
  }
}

module.exports = { setupEscrow, settleEscrowPayment, getEscrowBalance };
