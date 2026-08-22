import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const PORT = Number(process.env.EXPO_PORT ?? 8090);
const BASE = `http://127.0.0.1:${PORT}/`;
const OUT_DIR = process.cwd();

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
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
  await page.reload({ waitUntil: "networkidle2" });
  await page.waitForFunction(
    (value) =>
      document.documentElement.classList.contains("dark") === (value === "dark"),
    { timeout: 15000 },
    theme,
  );
}

async function waitForShell(page) {
  await page.waitForFunction(
    () => /shell preview/i.test(document.body?.innerText ?? ""),
    { timeout: 60000 },
  );
  await new Promise((r) => setTimeout(r, 800));
}

async function openMobileDrawer(page) {
  const menu = await page.waitForSelector('[aria-label="Open menu"]', {
    timeout: 15000,
  });
  await menu.click();
  await page.waitForFunction(
    () => {
      const text = document.body?.innerText ?? "";
      return (
        text.includes("Sign out") &&
        text.includes("System") &&
        text.includes("Light") &&
        text.includes("Dark")
      );
    },
    { timeout: 15000 },
  );
  await new Promise((r) => setTimeout(r, 500));
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
        await page.goto(BASE, { waitUntil: "networkidle2", timeout: 120000 });
        await setTheme(page, theme);
        await waitForShell(page);

        const file = path.join(
          OUT_DIR,
          `module-17-phase1-shell-${viewport.name}-${theme}.png`,
        );
        await capture(page, file);
        saved.push(file);

        if (viewport.name === "mobile" && theme === "light") {
          await openMobileDrawer(page);
          const drawerFile = path.join(
            OUT_DIR,
            "module-17-phase1-shell-mobile-drawer-light.png",
          );
          await capture(page, drawerFile);
          saved.push(drawerFile);
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
