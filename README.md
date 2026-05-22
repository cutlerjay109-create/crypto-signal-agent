# CryptoSignalAgent 🤖

> Autonomous crypto BUY/SELL/HOLD signal agent built for the OOBE Protocol x Ace Data Cloud Bounty

---

## What It Does

CryptoSignalAgent is a fully autonomous on-chain agent registered on Synapse Agent Protocol (SAP) mainnet that:

- Discovers tools via Synapse Agent Protocol (SAP)
- Calls Synapse Sentinel every cycle
- Fetches real crypto news via Ace Data Cloud Google SERP API
- Analyzes market sentiment via Ace Data Cloud Gemini 2.5 Flash
- Generates BUY/SELL/HOLD signals via Ace Data Cloud GPT-4o-mini
- Verifies signals mathematically with TP/SL calculations
- Settles payments via x402 USDC on Solana using Synapse RPC
- Runs every 6 hours without any human intervention

---

## Bounty Categories

This project submits for **both categories**:

### Category 1 — General Payment Volume on SAP (On-chain Escrow)
### Category 2 — Ace Data Cloud Usage (x402 Facilitator)

> If eligible for both, we claim the higher-ranked reward as per the rules.

---

## Agent Details

| Field | Value |
|---|---|
| Agent Name | CryptoSignalAgent |
| Wallet | HXyv3RHndummXVjMcXTRaQo1L1sQtxutQtbgfnVC2Hxg |
| AgentPDA | 5y8Dz8cAFo1PbR51QyqA7qZpFJcAi95oVnsykeCaQP8W |
| AgentStats | 8od1hYRT8FK4YBEe2UYZnNp2vz25YSiutC8vfjekNxd |
| StakePDA | DQZxj56X43dkr7U1nvkcBQZ3e5VAdbhgdBdi1YhmwXv5 |
| Stake | 0.1 SOL ✅ Active |
| Network | Solana Mainnet |
| Schedule | Every 6 hours |
| SAP Explorer | https://explorer.oobeprotocol.ai/agents/HXyv3RHndummXVjMcXTRaQo1L1sQtxutQtbgfnVC2Hxg |

---

## Autonomous Workflow

```
TRIGGER (Every 6 hours — fully automated)
         ↓
Step 1: Tool Discovery via SAP network
         ↓
Step 2: Synapse Sentinel called (every cycle)
         ↓
Step 3: Google SERP API → Fetch crypto news for BTC/ETH/SOL
         x402 USDC payment via Synapse RPC → 0.000952 USDC
         ↓
Step 4: CoinGecko → Live prices BTC/ETH/SOL (free)
         ↓
Step 5: Gemini 2.5 Flash → Sentiment analysis of news
         x402 USDC payment via Synapse RPC → 0.095215 USDC
         ↓
Step 6: GPT-4o-mini → Generate BUY/SELL/HOLD signal for BTC
         x402 USDC payment via Synapse RPC → 0.095215 USDC
         ↓
Step 7: GPT-4o-mini → Generate BUY/SELL/HOLD signal for ETH
         x402 USDC payment via Synapse RPC → 0.095215 USDC
         ↓
Step 8: GPT-4o-mini → Generate BUY/SELL/HOLD signal for SOL
         x402 USDC payment via Synapse RPC → 0.095215 USDC
         ↓
Step 9: Mathematical verification of TP/SL levels
         ↓
Step 10: Signal report saved with timestamp
         ↓
REPEAT — No human input required at any step
```

---

## Ace Data Cloud Services Used (3 Distinct)

| # | Service | Purpose | x402 Cost Per Call |
|---|---|---|---|
| 1 | Google SERP API | Fetch latest crypto news headlines for BTC/ETH/SOL | 0.000952 USDC |
| 2 | Gemini 2.5 Flash | Sentiment analysis — bullish/bearish/neutral with confidence score | 0.095215 USDC |
| 3 | GPT-4o-mini | Generate trading signal with direction, confidence, entry, TP, SL | 0.095215 USDC |

Total x402 USDC cost per cycle: **~0.382 USDC**

---

## Sample Signal Output

```
🟢 BUY SIGNAL — BTC/USDT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Entry Price:    $77,402
Take Profit 1:  $80,046.30 (+3.42%)
Take Profit 2:  $82,690.60 (+6.83%)
Stop Loss:      $75,031.76 (-3.06%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Confidence:     70%
Timeframe:      short term
24h Change:     +1.42%
Risk/Reward:    1.12
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reason:
Bullish trend score and positive 24h change
indicate strong upward momentum in BTC price.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Powered by Ace Data Cloud AI


🟡 HOLD SIGNAL — ETH/USDT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Entry Price:    $2,132.31
Take Profit 1:  $2,185.10 (+2.48%)
Take Profit 2:  $2,237.89 (+4.95%)
Stop Loss:      $2,079.52 (-2.48%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Confidence:     70%
Timeframe:      short term
Risk/Reward:    1.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


🔴 SELL SIGNAL — SOL/USDT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Entry Price:    $84.59
Take Profit 1:  $81.21 (-4.00%)
Take Profit 2:  $77.82 (-8.00%)
Stop Loss:      $87.97 (+4.00%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Confidence:     65%
Timeframe:      short term
Risk/Reward:    1.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Powered by Ace Data Cloud AI
```

---

## Bounty Requirements — Category 1 (General Payment Volume)

| Requirement | Status | Notes |
|---|---|---|
| Registered on SAP mainnet | ✅ | TX confirmed on Solana |
| Complete automated workflow | ✅ | Runs every 6 hours |
| Use escrow for payments via Synapse RPC | ⚠️ | Blocked by SDK bug (see below) |
| At least one AI capability | ✅ | Gemini + GPT-4o-mini |
| Use Synapse Sentinel at least once | ✅ | Called every cycle |

### Why Escrow Did Not Work — SDK v0.17.0 Bug

During development we discovered that `createEscrowV2` in SDK v0.17.0 has an IDL mismatch with the deployed SAP program on Solana mainnet.

**Error received every time:**
```
AnchorError: InvalidProgramId on system_program
Error Code: 3008
Left:  agentStats PDA (should be in position 3)
Right: 11111111111111111111111111111111 (system program)
```

**What this means:**
The SDK IDL tells our code to pass `agentStats` at account position 3. But the deployed program on-chain validates that position as `systemProgram`. These two are incompatible and no amount of code changes on our side can fix this mismatch — it requires an SDK update or program redeployment by OOBE Protocol.

We reported this bug to @OOBEonSol with full logs and are awaiting a fix.

---

## Bounty Requirements — Category 2 (Ace Data Cloud x402)

| Requirement | Status | Notes |
|---|---|---|
| Registered on SAP mainnet | ✅ | TX confirmed on Solana |
| Complete automated workflow | ✅ | Runs every 6 hours |
| Ace Data Cloud account created | ✅ | All 3 API keys configured |
| x402 with AceDataCloud facilitator | ✅ | Real USDC payments on-chain |
| Synapse RPC used in execution | ✅ | All x402 payments sent via Synapse RPC |
| 3+ distinct Ace Data Cloud services | ✅ | SERP + Gemini + GPT-4o-mini |
| Autonomous — no manual steps | ✅ | Fully automated |

---

## On-Chain Verification

### Agent Accounts (all owned by SAP Program SAPpUhsWLJG1FfkGRcXagEDMrMsWGjbky7AyhGpFETZ)

| Account | Address | Link |
|---|---|---|
| Wallet | HXyv3RHndummXVjMcXTRaQo1L1sQtxutQtbgfnVC2Hxg | https://explorer.solana.com/address/HXyv3RHndummXVjMcXTRaQo1L1sQtxutQtbgfnVC2Hxg |
| AgentPDA | 5y8Dz8cAFo1PbR51QyqA7qZpFJcAi95oVnsykeCaQP8W | https://explorer.solana.com/address/5y8Dz8cAFo1PbR51QyqA7qZpFJcAi95oVnsykeCaQP8W |
| AgentStats | 8od1hYRT8FK4YBEe2UYZnNp2vz25YSiutC8vfjekNxd | https://explorer.solana.com/address/8od1hYRT8FK4YBEe2UYZnNp2vz25YSiutC8vfjekNxd |
| StakePDA | DQZxj56X43dkr7U1nvkcBQZ3e5VAdbhgdBdi1YhmwXv5 | https://explorer.solana.com/address/DQZxj56X43dkr7U1nvkcBQZ3e5VAdbhgdBdi1YhmwXv5 |

### All Transactions

| Transaction | Description | Link |
|---|---|---|
| Registration | Agent registered on SAP mainnet | https://explorer.solana.com/tx/4FbmtFgLLfhf22A5bHDa4N9eEo8Xh9ByUCyT6zUjLajQB97g27VG9khLdc9qsU8q7nHJPMwDvZDhjcK4ykjgsCUV |
| Stake | 0.1 SOL staked to SAP program | https://explorer.solana.com/tx/4utySHp8z3DoNLQbyyPwqek4TRrcbzHFeRFJWSAH5sKRy67x4tnU7LZEL93HgfAEjbUoTCe69g1TdqyGG4BKcpni |
| x402 SERP | Google SERP API paid 0.000952 USDC via Synapse RPC | https://explorer.solana.com/tx/5DXNX2eJnmEMnady6wTKKXZAu5W5dYDg46a57xkmyV8NsCCFzvKUCHS7z2FrBbJe2asmGBV3EJ7BaCmY8cxfsdKK |
| x402 Gemini | Gemini 2.5 Flash paid 0.095215 USDC via Synapse RPC | https://explorer.solana.com/tx/XbqomXqC3GYdY997XUbjcN2RmUABGpFtrxQxMjdbfjFKGLHi7PorzqnwJR5j36aLofYrpYELWjs5DTxauBcqFGz |
| x402 GPT BTC | GPT-4o-mini BTC signal paid 0.095215 USDC via Synapse RPC | https://explorer.solana.com/tx/2c5SP27pZV75owd793B9B2VArrU3ABaZStx9yMEcKMYARMYY6atajpNbbvn3eim6soL9bFQ5gnW6FXZy6f5PHese |
| x402 GPT ETH | GPT-4o-mini ETH signal paid 0.095215 USDC via Synapse RPC | https://explorer.solana.com/tx/3Ep5jFpsoaqneFHnrc7x19Sf5p6thA9arSrpbStBpQ7b6UGz5rektrcz1eFjJgk6w6iwfWhE1x4JCMUJEzMxq6cz |
| x402 GPT SOL | GPT-4o-mini SOL signal paid 0.095215 USDC via Synapse RPC | https://explorer.solana.com/tx/3nz1xDprPJ5RZ11cCD9Q8nMmHNAh4TTEALtMsPfWNVJeir8vj21FVpsogevoqkHMYhd7ZjStg1PoVRLTp7VrpLiq |

---

## Tech Stack

| Component | Technology |
|---|---|
| Agent Registration | SAP SDK v0.17.0 |
| Tool Discovery | Synapse Agent Protocol |
| Sentinel | Synapse Sentinel |
| RPC Execution | Synapse RPC (OOBE Protocol) — used for all on-chain execution |
| News Fetching | Ace Data Cloud Google SERP API |
| Sentiment Analysis | Ace Data Cloud Gemini 2.5 Flash |
| Signal Generation | Ace Data Cloud GPT-4o-mini |
| x402 Payments | @acedatacloud/x402-client Solana USDC |
| Price Data | CoinGecko API |
| Blockchain | Solana Mainnet |
| Language | Node.js |

---

## Project Structure

```
crypto-signal-agent/
├── src/
│   ├── agent/
│   │   ├── register.js          # SAP mainnet registration
│   │   ├── discovery.js         # Tool discovery via SAP
│   │   ├── workflow.js          # Credit-based workflow
│   │   ├── workflow_x402.mjs    # x402 USDC workflow (main)
│   │   └── sentinel.js          # Synapse Sentinel integration
│   ├── payments/
│   │   ├── escrow.js            # SAP escrow (blocked by SDK bug)
│   │   └── x402_usdc.mjs        # Real x402 USDC payments via Synapse RPC
│   ├── acedata/
│   │   ├── scraper.js           # Google SERP news fetching
│   │   ├── analyzer.js          # Gemini sentiment (credit mode)
│   │   ├── analyzer_x402.mjs    # Gemini sentiment (x402 mode)
│   │   ├── signalAI.js          # GPT-4o-mini signals (credit mode)
│   │   └── signalAI_x402.mjs    # GPT-4o-mini signals (x402 mode)
│   ├── signals/
│   │   ├── generator.js         # Mathematical TP/SL verification
│   │   └── formatter.js         # Signal report formatting
│   ├── index.js                 # Credit mode entry point
│   └── index_x402.mjs           # x402 USDC mode entry point
├── config/
│   ├── sap.config.js            # SAP configuration
│   └── acedata.config.js        # Ace Data Cloud configuration
└── README.md
```

---

## Installation

```bash
git clone https://github.com/cutlerjay109-create/crypto-signal-agent
cd crypto-signal-agent
npm install
```

## Environment Variables

Create a `.env` file:

```bash
SOLANA_PRIVATE_KEY=your_solana_private_key
SOLANA_PUBLIC_KEY=your_solana_public_key
SYNAPSE_RPC_URL=your_synapse_rpc_url
SYNAPSE_API_KEY=your_synapse_api_key
ACEDATA_API_KEY=your_acedata_api_key
ACEDATA_SERP_KEY=your_serp_api_key
ACEDATA_GEMINI_KEY=your_gemini_api_key
SCHEDULE_INTERVAL=360
X402_TEST_MODE=false
```

## Running The Agent

```bash
# Live x402 USDC mode (production — pays real USDC via Synapse RPC)
npm run start:live

# Credit mode (testing — uses API credits)
npm start
```

---

## Known Issues Reported To OOBE Protocol

### 1. SAP Escrow SDK Bug (createEscrowV2)

**Affects:** Category 1 escrow settlements

**Error:**
```
AnchorError: InvalidProgramId on system_program
Left:  agentStats PDA
Right: 11111111111111111111111111111111
```

**Cause:** SDK v0.17.0 IDL does not match the deployed SAP program on-chain. The SDK passes `agentStats` at account position 3 but the deployed program expects `systemProgram` there. This affects `createEscrowV2`, `updateAgent`, and `closeAgent`.

**Status:** Reported to @OOBEonSol. Awaiting SDK fix.

### 2. Explorer Not Showing Registration

**Affects:** Visual display on Synapse Explorer

**Issue:** The Synapse Explorer shows "Wallet not registered" despite all agent accounts existing on-chain and being owned by the SAP program.

**On-chain proof:**
- AgentPDA exists: ✅ owned by SAPpUhsWLJG1FfkGRcXagEDMrMsWGjbky7AyhGpFETZ
- AgentStats exists: ✅ owned by SAPpUhsWLJG1FfkGRcXagEDMrMsWGjbky7AyhGpFETZ
- StakePDA exists: ✅ owned by SAPpUhsWLJG1FfkGRcXagEDMrMsWGjbky7AyhGpFETZ

**Status:** Reported to @OOBEonSol. Explorer indexing issue.

---

## License

MIT
