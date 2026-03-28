const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prefer CommonJS to avoid ESM import.meta syntax issues on web (e.g., Zustand 5)
config.resolver.unstable_conditionNames = ['require', 'import'];

module.exports = config;
