const appJson = require('./app.json');

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
  },
  plugins: [
    ...(config.plugins || []),
    [
      'expo-location',
      { locationWhenInUsePermission: 'O Arthere usa sua localização para centralizar o mapa onde você atende.' },
    ],
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    ],
  ],
});
