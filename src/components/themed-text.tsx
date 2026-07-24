import { Text, type TextProps } from "react-native";

import { Colors, Fonts } from "@/constants/theme";

export type ThemedTextProps = TextProps & {
  type?: "default" | "title" | "small" | "smallBold" | "subtitle" | "code";
  color?: keyof typeof Colors;
};

export function ThemedText({
  style,
  type = "default",
  color = "text",
  ...rest
}: ThemedTextProps) {
  return (
    <Text
      style={[
        { color: Colors[color] },
        type === "default" && styles.default,
        type === "title" && styles.title,
        type === "small" && styles.small,
        type === "smallBold" && styles.smallBold,
        type === "subtitle" && styles.subtitle,
        type === "code" && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = {
  small: { fontSize: 14, lineHeight: 20, fontWeight: "500" as const },
  smallBold: { fontSize: 14, lineHeight: 20, fontWeight: "700" as const },
  default: { fontSize: 16, lineHeight: 24, fontWeight: "500" as const },
  title: { fontSize: 34, fontWeight: "600" as const, lineHeight: 40 },
  subtitle: { fontSize: 22, lineHeight: 30, fontWeight: "600" as const },
  code: { fontFamily: Fonts.mono, fontSize: 12 },
};
