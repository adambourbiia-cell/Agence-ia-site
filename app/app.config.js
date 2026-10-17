// Version web de démonstration (scripts/build-web-demo.sh) : un seul fichier JS, sans découpage par écran.
module.exports = ({ config }) =>
  process.env.EXPO_PUBLIC_WEB_DEMO
    ? {
        ...config,
        plugins: config.plugins.map((p) => (p === 'expo-router' ? ['expo-router', { asyncRoutes: { web: false } }] : p)),
      }
    : config;
