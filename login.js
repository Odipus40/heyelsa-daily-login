const puppeteer = require("puppeteer"); 
const fs = require("fs");
const axios = require("axios");
require("colors");
const { displayHeader, delay } = require("./helpers"); // Import fungsi dari helpers.js

const HEYELSA_URL = "https://app.heyelsa.ai/login";
const pointsUrl = "https://app.heyelsa.ai/api/points"; // API total poin
const DEFAULT_SLEEP_TIME = 24 * 60 * 60 * 1000; // 24 jam
const RANDOM_EXTRA_DELAY = () => Math.floor(Math.random() * (10 - 5 + 1) + 5) * 60 * 1000; // 5-10 menit delay acak

function getCurrentTimestamp() {
  const now = new Date();
  return now.toISOString().replace("T", " ").split(".")[0]; // Format YYYY-MM-DD HH:MM:SS
}

function loadData(file) {
  try {
    const datas = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
    return datas;
  } catch (error) {
    console.log(`⚠️ [${getCurrentTimestamp()}] Cannot find file ${file}`);
    return [];
  }
}

async function getTotalPoints(evm_address, cookie) {
  console.log(`💰 [${getCurrentTimestamp()}] Points your address: ${evm_address}...`);

  try {
    const response = await axios.post(pointsUrl, 
      { evm_address }, // Payload dengan evm_address
      {
        headers: {
          'Cookie': cookie,
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      }
    );

    if (response.status === 200) {
      const totalPoints = response.data.points; // FIX: Mengambil dari 'points' bukan 'total_points'
      console.log(`🎯 [${getCurrentTimestamp()}] Current Total Points: ${totalPoints}`);
    } else {
      console.error(`⚠️ [${getCurrentTimestamp()}] Gagal mengambil total poin, status: ${response.status}`);
    }
  } catch (error) {
    console.error(`❌ [${getCurrentTimestamp()}] Terjadi kesalahan saat mengambil total poin:`, error.response?.data || error.message);
  }
}

async function runAccount(cookie, evm_address) {
  try {
    console.log(`⏳ [${getCurrentTimestamp()}] Starting login...`);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.setCookie({
      name: "session-token",
      value: cookie,
      domain: "app.heyelsa.ai",
      path: "/",
      secure: true,
      httpOnly: true,
    });

    await page.goto(HEYELSA_URL, { waitUntil: "networkidle2", timeout: 60000 });

    console.log(`✅ [${getCurrentTimestamp()}] Login Successfully...`);

    await getTotalPoints(evm_address, cookie);

    await browser.close();
  } catch (error) {
    console.error(`❌ [${getCurrentTimestamp()}] Error:`, error);
  }
}

(async () => {
  displayHeader();
  console.log(`🚀 [${getCurrentTimestamp()}] Starting bot heyelsa...`);
  const data = loadData("cookies.txt");
  const addresses = loadData("data.txt");

  while (true) {
    try {
      console.log(`🔄 [${getCurrentTimestamp()}] Prepare login...`);
      for (let i = 0; i < data.length; i++) {
        const cookie = data[i];
        const evm_address = addresses[i] || "";
        await runAccount(cookie, evm_address);
      }
    } catch (error) {
      console.error(`❌ [${getCurrentTimestamp()}] There is an error:`, error);
    }

    const extraDelay = RANDOM_EXTRA_DELAY();
    console.log(`🛌 [${getCurrentTimestamp()}] Sleep for 24 hours + delay ${extraDelay / 60000} menit...`);
    await delay(DEFAULT_SLEEP_TIME + extraDelay);
  }
})();
