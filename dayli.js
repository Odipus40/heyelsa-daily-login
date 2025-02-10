const axios = require("axios");
const ethers = require("ethers");
const { displayHeader } = require('./helpers');
const dotenv = require("dotenv");

dotenv.config();

const API_LOGIN = "https://www.alphabot.app/api/platformAirdrops/points";

const PRIVATE_KEYS = process.env.PRIVATE_KEYS ? process.env.PRIVATE_KEYS.split(",") : [];
if (PRIVATE_KEYS.length === 0) {
  console.error("❌ No private keys found in .env file! Please add PRIVATE_KEYS.");
  process.exit(1);
}

const CHECKIN_INTERVAL_SUCCESS = 8 * 60 * 60 * 1000;
const CHECKIN_INTERVAL_FAIL = 8 * 60 * 60 * 1000;

async function login(walletAddress) {
  try {
    console.log(`🔍 Checking points for wallet: ${walletAddress}`);
    const response = await axios.post(API_LOGIN, { wallet_address: walletAddress });
    const points = response.data?.points || 0;
    console.log(`🏆 [${walletAddress}] Current points: ${points}`);
  } catch (error) {
    console.error(`❌ [${walletAddress}] Failed to check points:`, error.response?.data || error.message);
  }
}

async function main() {
    try {
      while (true) {
        console.log("\n⏳ Starting Daily Login Process...");
        let success = true;
        for (const privateKey of PRIVATE_KEYS) {
          try {
            const wallet = new ethers.Wallet(privateKey);
            const walletSuccess = await checkIn(wallet.address);
            if (!walletSuccess) success = false;
          } catch (error) {
            console.error(`❌ Error processing wallet ${privateKey}:`, error.message);
            success = false;
          }
        }
  
        const delay = success ? CHECKIN_INTERVAL_SUCCESS : CHECKIN_INTERVAL_FAIL;
        console.log(`🕖 Waiting ${delay / (60 * 60 * 1000)} hours before the next check-in...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error("🚨 Critical error in main process:", error);
    }
  }
  
  main().catch(console.error);
