require("dotenv").config();
const axios = require("axios");
const acedataConfig = require("../../config/acedata.config");
const { log } = require("../utils/logger");

async function fetchCryptoNews() {
  try {
    log("Fetching crypto news via Search Engine API...");
    const results = {};
    const queries = [
      { query: "Bitcoin crypto news today", coin: "BTC" },
      { query: "Ethereum crypto news today", coin: "ETH" },
      { query: "Solana crypto news today", coin: "SOL" },
    ];

    for (const item of queries) {
      log(`Searching: ${item.query}`);
      try {
        const response = await axios.post(
          `${acedataConfig.baseUrl}/serp/google`,
          { query: item.query, number: 5 },
          {
            headers: {
              Authorization: `Bearer ${acedataConfig.serpKey}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          }
        );
        const headlines = [];
        const items = response.data.organic || response.data.results || [];
        for (const result of items.slice(0, 5)) {
          if (result.title) headlines.push(result.title);
        }
        results[item.coin] = headlines.length > 0 ? headlines : [`${item.coin} market active`];
        log(`Fetched ${headlines.length} headlines for ${item.coin}`);
      } catch (err) {
        log(`SERP error for ${item.coin}: ${err.message}`, "WARN");
        results[item.coin] = [`${item.coin} market active`];
      }
    }
    return results;
  } catch (error) {
    log(`Scraper failed: ${error.message}`, "ERROR");
    return {
      BTC: ["Bitcoin market active"],
      ETH: ["Ethereum market active"],
      SOL: ["Solana market active"],
    };
  }
}

async function fetchFromCoinGecko() {
  const response = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price",
    {
      params: {
        ids: "bitcoin,ethereum,solana",
        vs_currencies: "usd",
        include_24hr_change: true,
        include_24hr_vol: true,
      },
      timeout: 10000,
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0"
      }
    }
  );
  return {
    BTC: {
      price: response.data.bitcoin.usd,
      change24h: response.data.bitcoin.usd_24h_change,
      volume24h: response.data.bitcoin.usd_24h_vol,
    },
    ETH: {
      price: response.data.ethereum.usd,
      change24h: response.data.ethereum.usd_24h_change,
      volume24h: response.data.ethereum.usd_24h_vol,
    },
    SOL: {
      price: response.data.solana.usd,
      change24h: response.data.solana.usd_24h_change,
      volume24h: response.data.solana.usd_24h_vol,
    },
  };
}

async function fetchFromBinance() {
  log("Trying Binance API as backup...");
  const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
  const coins = ["BTC", "ETH", "SOL"];
  const prices = {};

  for (let i = 0; i < symbols.length; i++) {
    const response = await axios.get(
      `https://api.binance.com/api/v3/ticker/24hr`,
      {
        params: { symbol: symbols[i] },
        timeout: 10000,
      }
    );
    prices[coins[i]] = {
      price: parseFloat(response.data.lastPrice),
      change24h: parseFloat(response.data.priceChangePercent),
      volume24h: parseFloat(response.data.quoteVolume),
    };
  }
  return prices;
}

async function fetchCryptoPrices() {
  try {
    log("Fetching live crypto prices from CoinGecko...");
    const prices = await fetchFromCoinGecko();
    log(`Prices - BTC: $${prices.BTC.price} | ETH: $${prices.ETH.price} | SOL: $${prices.SOL.price}`);
    return prices;
  } catch (error) {
    log(`CoinGecko failed: ${error.message} - Trying Binance...`, "WARN");
    try {
      const prices = await fetchFromBinance();
      log(`Binance prices - BTC: $${prices.BTC.price} | ETH: $${prices.ETH.price} | SOL: $${prices.SOL.price}`);
      return prices;
    } catch (binanceError) {
      log(`Binance also failed: ${binanceError.message}`, "ERROR");
      throw new Error("All price sources failed");
    }
  }
}

module.exports = { fetchCryptoNews, fetchCryptoPrices };
