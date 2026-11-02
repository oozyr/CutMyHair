module.exports = {
  expo: {
    name: 'CutMyHair',
    slug: 'cutmyhair-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'cutmyhair',
    userInterfaceStyle: 'light',
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || undefined,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/icon.png',
        backgroundColor: '#1A1A2E',
      },
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY || undefined,
        },
      },
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-status-bar',
      'expo-localization',
      'expo-location',
      'expo-web-browser',
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
