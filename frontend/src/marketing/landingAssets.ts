/** Shared marketing palette — matches theme.ts / reportAssets hex values. */
export const BRAND = {
  primary: "#15803D",
  primaryBright: "#16A34A",
  primaryDark: "#166534",
  fluorescent: "#39FF14",
  heroLightStart: "#F0FDF4",
  heroLightMid: "#DCFCE7",
  heroLightEnd: "#FFFFFF",
  heroDarkStart: "#000000",
  heroDarkMid: "#0A1F0A",
  heroDarkEnd: "#052e16",
  olive: "#3F6212",
  glassLight: "rgba(255,255,255,0.72)",
  glassDark: "rgba(17,17,17,0.85)",
  glowLight: "rgba(21,128,61,0.25)",
  glowDark: "rgba(57,255,20,0.18)",
} as const;

function svg(uri: string) {
  return `data:image/svg+xml,${encodeURIComponent(uri)}`;
}

/** Innerarc home dashboard preview inside a phone frame. */
export const MOCKUP_MOBILE = svg(`
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="640" viewBox="0 0 320 640">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="#0a1f0a"/></linearGradient>
    <filter id="sh" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#15803D" flood-opacity="0.35"/></filter>
  </defs>
  <rect x="8" y="8" width="304" height="624" rx="44" fill="#111" stroke="#1f1f1f" stroke-width="2" filter="url(#sh)"/>
  <rect x="20" y="20" width="280" height="600" rx="36" fill="url(#bg)"/>
  <rect x="120" y="32" width="80" height="6" rx="3" fill="#333"/>
  <text x="32" y="78" fill="#39FF14" font-family="system-ui,sans-serif" font-size="20" font-weight="800">Innerarc</text>
  <text x="32" y="108" fill="#fff" font-family="system-ui,sans-serif" font-size="22" font-weight="800">Today</text>
  <text x="32" y="128" fill="#8a8a8a" font-size="11">5-day streak · 1,240 pts</text>
  <rect x="32" y="148" width="256" height="88" rx="14" fill="#111" stroke="#1f1f1f"/>
  <circle cx="88" cy="192" r="32" fill="none" stroke="#1a1a1a" stroke-width="8"/>
  <circle cx="88" cy="192" r="32" fill="none" stroke="#39FF14" stroke-width="8" stroke-dasharray="140 60" transform="rotate(-90 88 192)"/>
  <rect x="140" y="168" width="130" height="8" rx="4" fill="#1a1a1a"/><rect x="140" y="168" width="98" height="8" rx="4" fill="#39FF14"/>
  <rect x="140" y="186" width="130" height="8" rx="4" fill="#1a1a1a"/><rect x="140" y="186" width="72" height="8" rx="4" fill="#00E5FF"/>
  <rect x="32" y="252" width="256" height="100" rx="14" fill="#111" stroke="#1f1f1f"/>
  <text x="48" y="278" fill="#fff" font-size="12" font-weight="700">Weekly calories</text>
  <rect x="56" y="296" width="18" height="40" rx="6" fill="#39FF14" opacity="0.5"/>
  <rect x="82" y="304" width="18" height="32" rx="6" fill="#39FF14" opacity="0.6"/>
  <rect x="108" y="292" width="18" height="44" rx="6" fill="#39FF14" opacity="0.7"/>
  <rect x="134" y="300" width="18" height="36" rx="6" fill="#39FF14" opacity="0.6"/>
  <rect x="160" y="288" width="18" height="48" rx="6" fill="#39FF14"/>
  <rect x="32" y="368" width="78" height="72" rx="12" fill="#111" stroke="#1f1f1f"/>
  <rect x="121" y="368" width="78" height="72" rx="12" fill="#111" stroke="#1f1f1f"/>
  <rect x="210" y="368" width="78" height="72" rx="12" fill="#111" stroke="#1f1f1f"/>
  <rect x="32" y="456" width="256" height="44" rx="22" fill="#39FF14"/>
  <text x="160" y="484" text-anchor="middle" fill="#000" font-size="13" font-weight="700">Log meal</text>
</svg>`);

/** Tablet-width dashboard with rings + health row. */
export const MOCKUP_TABLET = svg(`
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="480" viewBox="0 0 720 480">
  <defs>
    <linearGradient id="tbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="#052e16"/></linearGradient>
    <filter id="tsh"><feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#15803D" flood-opacity="0.3"/></filter>
  </defs>
  <rect width="720" height="480" rx="24" fill="url(#tbg)" filter="url(#tsh)" stroke="#1f1f1f"/>
  <text x="40" y="52" fill="#39FF14" font-size="24" font-weight="800">Innerarc</text>
  <text x="40" y="88" fill="#fff" font-size="28" font-weight="800">Today</text>
  <rect x="40" y="110" width="300" height="160" rx="16" fill="#111" stroke="#1f1f1f"/>
  <circle cx="120" cy="190" r="48" fill="none" stroke="#1a1a1a" stroke-width="10"/>
  <circle cx="120" cy="190" r="48" fill="none" stroke="#39FF14" stroke-width="10" stroke-dasharray="210 90" transform="rotate(-90 120 190)"/>
  <rect x="200" y="150" width="120" height="10" rx="5" fill="#39FF14" opacity="0.8"/>
  <rect x="200" y="172" width="120" height="10" rx="5" fill="#00E5FF" opacity="0.8"/>
  <rect x="360" y="110" width="320" height="160" rx="16" fill="#111" stroke="#1f1f1f"/>
  <text x="380" y="140" fill="#fff" font-size="14" font-weight="700">Weekly calories</text>
  <rect x="400" y="160" width="28" height="80" rx="8" fill="#39FF14" opacity="0.55"/>
  <rect x="440" y="175" width="28" height="65" rx="8" fill="#39FF14" opacity="0.65"/>
  <rect x="480" y="150" width="28" height="90" rx="8" fill="#39FF14" opacity="0.75"/>
  <rect x="520" y="168" width="28" height="72" rx="8" fill="#39FF14" opacity="0.65"/>
  <rect x="560" y="145" width="28" height="95" rx="8" fill="#39FF14"/>
  <rect x="40" y="290" width="124" height="90" rx="14" fill="#111" stroke="#1f1f1f"/>
  <rect x="176" y="290" width="124" height="90" rx="14" fill="#111" stroke="#1f1f1f"/>
  <rect x="312" y="290" width="124" height="90" rx="14" fill="#111" stroke="#1f1f1f"/>
  <rect x="448" y="290" width="124" height="90" rx="14" fill="#111" stroke="#1f1f1f"/>
  <rect x="584" y="290" width="96" height="90" rx="14" fill="#111" stroke="#1f1f1f"/>
  <rect x="40" y="400" width="640" height="48" rx="24" fill="#39FF14"/>
  <text x="360" y="430" text-anchor="middle" fill="#000" font-size="15" font-weight="700">Start your wellness journey</text>
</svg>`);

/** Desktop with sidebar + wide content — Nexora-style product shot. */
export const MOCKUP_DESKTOP = svg(`
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <defs>
    <linearGradient id="dbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#000"/><stop offset="50%" stop-color="#0a1f0a"/><stop offset="100%" stop-color="#000"/></linearGradient>
    <filter id="dsh"><feDropShadow dx="0" dy="28" stdDeviation="32" flood-color="#39FF14" flood-opacity="0.22"/></filter>
  </defs>
  <rect width="960" height="540" rx="20" fill="url(#dbg)" filter="url(#dsh)" stroke="#1f1f1f"/>
  <rect x="0" y="0" width="200" height="540" rx="20" fill="#0a0a0a"/>
  <text x="32" y="48" fill="#39FF14" font-size="22" font-weight="800">Innerarc</text>
  <rect x="24" y="80" width="152" height="36" rx="10" fill="#39FF14" opacity="0.15"/>
  <text x="40" y="104" fill="#39FF14" font-size="13" font-weight="600">Home</text>
  <text x="40" y="148" fill="#8a8a8a" font-size="13">Workouts</text>
  <text x="40" y="180" fill="#8a8a8a" font-size="13">Nutrition</text>
  <text x="40" y="212" fill="#8a8a8a" font-size="13">Coach</text>
  <text x="240" y="52" fill="#fff" font-size="26" font-weight="800">Today</text>
  <rect x="240" y="72" width="680" height="120" rx="16" fill="#111" stroke="#1f1f1f"/>
  <circle cx="320" cy="132" r="40" fill="none" stroke="#39FF14" stroke-width="8" stroke-dasharray="180 80" transform="rotate(-90 320 132)"/>
  <rect x="400" y="100" width="480" height="64" rx="12" fill="#0a0a0a"/>
  <rect x="240" y="210" width="330" height="140" rx="16" fill="#111" stroke="#1f1f1f"/>
  <rect x="590" y="210" width="330" height="140" rx="16" fill="#111" stroke="#1f1f1f"/>
  <rect x="240" y="370" width="130" height="100" rx="14" fill="#111" stroke="#1f1f1f"/>
  <rect x="382" y="370" width="130" height="100" rx="14" fill="#111" stroke="#1f1f1f"/>
  <rect x="524" y="370" width="130" height="100" rx="14" fill="#111" stroke="#1f1f1f"/>
  <rect x="666" y="370" width="130" height="100" rx="14" fill="#111" stroke="#1f1f1f"/>
  <rect x="808" y="370" width="112" height="100" rx="14" fill="#111" stroke="#1f1f1f"/>
  <rect x="280" y="250" width="24" height="70" rx="8" fill="#39FF14" opacity="0.6"/>
  <rect x="316" y="265" width="24" height="55" rx="8" fill="#39FF14" opacity="0.75"/>
  <rect x="352" y="240" width="24" height="80" rx="8" fill="#39FF14"/>
</svg>`);

/** Auth panel illustration — rings + coach bubble. */
export const AUTH_HERO = svg(`
<svg xmlns="http://www.w3.org/2000/svg" width="560" height="640" viewBox="0 0 560 640">
  <defs>
    <linearGradient id="abg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#052e16"/>
      <stop offset="50%" stop-color="#0a1f0a"/>
      <stop offset="100%" stop-color="#000"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="40" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="560" height="640" fill="url(#abg)"/>
  <circle cx="480" cy="120" r="100" fill="#39FF14" opacity="0.08" filter="url(#glow)"/>
  <circle cx="80" cy="520" r="120" fill="#15803D" opacity="0.12" filter="url(#glow)"/>
  <text x="48" y="80" fill="#39FF14" font-size="32" font-weight="800">Innerarc</text>
  <text x="48" y="130" fill="#fff" font-size="36" font-weight="800">Your wellness,</text>
  <text x="48" y="175" fill="#fff" font-size="36" font-weight="800">accelerated.</text>
  <text x="48" y="220" fill="#8a8a8a" font-size="16">Meals · training · wearables · coach</text>
  <rect x="48" y="280" width="464" height="280" rx="24" fill="#111" stroke="#1f1f1f" stroke-width="1"/>
  <circle cx="160" cy="400" r="64" fill="none" stroke="#1a1a1a" stroke-width="12"/>
  <circle cx="160" cy="400" r="64" fill="none" stroke="#39FF14" stroke-width="12" stroke-dasharray="280 120" transform="rotate(-90 160 400)"/>
  <rect x="260" y="340" width="220" height="12" rx="6" fill="#39FF14" opacity="0.85"/>
  <rect x="260" y="368" width="220" height="12" rx="6" fill="#00E5FF" opacity="0.75"/>
  <rect x="260" y="396" width="220" height="12" rx="6" fill="#FFCC00" opacity="0.65"/>
  <rect x="72" y="480" width="416" height="56" rx="28" fill="#39FF14"/>
  <text x="280" y="514" text-anchor="middle" fill="#000" font-size="15" font-weight="700">One dashboard for your whole week</text>
</svg>`);

export const STATS = [
  { value: "10k+", label: "Daily logs" },
  { value: "4-in-1", label: "Meals · workouts · vitals · coach" },
  { value: "24/7", label: "Wearable sync" },
] as const;
