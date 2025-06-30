// babel.config.js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // ... vos autres plugins
    'react-native-reanimated/plugin', // <--- CE DOIT ÊTRE LE DERNIER ELEMENT DANS LA LISTE
  ],
};