import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const PORT = Number(process.env.EXPO_PORT ?? 8081);
const OUT_DIR = process.cwd();

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

const SCREENS = [
  { id: "progress", path: "/progress", wait: /progress photo/i },
  { id: "compare", path: "/compare", wait: /compare|current ratios/i },
  { id: "coach", path: "/coach", wait: /coach|protein intake/i },
  { id: "connections", path: "/connections", wait: /connections|wearable sync/i },
];

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

function findBrowser() {
  for (const candidate of CHROME_PATHS) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error("No Chrome/Edge binary found. Set CHROME_PATH.");
}

async function setTheme(page, theme) {
  await page.evaluate((value) => {
    localStorage.setItem("innerarc.theme_preference", value);
  }, theme);
}

async function capture(page, file) {
  await page.screenshot({ path: file, fullPage: false });
  const stat = fs.statSync(file);
  console.log(`saved ${file} (${stat.size} bytes)`);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: findBrowser(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const saved = [];

  try {
    const page = await browser.newPage();

    for (const viewport of VIEWPORTS) {
      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
      });

      for (const theme of ["light", "dark"]) {
        for (const screen of SCREENS) {
          const url = `http://127.0.0.1:${PORT}${screen.path}`;
          await page.goto(url, { waitUntil: "networkidle2", timeout: 120000 });
          await setTheme(page, theme);
          await page.reload({ waitUntil: "networkidle2", timeout: 120000 });
          await page.waitForFunction(
            (pattern) => new RegExp(pattern, "i").test(document.body.innerText),
            { timeout: 60000 },
            screen.wait.source,
          );

          const file = path.join(
            OUT_DIR,
            `module-17-phase2-batch-d-${screen.id}-${viewport.name}-${theme}.png`,
          );
          saved.push(file);
          await capture(page, file);
        }
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`\n--- ${saved.length} files written ---`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
