require("dotenv").config();
const cron = require("node-cron");
const { log } = require("./utils/logger");
const { registerAgent } = require("./agent/register");
const { setupEscrow } = require("./payments/escrow");
const { runWorkflow } = require("./agent/workflow");

async function start() {
  log("=".repeat(50));
  log("  CRYPTO SIGNAL AGENT STARTING UP");
  log("=".repeat(50));

  try {

    // ================================================
    // STEP 1 — Register Agent on SAP Mainnet
    // ================================================
    log("Registering agent on SAP mainnet...");
    let registration;
    try {
      registration = await registerAgent();
    } catch(regErr) {
      log("Registration skipped: " + regErr.message, "WARN");
      registration = { success: true, alreadyExists: true, publicKey: process.env.SOLANA_PUBLIC_KEY };
    }

    if (registration.alreadyExists) {
      log(`Agent already registered: ${registration.publicKey}`);
    } else {
      log(`Agent registered successfully: ${registration.publicKey}`);
      log(`View on explorer: https://explorer.oobeprotocol.ai/agents/${registration.publicKey}`);
    }

    // ================================================
    // STEP 2 — Setup Escrow
    // ================================================
    log("Setting up escrow...");
    await setupEscrow();
    log("Escrow setup complete");

    // ================================================
    // STEP 3 — Run First Cycle Immediately
    // ================================================
    log("Running first workflow cycle immediately...");
    await runWorkflow();

    // ================================================
    // STEP 4 — Start Hourly Scheduler
    // ================================================
    const intervalMinutes = process.env.SCHEDULE_INTERVAL || 60;
    log(`Starting scheduler - Running every ${intervalMinutes} minutes...`);

    // Run every hour (or whatever interval is set)
    cron.schedule(`*/${intervalMinutes} * * * *`, async () => {
      log("Scheduler triggered - Starting new workflow cycle...");
      await runWorkflow();
    });

    log("=".repeat(50));
    log("AGENT IS NOW RUNNING AUTONOMOUSLY");
    log(`Schedule: Every ${intervalMinutes} minutes`);
    log(`Wallet: ${process.env.SOLANA_PUBLIC_KEY}`);
    log(`Explorer: https://explorer.oobeprotocol.ai`);
    log("Press CTRL+C to stop");
    log("=".repeat(50));

  } catch (error) {
    log(`Agent startup failed: ${error.message}`, "ERROR");
    log("Please check your .env configuration and try again", "ERROR");
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  log("Agent shutting down gracefully...");
  log("All scheduled tasks stopped");
  process.exit(0);
});

process.on("SIGTERM", () => {
  log("Agent received termination signal");
  log("Shutting down gracefully...");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  log(`Uncaught exception: ${error.message}`, "ERROR");
  log("Agent will continue running...", "WARN");
});

process.on("unhandledRejection", (reason) => {
  log(`Unhandled rejection: ${reason}`, "ERROR");
  log("Agent will continue running...", "WARN");
});

// Start the agent
start();
