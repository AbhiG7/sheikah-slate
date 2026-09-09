import { useEffect, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { BeamOverlay } from "@/components/ar/BeamOverlay";
import { CameraPassthrough } from "@/components/ar/CameraPassthrough";
import { EdgeMenu } from "@/components/ar/EdgeMenu";
import { PointerDot } from "@/components/ar/PointerDot";
import { SheikahBar } from "@/components/boot/SheikahBar";
import { BeamCard } from "@/components/panel/BeamCard";
import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import { ARStateProvider, useARState } from "@/context/ARStateContext";
import { usePins } from "@/context/PinsContext";
import { useBeamProjections } from "@/hooks/useBeamProjections";
import { useFocusedBeam } from "@/hooks/useFocusedBeam";
import { identifyTarget } from "@/lib/terrain/identify";

const NOTICE_MS = 2200;

function CameraScreenContent() {
  const { pins, addPin } = usePins();
  const { location, headingDeg, pitchDeg } = useARState();
  const { width, height } = useWindowDimensions();

  const projections = useBeamProjections(pins, location, headingDeg, pitchDeg);
  const focusedPinId = useFocusedBeam(projections);
  const focused = projections.find((p) => p.pin.id === focusedPinId) ?? null;

  const [isScanning, setIsScanning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const barWidth = Math.max(24, Math.min(48, width * 0.045));

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  /**
   * The ray always leaves from the pointer at screen centre, whatever part
   * of the screen was tapped. The tap is just the trigger, so aiming is
   * done by pointing the phone and the dot is the single source of truth
   * for where you are looking.
   */
  const handleTap = async () => {
    if (isScanning) return;
    if (!location.coords) {
      setNotice("Waiting for GPS");
      return;
    }

    setIsScanning(true);
    try {
      const result = await identifyTarget({
        origin: location.coords,
        bearingDeg: headingDeg,
        pitchDeg,
      });

      if (result.kind === "sky") {
        setNotice("Nothing along that line. Try aiming lower.");
        return;
      }
      if (result.kind === "no-data") {
        setNotice("No terrain data here. Check your connection.");
        return;
      }

      await addPin({
        label: result.target.name ?? "Unnamed feature",
        latitude: result.target.coords.latitude,
        longitude: result.target.coords.longitude,
        altitude: result.target.elevationMeters,
        sourceMode: "terrain_raycast",
      });
    } catch {
      setNotice("Could not read the terrain just now.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraPassthrough />

      {/* Full-bleed tap target. Everything drawn above it either ignores
          touches or is meant to receive them, like the card's buttons. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleTap} />

      <BeamOverlay projections={projections} focusedPinId={focusedPinId} />

      {focused ? (
        <BeamCard
          pin={focused.pin}
          beamX={focused.screenX}
          beamY={focused.baseY}
          screenWidth={width}
          screenHeight={height}
          insetX={barWidth}
          distanceMeters={focused.distanceMeters}
          bearingDeg={focused.bearingDeg}
        />
      ) : null}

      <PointerDot isFocused={focused !== null} isScanning={isScanning} />

      {notice ? (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(200)}
          style={styles.notice}
          pointerEvents="none"
        >
          <ThemedText type="code" color="text">
            {notice}
          </ThemedText>
        </Animated.View>
      ) : null}

      <View style={[styles.bar, { left: 0 }]} pointerEvents="none">
        <SheikahBar width={barWidth} height={height} side="left" />
      </View>
      <View style={[styles.bar, { right: 0 }]} pointerEvents="none">
        <SheikahBar width={barWidth} height={height} side="right" />
      </View>

      <EdgeMenu
        isOpen={menuOpen}
        onOpen={() => setMenuOpen(true)}
        onClose={() => setMenuOpen(false)}
      />
    </View>
  );
}

export default function CameraScreen() {
  return (
    <ARStateProvider>
      <CameraScreenContent />
    </ARStateProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bar: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  notice: {
    position: "absolute",
    bottom: Spacing.five,
    alignSelf: "center",
    backgroundColor: "#0B2A3AE6",
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.teal,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});
