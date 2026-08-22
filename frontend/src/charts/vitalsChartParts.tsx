import Svg, { Circle, G, Path, Polyline } from "react-native-svg";

type MiniProgressRingProps = {
  progress: number;
  fill: string;
  track: string;
  size?: number;
  stroke?: number;
};

export function MiniProgressRing({
  progress,
  fill,
  track,
  size = 52,
  stroke = 5,
}: MiniProgressRingProps) {
  const center = size / 2;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = circumference * (1 - clamped);

  return (
    <Svg width={size} height={size}>
      <G transform={`rotate(-90 ${center} ${center})`}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={track}
          strokeWidth={stroke}
          fill="none"
          opacity={0.35}
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={fill}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
        />
      </G>
    </Svg>
  );
}

type EcgWaveformProps = {
  color: string;
  width?: number;
  height?: number;
  beats?: number;
};

function buildEcgPoints(
  width: number,
  height: number,
  beats: number,
): string {
  const mid = height * 0.62;
  const seg = width / beats;
  const pts: [number, number][] = [];

  for (let b = 0; b < beats; b += 1) {
    const x = b * seg;
    pts.push([x, mid]);
    pts.push([x + seg * 0.12, mid]);
    pts.push([x + seg * 0.16, mid - height * 0.08]);
    pts.push([x + seg * 0.2, mid + height * 0.32]);
    pts.push([x + seg * 0.24, mid - height * 0.38]);
    pts.push([x + seg * 0.28, mid + height * 0.12]);
    pts.push([x + seg * 0.34, mid - height * 0.06]);
    pts.push([x + seg, mid]);
  }

  return pts.map(([px, py]) => `${px},${py}`).join(" ");
}

export function EcgWaveform({
  color,
  width = 140,
  height = 48,
  beats = 4,
}: EcgWaveformProps) {
  const points = buildEcgPoints(width, height, beats);
  return (
    <Svg width={width} height={height}>
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

type SleepArcProps = {
  hours: number;
  goal?: number;
  fill: string;
  track: string;
  width?: number;
  height?: number;
};

/** Semicircle sleep progress (hours vs goal). */
export function SleepArc({
  hours,
  goal = 8,
  fill,
  track,
  width = 100,
  height = 56,
}: SleepArcProps) {
  const progress = Math.min(1, Math.max(0, hours / goal));
  const cx = width / 2;
  const cy = height - 4;
  const r = width / 2 - 6;
  const startAngle = Math.PI;
  const endAngle = Math.PI * (1 - progress);
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = progress > 0.5 ? 1 : 0;
  const trackPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const fillPath =
    progress <= 0
      ? ""
      : `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;

  return (
    <Svg width={width} height={height}>
      <Path d={trackPath} stroke={track} strokeWidth={5} fill="none" opacity={0.35} />
      {fillPath ? (
        <Path d={fillPath} stroke={fill} strokeWidth={5} fill="none" strokeLinecap="round" />
      ) : null}
    </Svg>
  );
}

type BpGaugeProps = {
  systolic: number;
  diastolic: number;
  fill: string;
  track: string;
  width?: number;
};

export function BpGauge({
  systolic,
  diastolic,
  fill,
  track,
  width = 120,
}: BpGaugeProps) {
  const sysPct = Math.min(100, (systolic / 140) * 100);
  const diaPct = Math.min(100, (diastolic / 90) * 100);
  const barH = 6;
  const gap = 8;

  return (
    <Svg width={width} height={barH * 2 + gap}>
      <Path
        d={`M 0 ${barH / 2} H ${width}`}
        stroke={track}
        strokeWidth={barH}
        strokeLinecap="round"
        opacity={0.35}
      />
      <Path
        d={`M 0 ${barH / 2} H ${(width * sysPct) / 100}`}
        stroke={fill}
        strokeWidth={barH}
        strokeLinecap="round"
      />
      <Path
        d={`M 0 ${barH + gap + barH / 2} H ${width}`}
        stroke={track}
        strokeWidth={barH}
        strokeLinecap="round"
        opacity={0.35}
      />
      <Path
        d={`M 0 ${barH + gap + barH / 2} H ${(width * diaPct) / 100}`}
        stroke={fill}
        strokeWidth={barH}
        strokeLinecap="round"
        opacity={0.75}
      />
    </Svg>
  );
}
