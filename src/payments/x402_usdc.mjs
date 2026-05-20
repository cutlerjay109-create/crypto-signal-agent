import { signSolanaPayment } from '@acedatacloud/x402-client/solana';
import { Keypair, Connection, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { log } = require('../utils/logger.js');

const PUBLIC_RPC = 'https://api.mainnet-beta.solana.com';
const TEST_MODE = process.env.X402_TEST_MODE === 'true';
let keypair = null;

function getKeypair() {
  if(keypair) return keypair;
  const privateKey = process.env.SOLANA_PRIVATE_KEY;
  keypair = privateKey.startsWith('[')
    ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(privateKey)))
    : Keypair.fromSecretKey(bs58.decode(privateKey));
  return keypair;
}

export async function makeX402Request(url, options = {}) {
  try {
    const kp = getKeypair();
    const connection = new Connection(PUBLIC_RPC, 'confirmed');

    // TEST MODE - use credits instead of USDC
    if(TEST_MODE) {
      log('TEST MODE: Using API credits instead of x402 USDC');
      const testRes = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + process.env.ACEDATA_API_KEY,
          ...options.headers,
        },
      });
      const testData = await testRes.json();
      return testData;
    }

    log(`Making x402 request to: ${url}`);

    // Step 1 - Initial request to get 402
    const initial = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.ACEDATA_API_KEY,
        ...options.headers,
      },
    });

    if(initial.status !== 402) {
      const data = await initial.json();
      log(`Direct response: ${initial.status}`);
      return data;
    }

    const paymentData = await initial.json();
    log('402 received - processing x402 Solana payment...');

    // Find Solana requirement
    const solanaReq = paymentData.accepts?.find(r => r.network === 'solana');
    if(!solanaReq) throw new Error('No Solana payment option available');

    log(`Payment required: ${(parseInt(solanaReq.maxAmountRequired) / 1_000_000).toFixed(6)} USDC`);

    // Create wallet with keypair directly
    const wallet = {
      publicKey: kp.publicKey,
      signTransaction: async (tx) => {
        if(tx instanceof VersionedTransaction) {
          tx.sign([kp]);
        } else {
          tx.partialSign(kp);
        }
        return tx;
      },
      signAndSendTransaction: async (tx) => {
        if(tx instanceof VersionedTransaction) {
          tx.sign([kp]);
        } else {
          tx.partialSign(kp);
        }
        const sig = await connection.sendRawTransaction(tx.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        });
        log(`USDC payment TX: ${sig}`);
        await connection.confirmTransaction(sig, 'confirmed');
        log(`x402 USDC payment confirmed on-chain ✅`);
        return { signature: sig };
      },
    };

    // Step 2 - Sign payment
    const paymentHeader = await signSolanaPayment(solanaReq, wallet);
    log('Payment header signed ✅');

    // Step 3 - Retry with payment
    const paid = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.ACEDATA_API_KEY,
        ...options.headers,
        'X-PAYMENT': paymentHeader,
      },
    });

    const receipt = paid.headers.get('x-payment-response');
    if(receipt) {
      log(`x402 confirmed ✅ Receipt: ${receipt.substring(0, 80)}`);
    }

    let result;
    try { result = await paid.json(); } catch(e) { result = {}; }
    log(`x402 request complete - status: ${paid.status}`);
    return result;

  } catch(error) {
    log(`x402 request failed: ${error.message}`, 'ERROR');
    throw error;
  }
}
