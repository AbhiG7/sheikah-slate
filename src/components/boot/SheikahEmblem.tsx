import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from "react-native-svg";

import { Colors } from "@/constants/theme";

interface SheikahEmblemProps {
  size: number;
  opacity?: number;
}

/**
 * Glowing eye emblem for the boot screen.
 *
 * An original geometric interpretation of the ancient-tech motif, built from
 * primitives so it needs no image asset and stays crisp at any size.
 */
export function SheikahEmblem({ size, opacity = 1 }: SheikahEmblemProps) {
  const c = size / 2;

  return (
    <Svg width={size} height={size} opacity={opacity}>
      <Defs>
        <RadialGradient id="emblem-glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={Colors.teal} stopOpacity={0.45} />
          <Stop offset="1" stopColor={Colors.teal} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Circle cx={c} cy={c} r={c} fill="url(#emblem-glow)" />
      <Circle
        cx={c}
        cy={c}
        r={size * 0.42}
        fill="none"
        stroke={Colors.teal}
        strokeWidth={size * 0.012}
        opacity={0.6}
      />

      {/* Eye outline. */}
      <Ellipse
        cx={c}
        cy={c}
        rx={size * 0.34}
        ry={size * 0.2}
        fill="none"
        stroke={Colors.teal}
        strokeWidth={size * 0.022}
      />
      <Circle cx={c} cy={c} r={size * 0.1} fill={Colors.teal} />
      <Circle cx={c} cy={c} r={size * 0.045} fill={Colors.background} opacity={0.65} />

      {/* Three lashes above. */}
      {[-1, 0, 1].map((i) => {
        const spread = i * size * 0.17;
        const tilt = i * size * 0.06;
        return (
          <Path
            key={i}
            d={`M ${c + spread} ${c - size * 0.19} L ${c + spread + tilt} ${
              c - size * 0.42
            }`}
            stroke={Colors.teal}
            strokeWidth={size * 0.02}
            strokeLinecap="round"
          />
        );
      })}

      {/* Teardrop below. */}
      <Path
        d={`M ${c} ${c + size * 0.2} L ${c} ${c + size * 0.42}`}
        stroke={Colors.teal}
        strokeWidth={size * 0.022}
        strokeLinecap="round"
      />
      <Circle cx={c} cy={c + size * 0.44} r={size * 0.035} fill={Colors.teal} />
    </Svg>
  );
}
