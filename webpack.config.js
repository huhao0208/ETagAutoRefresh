const path = require("path");

module.exports = {
  entry: "./src/index.js",
  output: [
    {
      filename: "etag-auto-refresh.min.js",
      path: path.resolve(__dirname, "dist"),
      library: "ETagAutoRefresh",
      libraryTarget: "umd",
      globalObject: "this",
    },
    {
      filename: "etag-auto-refresh.esm.js",
      path: path.resolve(__dirname, "dist"),
      library: {
        type: "module"
      }
    }
  ],
  experiments: {
    outputModule: true
  },
  mode: "production",
};
