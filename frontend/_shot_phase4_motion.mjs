import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const PORT = Number(process.env.EXPO_PORT ?? 8081);
const OUT_DIR = process.cwd();

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

async function openDrawer(page) {
  const toggle = await page.waitForSelector('[aria-label="Open menu"]', {
    timeout: 10000,
  });
  await toggle.click();
  await new Promise((r) => setTimeout(r, 400));
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
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });

    await page.goto(`http://127.0.0.1:${PORT}/home`, {
      waitUntil: "networkidle2",
      timeout: 120000,
    });
    await setTheme(page, "light");
    await page.reload({ waitUntil: "networkidle2" });
    await page.waitForFunction(
      () => /today/i.test(document.body.innerText),
      { timeout: 60000 },
    );

    const frames = [
      {
        id: "01-home-tab",
        action: async () => {},
      },
      {
        id: "02-drawer-open",
        action: () => openDrawer(page),
      },
      {
        id: "03-coach-tab",
        action: async () => {
          await page.goto(`http://127.0.0.1:${PORT}/coach`, {
            waitUntil: "networkidle2",
          });
          await page.waitForFunction(
            () => /coach/i.test(document.body.innerText),
            { timeout: 60000 },
          );
        },
      },
      {
        id: "04-stack-push",
        action: async () => {
          await page.goto(`http://127.0.0.1:${PORT}/workout/preview-workout-1`, {
            waitUntil: "networkidle2",
          });
          await page.waitForFunction(
            () => /start session/i.test(document.body.innerText),
            { timeout: 60000 },
          );
        },
      },
      {
        id: "05-leave-modal",
        action: async () => {
          await page.goto(
            `http://127.0.0.1:${PORT}/session/preview-workout-1`,
            { waitUntil: "networkidle2" },
          );
          await page.waitForFunction(
            () => /complete set|goblet squat/i.test(document.body.innerText),
            { timeout: 60000 },
          );
          const brand = await page.waitForSelector("text=Innerarc", {
            timeout: 10000,
          });
          await brand.click();
          await new Promise((r) => setTimeout(r, 300));
        },
      },
    ];

    for (const frame of frames) {
      await frame.action();
      const file = path.join(OUT_DIR, `module-17-phase4-motion-${frame.id}.png`);
      saved.push(file);
      await capture(page, file);
    }
  } finally {
    await browser.close();
  }

  console.log(`\n--- ${saved.length} motion frames written ---`);
  console.log(
    "Combine frames into a GIF/recording locally for Phase 4 review if needed.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
