const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// expo-sqlite's web build ships a WASM binary, which Metro treats as an
// unknown source file unless it is registered as an asset.
config.resolver.assetExts.push("wasm");

// That WASM build needs SharedArrayBuffer, which browsers only expose to
// cross-origin isolated pages. "credentialless" keeps cross-origin fetches
// (the terrain and vector tiles) working without requiring CORP headers
// from those hosts.
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    return middleware(req, res, next);
  };
};

module.exports = config;
