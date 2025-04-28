/**
 * ETagAutoRefresh - 基于ETag检测的前端自动刷新插件
 * 支持作为webpack/vite插件使用
 */
class ETagAutoRefreshPlugin {
  constructor(options = {}) {
    this.options = {
      resource: '/',
      interval: 30000,
      quiet: false,
      notification: {
        // 默认通知样式
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
        // 自定义消息模板
        template: `
          <div>检测到新版本，3秒后自动刷新...</div>
          <button>立即刷新</button>
        `
      },
      ...options
    };

    // 合并自定义通知样式
    if (options.notification) {
      this.options.notification = {
        ...this.options.notification,
        ...options.notification,
        container: {
          ...this.options.notification.container,
          ...(options.notification.container || {})
        },
        button: {
          ...this.options.notification.button,
          ...(options.notification.button || {})
        }
      };
    }
  }

  apply(compiler) {
    // 在编译完成后注入代码
    compiler.hooks.done.tap('ETagAutoRefreshPlugin', () => {
      const code = this.generateInjectionCode();
      // 将代码注入到HTML文件中
      compiler.hooks.compilation.tap('ETagAutoRefreshPlugin', (compilation) => {
        compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tap(
          'ETagAutoRefreshPlugin',
          (htmlPluginData) => {
            htmlPluginData.html = htmlPluginData.html.replace(
              '</body>',
              `${code}</body>`
            );
          }
        );
      });
    });
  }

  generateInjectionCode() {
    const notificationConfig = this.options.notification;
    const containerStyles = Object.entries(notificationConfig.container)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
    const buttonStyles = Object.entries(notificationConfig.button)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');

    return `
      <script>
        (function() {
          const config = ${JSON.stringify(this.options)};
          let previousETag = null;
          let timer = null;
          let isRunning = false;

          async function fetchETag() {
            const response = await fetch(config.resource, {
              method: 'HEAD',
              cache: 'no-cache',
              headers: {
                'Cache-Control': 'no-cache'
              }
            });

            if (!response.ok) {
              throw new Error(\`请求失败: \${response.status}\`);
            }

            const etag = response.headers.get('ETag');
            if (!etag) {
              throw new Error('服务器未返回ETag头');
            }

            return etag;
          }

          async function checkUpdate() {
            try {
              const currentETag = await fetchETag();

              if (previousETag && currentETag !== previousETag) {
                if (!config.quiet) {
                  console.log('[ETagAutoRefresh] 检测到更新，准备刷新页面...');
                }
                onUpdateDetected();
                return;
              }

              previousETag = currentETag;
            } catch (error) {
              if (!config.quiet) {
                console.log('[ETagAutoRefresh] 检测更新时出错:', error.message);
              }
            }
          }

          function onUpdateDetected() {
            if (!config.quiet) {
              showNotification();
            }
            setTimeout(() => {
              window.location.reload(true);
            }, 3000);
          }

          function showNotification() {
            const notification = document.createElement('div');
            notification.style.cssText = \`${containerStyles}\`;
            notification.innerHTML = config.notification.template;

            // 应用按钮样式
            const button = notification.querySelector('button');
            if (button) {
              button.style.cssText = \`${buttonStyles}\`;
              button.addEventListener('click', () => {
                window.location.reload(true);
              });
            }

            document.body.appendChild(notification);

            // 5秒后自动消失
            setTimeout(() => {
              notification.style.animation = 'fadeOut 0.5s';
              setTimeout(() => notification.remove(), 500);
            }, 5000);

            // 添加动画样式
            const style = document.createElement('style');
            style.textContent = \`
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(20px); }
              }
            \`;
            document.head.appendChild(style);
          }

          // 初始化
          (async function init() {
            try {
              previousETag = await fetchETag();
              if (!config.quiet) {
                console.log('[ETagAutoRefresh] 监控已启动');
              }
              start();
            } catch (error) {
              console.error('[ETagAutoRefresh] 初始化失败:', error);
            }
          })();

          function start() {
            if (isRunning) return;
            isRunning = true;
            timer = setInterval(checkUpdate, config.interval);
          }

          function stop() {
            if (!isRunning) return;
            clearInterval(timer);
            isRunning = false;
          }
        })();
      </script>
    `;
  }
}

// 导出插件
module.exports = ETagAutoRefreshPlugin;