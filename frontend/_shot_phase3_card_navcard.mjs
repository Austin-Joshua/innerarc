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

async function blurActive(page) {
  await page.evaluate(() => {
    document.activeElement?.blur?.();
  });
}

async function resolveHoverTarget(page, findFn) {
  const handle = await page.evaluateHandle((findSource) => {
    const find = new Function(`return (${findSource})`)();
    const start = find();
    if (!start) return null;
    let cur = start;
    while (cur) {
      const cls = cur.className;
      const group =
        typeof cls === "string"
          ? cls.includes("group")
          : String(cls).includes("group");
      if (group || cur.getAttribute?.("role") === "button") return cur;
      cur = cur.parentElement;
    }
    return start;
  }, findFn.toString());
  const el = handle.asElement();
  if (!el) throw new Error("Hover target not found");
  return el;
}

async function hoverElement(page, el) {
  await el.evaluate((node) =>
    node.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  await new Promise((r) => setTimeout(r, 200));
  const box = await el.boundingBox();
  if (!box) throw new Error("No bounding box for hover target");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await new Promise((r) => setTimeout(r, 500));
}

async function captureRegion(page, el, file, pad = 20) {
  const box = await el.boundingBox();
  if (!box) throw new Error("No bounding box for capture");
  await page.screenshot({
    path: file,
    clip: {
      x: Math.max(0, Math.floor(box.x - pad)),
      y: Math.max(0, Math.floor(box.y - pad)),
      width: Math.ceil(box.width + pad * 2),
      height: Math.ceil(box.height + pad * 2),
    },
  });
  const stat = fs.statSync(file);
  console.log(`saved ${file} (${stat.size} bytes)`);
}

const SHOTS = [
  {
    id: "navcard-hover",
    path: "/home",
    wait: /profile & settings/i,
    pad: 16,
    find: () => {
      const title = Array.from(document.querySelectorAll("*")).find(
        (el) => el.textContent?.trim() === "Profile & settings",
      );
      if (!title) return null;
      let cur = title;
      while (cur) {
        if (cur.getAttribute?.("role") === "button") return cur;
        cur = cur.parentElement;
      }
      return title;
    },
  },
  {
    id: "card-hover",
    path: "/workouts",
    wait: /recommended for you/i,
    pad: 12,
    find: () => {
      const candidates = Array.from(document.querySelectorAll("*")).filter(
        (el) =>
          el.textContent?.trim().startsWith("Full-body strength") &&
          el.textContent?.includes("home gym") &&
          el.getBoundingClientRect().width > 100 &&
          el.getBoundingClientRect().width < 450,
      );
      return candidates.sort(
        (a, b) =>
          a.getBoundingClientRect().height - b.getBoundingClientRect().height,
      )[0];
    },
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
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

    for (const theme of ["light", "dark"]) {
      for (const shot of SHOTS) {
        const url = `http://127.0.0.1:${PORT}${shot.path}`;
        await page.goto(url, { waitUntil: "networkidle2", timeout: 120000 });
        await setTheme(page, theme);
        await page.reload({ waitUntil: "networkidle2", timeout: 120000 });
        await page.waitForFunction(
          (pattern) => new RegExp(pattern, "i").test(document.body.innerText),
          { timeout: 60000 },
          shot.wait.source,
        );

        await blurActive(page);
        const target = await resolveHoverTarget(page, shot.find);
        await hoverElement(page, target);
        const file = path.join(
          OUT_DIR,
          `module-17-phase3-${shot.id}-${theme}.png`,
        );
        await captureRegion(page, target, file, shot.pad);
        saved.push(file);
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
