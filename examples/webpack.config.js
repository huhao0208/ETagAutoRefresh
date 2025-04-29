const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// 使用编译后的版本
const ETagAutoRefreshPlugin = require('../dist/index').ETagAutoRefreshPlugin;

module.exports = {
  mode: "development",
  indexPath: "index.html",

  output: {
    path: path.resolve(__dirname, "dist/webpack"),
    filename: "bundle.js",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "index.html"),
    }),
    new ETagAutoRefreshPlugin({
      resource: "/index.html",
      interval: 1000,
      quiet: false,
      notification: {
        container: {
          background: "#2196F3",
          color: "white",
          borderRadius: "8px",
        },
        template: `
          <div>发现新版本，即将刷新...</div>
          <button>立即刷新</button>
        `,
      },
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    compress: true,
    port: 8080,
    open: true,
    host: "0.0.0.0",
    headers: {
      "Cache-Control": "no-cache",
    },
  },
}; 