/**
 * Module 7 device verification — runs when EXPO_PUBLIC_M7_VERIFY=1.
 * Seeds Health Connect (emulator has no watch), Sync Now twice, logs markers for logcat.
 */
import { api, setToken } from "./api";
import { healthConnect } from "./healthConnect";
import { storeToken } from "./storage";

const stamp = Date.now();

function log(msg: string) {
  // Prefer console so Metro + logcat ReactNativeJS both see it
  console.log(`M7_VERIFY ${msg}`);
}

export async function runModule7Verify(): Promise<void> {
  log("START");
  try {
    const email = `m7verify_${stamp}@example.com`;
    const password = "password123";
    let token: string;
    try {
      token = (await api.register(email, password)).access_token;
    } catch {
      token = (await api.login(email, password)).access_token;
    }
    setToken(token);
    await storeToken(token);
    log(`AUTH ok email=${email}`);

    const ok = await healthConnect.initialize();
    const status = await healthConnect.getSdkStatus();
    log(`HC initialize=${ok} sdkStatus=${status}`);
    if (!ok) {
      log("FAIL health_connect_unavailable");
      return;
    }

    const granted = await healthConnect.requestPermissions(true);
    log(`permissions_granted=${granted}`);
    if (!granted) {
      log("FAIL permissions_denied");
      return;
    }

    await healthConnect.seedVerificationData();
    log("SEED written into Health Connect");

    const readings1 = await healthConnect.readRecent();
    log(`READ1 count=${readings1.length} ${JSON.stringify(readings1)}`);
    if (readings1.length === 0) {
      log("FAIL no_readings_after_seed");
      return;
    }

    const sync1 = await api.wearableSync(readings1);
    log(`SYNC1 inserted=${sync1.inserted} updated=${sync1.updated} total=${sync1.total}`);

    const sync2 = await api.wearableSync(readings1);
    log(`SYNC2 inserted=${sync2.inserted} updated=${sync2.updated} total=${sync2.total}`);

    if (sync2.inserted !== 0) {
      log("FAIL dedupe_expected_zero_inserts_on_second_sync");
      return;
    }

    const recent = await api.wearableRecent();
    const sources = recent.readings.map((r) => r.source);
    const types = recent.readings.map((r) => r.metric_type);
    log(`RECENT types=${types.join(",")} sources=${sources.join(",")}`);
    if (!sources.every((s) => s === "health_connect")) {
      log("FAIL bad_source");
      return;
    }

    log("OK");
  } catch (err) {
    log(`FAIL ${err instanceof Error ? err.message : String(err)}`);
  }
}
