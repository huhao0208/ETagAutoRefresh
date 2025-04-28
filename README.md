# ETagAutoRefresh

基于ETag检测的前端自动刷新插件，支持作为webpack/vite插件使用。在开发过程中，当检测到服务器资源发生变化时，自动刷新页面，提高开发效率。

## 特点

- 🚀 支持作为webpack/vite插件使用
- ⚡ 自动注入代码，无需在业务代码中添加
- 🔧 配置简单，支持自定义
- 💬 提供友好的更新提示
- 🔇 支持静默模式
- 🔄 自动检测资源变化
- 🎨 支持自定义提示样式和模板

## 安装

```bash
# npm
npm install etag-auto-refresh --save-dev

# yarn
yarn add etag-auto-refresh -D

# pnpm
pnpm add etag-auto-refresh -D
```

## 使用

### Webpack配置

```javascript
const ETagAutoRefreshPlugin = require('etag-auto-refresh');

module.exports = {
  // ...其他配置
  plugins: [
    new ETagAutoRefreshPlugin({
      resource: '/', // 监控的资源路径，默认为'/'
      interval: 30000, // 轮询间隔(毫秒)，默认为30000
      quiet: false, // 是否静默模式，默认为false
      notification: {
        // 自定义通知容器样式
        container: {
          background: '#2196F3', // 修改背景色
          color: 'white',
          borderRadius: '8px',
          // ... 其他样式
        },
        // 自定义按钮样式
        button: {
          background: 'white',
          color: '#2196F3',
          border: '1px solid white',
          // ... 其他样式
        },
        // 自定义消息模板
        template: `
          <div>发现新版本，即将刷新...</div>
          <button>立即刷新</button>
        `
      }
    })
  ]
};
```

### Vite配置

```javascript
import { defineConfig } from 'vite';
import ETagAutoRefreshPlugin from 'etag-auto-refresh';

export default defineConfig({
  plugins: [
    ETagAutoRefreshPlugin({
      resource: '/',
      interval: 30000,
      quiet: false,
      notification: {
        container: {
          background: '#2196F3',
          // ... 其他样式
        },
        button: {
          // ... 按钮样式
        },
        template: `
          <div>发现新版本，即将刷新...</div>
          <button>立即刷新</button>
        `
      }
    })
  ]
});
```

### 完整示例

#### Webpack项目示例

```javascript
// webpack.config.js
const path = require('path');
const ETagAutoRefreshPlugin = require('etag-auto-refresh');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  plugins: [
    new HtmlWebpackPlugin(),
    new ETagAutoRefreshPlugin({
      resource: '/index.html',
      interval: 5000,
      quiet: false
    })
  ]
};
```

#### Vite项目示例

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import ETagAutoRefreshPlugin from 'etag-auto-refresh';

export default defineConfig({
  plugins: [
    ETagAutoRefreshPlugin({
      resource: '/',
      interval: 5000,
      quiet: false
    })
  ]
});
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| resource | string | '/' | 监控的资源路径，可以是相对路径或绝对路径 |
| interval | number | 30000 | 轮询间隔(毫秒)，建议不要设置太短，避免频繁请求 |
| quiet | boolean | false | 是否静默模式，true时不显示更新提示 |
| notification | object | - | 通知样式配置 |
| notification.container | object | - | 通知容器的样式 |
| notification.button | object | - | 按钮的样式 |
| notification.template | string | - | 自定义消息模板 |

### 默认通知样式

```javascript
{
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '15px',
    background: '#4CAF50',
    color: 'white',
    borderRadius: '5px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    zIndex: '9999',
    animation: 'fadeIn 0.5s'
  },
  button: {
    marginTop: '10px',
    padding: '5px 10px',
    background: 'white',
    color: '#4CAF50',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer'
  },
  template: `
    <div>检测到新版本，3秒后自动刷新...</div>
    <button>立即刷新</button>
  `
}
```

## 工作原理

1. 插件会在构建时自动注入监控代码
2. 页面加载后，开始定期检查指定资源的ETag
3. 当检测到ETag发生变化时，显示更新提示
4. 3秒后自动刷新页面，或点击"立即刷新"按钮立即刷新

## 注意事项

1. 确保服务器正确设置了ETag响应头
2. 建议仅在开发环境中使用，不建议在生产环境使用
3. 默认监控根路径，可以根据需要修改监控路径
4. 轮询间隔建议不要设置太短，避免频繁请求
5. 如果服务器不支持ETag，插件将无法正常工作
6. 在HTTPS环境下使用时，确保服务器配置了正确的CORS头
7. 自定义样式时，建议保留必要的样式属性（如position、zIndex等）

## 常见问题

### 1. 为什么没有检测到更新？

- 检查服务器是否正确设置了ETag响应头
- 确认监控的资源路径是否正确
- 检查网络请求是否正常

### 2. 如何自定义更新提示的样式？

可以通过`notification`配置项来自定义样式：

```javascript
new ETagAutoRefreshPlugin({
  notification: {
    container: {
      background: '#2196F3',
      // ... 其他样式
    },
    button: {
      // ... 按钮样式
    },
    template: `
      <div>自定义消息内容</div>
      <button>自定义按钮文本</button>
    `
  }
});
```

### 3. 是否支持监控多个资源？

目前只支持监控单个资源，如果需要监控多个资源，可以创建多个插件实例。

## License

MIT
