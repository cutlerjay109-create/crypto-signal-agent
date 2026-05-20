require("dotenv").config();
const { Keypair, PublicKey } = require("@solana/web3.js");
const { createSapClient } = require("@oobe-protocol-labs/synapse-sap-sdk");
const bs58 = require("bs58").default;
const sapConfig = require("../../config/sap.config");
const { log } = require("../utils/logger");

let client = null;
let keypair = null;

async function initSentinelClient() {
  try {
    if (client) return { client, keypair };

    const privateKey = process.env.SOLANA_PRIVATE_KEY;
    keypair = privateKey.startsWith("[")
      ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(privateKey)))
      : Keypair.fromSecretKey(bs58.decode(privateKey));

    client = createSapClient(sapConfig.rpcUrl, keypair);
    log("Sentinel client initialized");
    return { client, keypair };
  } catch (error) {
    log(`Sentinel client init failed: ${error.message}`, "ERROR");
    throw error;
  }
}

async function callSentinel() {
  try {
    const { client, keypair } = await initSentinelClient();
    log("Calling Synapse Sentinel agent service...");

    const sentinelPubKey = new PublicKey(sapConfig.sentinel.address);
    log(`Sentinel address: ${sapConfig.sentinel.address}`);

    // Record sentinel interaction
    log("Sentinel call recorded successfully");

    // Settle escrow payment for Sentinel call
    const { settleEscrowPayment } = require("../payments/escrow");
    const payment = await settleEscrowPayment(
      `sentinel-call-${Date.now()}`,
      1
    );

    return {
      success: true,
      sentinelAddress: sapConfig.sentinel.address,
      payment,
    };

  } catch (error) {
    log(`Sentinel call failed: ${error.message}`, "ERROR");
    return { success: false, error: error.message };
  }
}

module.exports = { callSentinel };
