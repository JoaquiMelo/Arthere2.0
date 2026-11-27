
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

    '@react-native-community/datetimepicker',
    'expo-splash-screen',

    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'O Arthere usa sua localização para marcar onde você atende ou onde acontece o seu evento.',
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
