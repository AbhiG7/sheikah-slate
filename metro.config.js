const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Registered so a .wasm import resolves as an asset rather than as an
// unknown source file. Nothing in the web bundle needs it today, since pin
// storage moved off expo-sqlite on web, but it costs nothing.
config.resolver.assetExts.push("wasm");

// No COOP/COEP headers here on purpose. They were added for expo-sqlite's
// WASM worker, which the web build no longer uses, and serving the page
// cross-origin isolated for no reason is a needless variable when
// debugging sensor access.

module.exports = config;
