
const appJson = require('./app.json');

module.exports = ({ config }) => ({
  ...config,
  ...appJson.expo,
  ios: {
    ...appJson.expo.ios,
    ...config.ios,
    bundleIdentifier: 'com.joaquimelo.arthere',
  },
  android: {
    ...appJson.expo.android,
    ...config.android,
    package: 'com.anonymous.ArtherePush',
  },
  plugins: [
    ...(config.plugins || []),
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'O Arthere usa sua localização para centralizar o mapa onde você atende.',
      },
    ],
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    ],
  ],
});
