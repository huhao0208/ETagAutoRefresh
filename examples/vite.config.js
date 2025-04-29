import { defineConfig } from 'vite';
import path from 'path';
// 直接引入源代码，避免编译问题
import { ETagAutoRefreshPlugin } from '../src/index';

export default defineConfig({
  plugins: [
    new ETagAutoRefreshPlugin({
      resource: "/index.html",
      interval: 5000,
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
  server: {
    // 确保开启 ETag 支持
    headers: {
      "Cache-Control": "no-cache",
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
    },
    outDir: "dist/vite"
  },
}); 