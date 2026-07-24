import { View, type ViewProps } from "react-native";

import { Colors } from "@/constants/theme";

export type ThemedViewProps = ViewProps & {
  background?: keyof typeof Colors;
};

export function ThemedView({
  style,
  background = "background",
  ...otherProps
}: ThemedViewProps) {
  return (
    <View style={[{ backgroundColor: Colors[background] }, style]} {...otherProps} />
  );
}
