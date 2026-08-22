import { Ionicons } from "@expo/vector-icons";

/** Innerarc report palette — aligned with theme hex values. */
export const REPORT_COLORS = {
  primary: "#15803D",
  primaryBright: "#16A34A",
  primaryDark: "#166534",
  fluorescent: "#39FF14",
  aiBoxLight: "#ECFDF5",
  aiBoxDark: "#0A1F0A",
  aiTitleLight: "#166534",
  watermarkLight: "#E5E7EB",
  watermarkDark: "#1F1F1F",
  sky: "#0284C7",
  amber: "#CA8A04",
  slate: "#374151",
} as const;

function svgData(svg: string) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function hero(gradient: [string, string], inner: string) {
  return svgData(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="120" viewBox="0 0 640 120">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${gradient[0]}"/>
        <stop offset="100%" stop-color="${gradient[1]}"/>
      </linearGradient></defs>
      <rect fill="url(#g)" width="640" height="120"/>
      ${inner}
    </svg>`,
  );
}

export type ReportIcon = keyof typeof Ionicons.glyphMap;

export const REPORT_HERO = {
  steps: hero(
    ["#14532d", "#052e16"],
    `<circle cx="520" cy="56" r="40" fill="#39FF14" opacity="0.12"/>
     <g fill="none" stroke="#39FF14" stroke-width="3" stroke-linecap="round">
       <path d="M470 72c12-14 28-22 50-22s38 8 50 22"/>
       <circle cx="470" cy="78" r="5" fill="#39FF14"/>
       <circle cx="570" cy="78" r="5" fill="#39FF14"/>
     </g>`,
  ),
  heartRate: hero(
    ["#0c4a6e", "#082f49"],
    `<path d="M120 72 Q160 48 200 72 T280 72 T360 72" fill="none" stroke="#38bdf8" stroke-width="3"/>
     <path d="M400 58 L420 78 L460 42" fill="none" stroke="#7dd3fc" stroke-width="4" stroke-linecap="round"/>`,
  ),
  restingHr: hero(
    ["#14532d", "#052e16"],
    `<path d="M140 78 Q180 52 220 78 T300 78" fill="none" stroke="#39FF14" stroke-width="2.5" opacity="0.9"/>
     <rect x="480" y="48" width="72" height="32" rx="8" fill="#166534" opacity="0.8"/>`,
  ),
  bloodPressure: hero(
    ["#713f12", "#451a03"],
    `<rect x="460" y="48" width="120" height="14" rx="7" fill="#facc15" opacity="0.9"/>
     <rect x="460" y="72" width="88" height="14" rx="7" fill="#fde047" opacity="0.75"/>
     <circle cx="180" cy="60" r="28" fill="#ca8a04" opacity="0.25"/>`,
  ),
  sleep: hero(
    ["#1e3a5f", "#0f172a"],
    `<path d="M500 88 A40 40 0 1 1 500 48" fill="none" stroke="#38bdf8" stroke-width="8" stroke-linecap="round"/>
     <circle cx="160" cy="58" r="22" fill="#64748b" opacity="0.35"/>`,
  ),
  nutrition: hero(
    ["#166534", "#052e16"],
    `<circle cx="520" cy="58" r="36" fill="#22c55e" opacity="0.25"/>
     <circle cx="504" cy="52" r="12" fill="#fef3c7"/>
     <circle cx="532" cy="48" r="10" fill="#86efac"/>
     <circle cx="544" cy="64" r="8" fill="#fca5a5"/>`,
  ),
  caloriesDay: hero(
    ["#15803d", "#052e16"],
    `<rect x="440" y="44" width="22" height="56" rx="7" fill="#39FF14" opacity="0.5"/>
     <rect x="472" y="56" width="22" height="44" rx="7" fill="#39FF14" opacity="0.7"/>
     <rect x="504" y="36" width="22" height="64" rx="7" fill="#39FF14"/>
     <line x1="420" y1="36" x2="560" y2="36" stroke="#facc15" stroke-width="2" stroke-dasharray="6 4"/>`,
  ),
  workout: hero(
    ["#14532d", "#000000"],
    `<rect x="120" y="68" width="360" height="12" rx="6" fill="#39FF14" opacity="0.9"/>
     <rect x="88" y="50" width="24" height="42" rx="5" fill="#166534"/>
     <rect x="488" y="50" width="24" height="42" rx="5" fill="#166534"/>`,
  ),
  meal: hero(
    ["#0c4a6e", "#082f49"],
    `<ellipse cx="520" cy="60" rx="72" ry="40" fill="#38bdf8" opacity="0.18"/>
     <ellipse cx="520" cy="60" rx="48" ry="28" fill="#0ea5e9" opacity="0.35"/>`,
  ),
  walk: hero(
    ["#14532d", "#052e16"],
    `<path d="M440 78c20-22 45-30 75-30" fill="none" stroke="#39FF14" stroke-width="3" stroke-dasharray="8 6"/>
     <circle cx="440" cy="78" r="7" fill="#39FF14"/>`,
  ),
  progress: hero(
    ["#374151", "#111827"],
    `<rect x="460" y="42" width="100" height="56" rx="8" fill="#6b7280" opacity="0.35"/>
     <circle cx="510" cy="70" r="18" fill="#9ca3af" opacity="0.5"/>`,
  ),
  streak: hero(
    ["#713f12", "#451a03"],
    `<path d="M500 96c0-28 20-44 40-44 14 0 26 10 26 26 0 22-26 42-26 42s-26-20-26-42c0-16 12-26 26-26 20 0 40 16 40 44z" fill="#facc15" opacity="0.85"/>`,
  ),
  points: hero(
    ["#15803d", "#052e16"],
    `<polygon points="520,32 532,64 568,64 540,84 548,112 520,94 492,112 500,84 472,64 508,64" fill="#39FF14" opacity="0.75"/>`,
  ),
} as const;

export const REPORT_ICONS = {
  steps: "footsteps-outline",
  heartRate: "heart-outline",
  restingHr: "pulse-outline",
  bloodPressure: "fitness-outline",
  sleep: "moon-outline",
  nutrition: "nutrition-outline",
  caloriesDay: "bar-chart-outline",
  workout: "barbell-outline",
  meal: "restaurant-outline",
  walk: "footsteps-outline",
  progress: "camera-outline",
  streak: "flame-outline",
  points: "trophy-outline",
  default: "document-text-outline",
} as const satisfies Record<string, ReportIcon>;
