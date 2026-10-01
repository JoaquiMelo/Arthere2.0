const appJson = require('./app.json');

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
  },
  plugins: [
    ...(config.plugins || []),
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    ],
  ],
});
