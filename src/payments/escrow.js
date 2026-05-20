require("dotenv").config();
const { Keypair, Connection, TransactionInstruction } = require("@solana/web3.js");
const { createSapClient, Pdas } = require("@oobe-protocol-labs/synapse-sap-sdk");
const { BN } = require("@coral-xyz/anchor");
const bs58 = require("bs58").default;
const sapConfig = require("../../config/sap.config");
const { log } = require("../utils/logger");

const PUBLIC_RPC = "https://api.mainnet-beta.solana.com";

let client = null;
let keypair = null;
let publicConnection = null;
let escrowNonce = new BN(1);
let escrowCreated = false;

async function initEscrowClient() {
  if (client) return { client, keypair, publicConnection };

  const privateKey = process.env.SOLANA_PRIVATE_KEY;
  keypair = privateKey.startsWith("[")
    ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(privateKey)))
    : Keypair.fromSecretKey(bs58.decode(privateKey));

  client = createSapClient(sapConfig.rpcUrl, keypair);
  publicConnection = new Connection(PUBLIC_RPC, "confirmed");

  log("Escrow client initialized");
  return { client, keypair, publicConnection };
}

function toProperIx(ix) {
  return new TransactionInstruction({
    keys: ix.keys,
    programId: ix.programId,
    data: ix.data,
  });
}

async function getAgentPda() {
  const result = Pdas.getAgentPDA(keypair.publicKey);
  return Array.isArray(result) ? result[0] : result;
}

async function getEscrowPda(agentPda) {
  const result = Pdas.getEscrowV2PDA(keypair.publicKey, agentPda, escrowNonce);
  return Array.isArray(result) ? result[0] : result;
}

async function setupEscrow() {
  try {
    const { client, keypair } = await initEscrowClient();
    log("Setting up real on-chain escrow...");

    const agentPda = await getAgentPda();
    const escrowPda = await getEscrowPda(agentPda);

    // Check if escrow already exists
    const escrowAccount = await publicConnection.getAccountInfo(escrowPda);
    if (escrowAccount) {
      log(`Escrow already exists: ${escrowPda.toString()}`);
      escrowCreated = true;
      return { success: true, escrowPda: escrowPda.toString() };
    }

    log("Creating new escrow on-chain...");

    const rawIx = await client.escrow.createEscrowV2({
      escrowNonce: escrowNonce,
      pricePerCall: new BN(1000),
      maxCalls: new BN(0),
      initialDeposit: new BN(500000),
      expiresAt: new BN(0),
      volumeCurve: [],
      tokenMint: null,
      tokenDecimals: null,
      settlementSecurity: 0,
      disputeWindowSlots: new BN(0),
      coSigner: null,
      arbiter: null,
      depositor: keypair.publicKey,
      agent: agentPda,
    });

    const ix = toProperIx(rawIx);
    const tx = await client.buildTransaction([ix], keypair.publicKey);
    const sig = await client.sendTransaction(tx, [keypair]);

    log(`Escrow created on-chain! TX: ${sig}`);
    log(`Escrow PDA: ${escrowPda.toString()}`);
    escrowCreated = true;

    return { success: true, txSignature: sig, escrowPda: escrowPda.toString() };

  } catch (error) {
    log(`Escrow setup failed: ${error.message}`, "ERROR");
    escrowCreated = false;
    return { success: false, error: error.message };
  }
}

async function settleEscrowPayment(serviceData, calls = 1) {
  try {
    const { client, keypair } = await initEscrowClient();

    if (!escrowCreated) {
      const setup = await setupEscrow();
      if (!setup.success) {
        log("Escrow not available - skipping settlement", "WARN");
        return { success: false, error: "Escrow not set up" };
      }
    }

    log(`Settling escrow payment for ${calls} call(s)...`);

    const agentPda = await getAgentPda();

    const agentStatsPdaResult = Pdas.getAgentStatsPDA(keypair.publicKey);
    const agentStatsPda = Array.isArray(agentStatsPdaResult)
      ? agentStatsPdaResult[0]
      : agentStatsPdaResult;

    const escrowPda = await getEscrowPda(agentPda);

    const receiptNonce = new BN(Date.now());
    const receiptPdaResult = Pdas.getPendingSettlementPDA(escrowPda, receiptNonce);
    const receiptPda = Array.isArray(receiptPdaResult)
      ? receiptPdaResult[0]
      : receiptPdaResult;

    const { sha256, hashToArray } = require("@oobe-protocol-labs/synapse-sap-sdk");
    const serviceHash = hashToArray(sha256(`${serviceData}-${Date.now()}`));

    const rawIx = await client.escrow.settleCallsV2({
      escrowNonce: escrowNonce,
      callsToSettle: new BN(calls),
      serviceHash: serviceHash,
      wallet: keypair.publicKey,
      agent: agentPda,
      agentStats: agentStatsPda,
      escrow: escrowPda,
      settlementReceipt: receiptPda,
    });

    const ix = toProperIx(rawIx);
    const tx = await client.buildTransaction([ix], keypair.publicKey);
    const sig = await client.sendTransaction(tx, [keypair]);

    log(`Escrow settled on-chain! TX: ${sig}`);
    return { success: true, receipt: sig, calls };

  } catch (error) {
    log(`Escrow settlement failed: ${error.message}`, "ERROR");
    return { success: false, error: error.message };
  }
}

async function getEscrowBalance() {
  try {
    const { keypair } = await initEscrowClient();
    const agentPda = await getAgentPda();
    const escrowPda = await getEscrowPda(agentPda);
    const info = await publicConnection.getAccountInfo(escrowPda);
    return { balance: info ? info.lamports : 0 };
  } catch (error) {
    log(`Failed to get escrow balance: ${error.message}`, "ERROR");
    return { balance: 0 };
  }
}

module.exports = { setupEscrow, settleEscrowPayment, getEscrowBalance };
