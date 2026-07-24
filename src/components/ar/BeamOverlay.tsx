import { StyleSheet, View } from "react-native";

import type { BeamProjection } from "@/hooks/useBeamProjections";

import { Beam } from "./Beam";

interface BeamOverlayProps {
  projections: BeamProjection[];
  focusedPinId: string | null;
}

export function BeamOverlay({ projections, focusedPinId }: BeamOverlayProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {projections.map((projection) => (
        <Beam
          key={projection.pin.id}
          screenX={projection.screenX}
          baseY={projection.baseY}
          distanceMeters={projection.distanceMeters}
          focused={projection.pin.id === focusedPinId}
        />
      ))}
    </View>
  );
}
