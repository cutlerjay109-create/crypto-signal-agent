import { config } from 'dotenv';
config();
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { log } = require('./utils/logger.js');
const { registerAgent } = require('./agent/register.js');
import { runX402Workflow } from './agent/workflow_x402.mjs';

const SCHEDULE_MINUTES = parseInt(process.env.SCHEDULE_INTERVAL) || 360;
const SCHEDULE_MS = SCHEDULE_MINUTES * 60 * 1000;

async function main() {
  log('='.repeat(50));
  log('  CRYPTO SIGNAL AGENT x402 STARTING UP');
  log('='.repeat(50));
  log('Mode: ' + (process.env.X402_TEST_MODE === 'true' ? 'TEST (credits)' : 'LIVE (USDC x402)'));
  log('Schedule: Every ' + SCHEDULE_MINUTES + ' minutes');
  log('Wallet: ' + process.env.SOLANA_PUBLIC_KEY);

  // Register agent
  try {
    log('Registering agent on SAP mainnet...');
    const reg = await registerAgent();
    log('Agent: ' + (reg.alreadyExists ? 'Already registered' : 'Newly registered') + ' ✅');
  } catch(err) {
    log('Registration skipped: ' + err.message, 'WARN');
  }

  // Run first cycle immediately
  log('Running first cycle immediately...');
  await runX402Workflow();

  // Schedule subsequent cycles
  log('Starting scheduler - every ' + SCHEDULE_MINUTES + ' minutes...');
  setInterval(async () => {
    await runX402Workflow();
  }, SCHEDULE_MS);

  log('='.repeat(50));
  log('AGENT IS NOW RUNNING AUTONOMOUSLY');
  log('Mode: ' + (process.env.X402_TEST_MODE === 'true' ? 'TEST MODE' : 'LIVE x402 MODE'));
  log('Schedule: Every ' + SCHEDULE_MINUTES + ' minutes');
  log('Explorer: https://explorer.oobeprotocol.ai/agents/' + process.env.SOLANA_PUBLIC_KEY);
  log('Press CTRL+C to stop');
  log('='.repeat(50));
}

main().catch(err => {
  log('Fatal error: ' + err.message, 'ERROR');
  process.exit(1);
});
