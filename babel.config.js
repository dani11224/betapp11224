// babel.config.js  (o .cjs si usas "type":"module")
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};
