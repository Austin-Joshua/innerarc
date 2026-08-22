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
  { id: "library", path: "/workouts", wait: /recommended for you/i },
  {
    id: "detail",
    path: "/workout/preview-workout-1",
    wait: /full-body strength|goblet squat/i,
  },
  {
    id: "program",
    path: "/program/preview-program-1",
    wait: /4-week strength base|schedule/i,
  },
  {
    id: "session",
    path: "/session/preview-workout-1",
    wait: /goblet squat|complete set/i,
  },
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
          await page.reload({ waitUntil: "networkidle2" });
          await page.waitForFunction(
            (pattern) =>
              new RegExp(pattern, "i").test(document.body?.innerText ?? ""),
            { timeout: 60000 },
            screen.wait.source,
          );
          await new Promise((r) => setTimeout(r, 800));

          const file = path.join(
            OUT_DIR,
            `module-17-phase2-batch-c-${screen.id}-${viewport.name}-${theme}.png`,
          );
          await capture(page, file);
          saved.push(file);
        }
      }
    }

    console.log(`\n--- ${saved.length} files written ---`);
    for (const file of saved) {
      console.log(file);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
