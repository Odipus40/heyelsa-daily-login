const axios = require("axios");
const ethers = require("ethers");
const dotenv = require("dotenv");

dotenv.config();

const API_LOGIN = "https://app.heyelsa.ai/login";

const PRIVATE_KEYS = process.env.PRIVATE_KEYS ? process.env.PRIVATE_KEYS.split(",") : [];
if (PRIVATE_KEYS.length === 0) {
  console.error("❌ No private keys found in .env file! Please add PRIVATE_KEYS.");
  process.exit(1);
}

const CHECKIN_INTERVAL_SUCCESS = 8 * 60 * 60 * 1000;
const CHECKIN_INTERVAL_FAIL = 8 * 60 * 60 * 1000;

async function login(walletAddress) {
  try {
    console.log(`🔍 Logging in for wallet: ${walletAddress}`);
    const response = await axios.post(
      API_LOGIN,
      { wallet_address: walletAddress },
      {
        headers: {
          'Content-Type': 'text/x-component',
          'Cookie': process.env.COOKIE || ''
        }
      }
    );
    const success = response.data?.success || false;
    console.log(success ? `✅ [${walletAddress}] Login successful.` : `❌ [${walletAddress}] Login failed.`);
    return success;
  } catch (error) {
    console.error(`❌ [${walletAddress}] Failed to login:`, error.response?.data || error.message);
    return false;
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
          const walletSuccess = await login(wallet.address);
          if (!walletSuccess) success = false;
        } catch (error) {
          console.error(`❌ Error processing wallet ${privateKey}:`, error.message);
          success = false;
        }
      }

      const delay = success ? CHECKIN_INTERVAL_SUCCESS : CHECKIN_INTERVAL_FAIL;
      console.log(`🕖 Waiting ${delay / (60 * 60 * 1000)} hours before the next login attempt...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  } catch (error) {
    console.error("🚨 Critical error in main process:", error);
  }
}

main().catch(console.error);
