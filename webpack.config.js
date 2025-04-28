const path = require("path");

const baseConfig = {
  entry: "./src/index.ts",
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  mode: "production"
};

const umdConfig = {
  ...baseConfig,
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "etag-auto-refresh.min.js",
    library: {
      name: "ETagAutoRefresh",
      type: "umd",
      export: "default"
    },
    globalObject: "this",
    iife: true
  }
};

const esmConfig = {
  ...baseConfig,
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "etag-auto-refresh.esm.js",
    library: {
      type: "module"
    }
  },
  experiments: {
    outputModule: true
  }
};

module.exports = [umdConfig, esmConfig];
