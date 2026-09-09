import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

const BRONZE_DARK = "#4A3A22";
const BRONZE_MID = "#8C6D3F";
const BRONZE_LIGHT = "#C9A227";
const ETCH = "#2A2011";

interface SheikahBarProps {
  width: number;
  height: number;
  /** Which edge the bar sits on; the bevel highlight faces inward. */
  side: "left" | "right";
}

/**
 * Ornate bronze bar flanking the slate screen.
 *
 * Drawn as geometry rather than shipped as an image so it scales to any
 * device size without assets, and so the motif can be tuned in code. The
 * pattern is an original interpretation of the ancient-tech look, not a
 * trace of any existing artwork.
 */
export function SheikahBar({ width, height, side }: SheikahBarProps) {
  const gradientId = `bronze-${side}`;
  const inner = side === "left" ? width : 0;
  const outer = side === "left" ? 0 : width;

  // Evenly spaced medallions down the bar, sized to the bar width.
  const medallionRadius = Math.min(width * 0.28, 18);
  const count = Math.max(3, Math.floor(height / (medallionRadius * 6)));
  const spacing = height / (count + 1);

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={BRONZE_DARK} />
          <Stop offset={side === "left" ? "0.55" : "0.45"} stopColor={BRONZE_MID} />
          <Stop offset="0.8" stopColor={BRONZE_LIGHT} />
          <Stop offset="1" stopColor={BRONZE_DARK} />
        </LinearGradient>
      </Defs>

      <Rect x={0} y={0} width={width} height={height} fill={`url(#${gradientId})`} />

      {/* Bevel lines running the length of the bar. */}
      <Line
        x1={inner}
        y1={0}
        x2={inner}
        y2={height}
        stroke={BRONZE_LIGHT}
        strokeWidth={1.5}
        opacity={0.9}
      />
      <Line
        x1={outer}
        y1={0}
        x2={outer}
        y2={height}
        stroke={ETCH}
        strokeWidth={2}
      />
      <Line
        x1={width / 2}
        y1={0}
        x2={width / 2}
        y2={height}
        stroke={ETCH}
        strokeWidth={1}
        opacity={0.5}
      />

      {Array.from({ length: count }).map((_, i) => {
        const cy = spacing * (i + 1);
        return (
          <Circle
            key={`m-${i}`}
            cx={width / 2}
            cy={cy}
            r={medallionRadius}
            fill="none"
            stroke={ETCH}
            strokeWidth={2}
          />
        );
      })}

      {Array.from({ length: count }).map((_, i) => {
        const cy = spacing * (i + 1);
        return (
          <Circle
            key={`d-${i}`}
            cx={width / 2}
            cy={cy}
            r={medallionRadius * 0.35}
            fill={ETCH}
            opacity={0.8}
          />
        );
      })}

      {/* Notched connectors between medallions. */}
      {Array.from({ length: count + 1 }).map((_, i) => {
        const y = spacing * i + spacing / 2;
        const w = width * 0.34;
        return (
          <Path
            key={`n-${i}`}
            d={`M ${width / 2 - w} ${y} L ${width / 2} ${y - w * 0.7} L ${
              width / 2 + w
            } ${y} L ${width / 2} ${y + w * 0.7} Z`}
            fill="none"
            stroke={ETCH}
            strokeWidth={1.5}
            opacity={0.75}
          />
        );
      })}
    </Svg>
  );
}
