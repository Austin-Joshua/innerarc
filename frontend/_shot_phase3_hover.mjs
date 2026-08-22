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
  return file;
}

/** Desktop hover + focus-visible evidence for Phase 3. */
const SHOTS = [
  {
    id: "navcard-hover",
    width: 1280,
    height: 800,
    path: "/home",
    wait: /profile & settings/i,
    hoverXPath:
      "//*[contains(normalize-space(.), 'Profile & settings') and contains(normalize-space(.), 'Edit your goals')]/ancestor::*[@role='button'][1]",
  },
  {
    id: "sidebar-hover",
    width: 1280,
    height: 800,
    path: "/home",
    wait: /log meal|workouts/i,
    hoverSidebarCoach: true,
  },
  {
    id: "card-hover",
    width: 1280,
    height: 800,
    path: "/workouts",
    wait: /recommended for you/i,
    hoverLibraryCard: "Full-body strength",
  },
  {
    id: "button-hover",
    width: 1280,
    height: 800,
    path: "/workout/preview-workout-1",
    wait: /start session/i,
    hover: "text=Start session",
  },
  {
    id: "tab-hover",
    width: 390,
    height: 844,
    path: "/home",
    wait: /log meal|workouts/i,
    hoverXPath: "//*[normalize-space(text())='Workouts']",
  },
  {
    id: "button-focus",
    width: 1280,
    height: 800,
    path: "/workout/preview-workout-1",
    wait: /start session/i,
    focusButtonLabel: "Start session",
  },
];

async function main() {
  const browser = await puppeteer.launch({
    executablePath: findBrowser(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const saved = [];

  try {
    const page = await browser.newPage();

    for (const theme of ["light", "dark"]) {
      for (const shot of SHOTS) {
        await page.setViewport({
          width: shot.width,
          height: shot.height,
          deviceScaleFactor: 1,
        });

        const url = `http://127.0.0.1:${PORT}${shot.path}`;
        await page.goto(url, { waitUntil: "networkidle2", timeout: 120000 });
        await setTheme(page, theme);
        await page.reload({ waitUntil: "networkidle2", timeout: 120000 });
        await page.waitForFunction(
          (pattern) => new RegExp(pattern, "i").test(document.body.innerText),
          { timeout: 60000 },
          shot.wait.source,
        );

        if (shot.hover) {
          const target = await page.waitForSelector(shot.hover, {
            timeout: 15000,
          });
          await target.hover();
          await new Promise((r) => setTimeout(r, 200));
        }

        if (shot.hoverSidebarCoach) {
          const handle = await page.evaluateHandle(() => {
            const nodes = Array.from(document.querySelectorAll("*")).filter(
              (el) =>
                el.textContent?.trim() === "Coach" &&
                el.getBoundingClientRect().left < 280,
            );
            return nodes[0] ?? null;
          });
          const target = handle.asElement();
          if (!target) throw new Error("Sidebar Coach item not found");
          await target.hover();
          await new Promise((r) => setTimeout(r, 200));
        }

        if (shot.hoverLibraryCard) {
          const handle = await page.evaluateHandle((label) => {
            const hit = Array.from(document.querySelectorAll("*")).find((el) =>
              el.textContent?.includes(label),
            );
            if (!hit) return null;
            let cur = hit;
            while (cur) {
              if (cur.getAttribute?.("role") === "button") return cur;
              cur = cur.parentElement;
            }
            return hit;
          }, shot.hoverLibraryCard);
          const target = handle.asElement();
          if (!target) throw new Error(`Library card not found: ${shot.hoverLibraryCard}`);
          await target.hover();
          await new Promise((r) => setTimeout(r, 200));
        }

        if (shot.hoverXPath) {
          await page.waitForFunction(
            (xpath) =>
              document.evaluate(
                xpath,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null,
              ).singleNodeValue,
            { timeout: 15000 },
            shot.hoverXPath,
          );
          const handle = await page.evaluateHandle((xpath) => {
            const nodes = [];
            const snapshot = document.evaluate(
              xpath,
              document,
              null,
              XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
              null,
            );
            for (let i = 0; i < snapshot.snapshotLength; i += 1) {
              nodes.push(snapshot.snapshotItem(i));
            }
            return nodes[nodes.length - 1];
          }, shot.hoverXPath);
          const target = handle.asElement();
          if (!target) throw new Error(`No node for ${shot.hoverXPath}`);
          await target.hover();
          await new Promise((r) => setTimeout(r, 200));
        }

        if (shot.focusButtonLabel) {
          await page.evaluate((label) => {
            const buttons = Array.from(
              document.querySelectorAll('[role="button"]'),
            );
            const match = buttons.find((el) =>
              el.textContent?.trim().includes(label),
            );
            if (!match) throw new Error(`Button not found: ${label}`);
            match.focus();
          }, shot.focusButtonLabel);
          await new Promise((r) => setTimeout(r, 200));
        }

        const file = path.join(
          OUT_DIR,
          `module-17-phase3-${shot.id}-${theme}.png`,
        );
        saved.push(await capture(page, file));
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
