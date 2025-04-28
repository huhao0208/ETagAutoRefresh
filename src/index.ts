import { PluginOptions, Compiler, Compilation } from './types';

/**
 * ETagAutoRefresh - 基于ETag检测的前端自动刷新插件
 * 支持作为webpack/vite插件使用，同时支持开发环境和生产环境
 */
class ETagAutoRefreshPlugin {
  private options: PluginOptions;

  constructor(options: Partial<PluginOptions> = {}) {
    this.options = {
      resource: '/',
      env: {
        development: {
          enabled: true,
          interval: 30000,
          quiet: false
        },
        production: {
          enabled: true,
          interval: 60000,
          quiet: true
        }
      },
      notification: {
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
      },
      ...options
    };

    // 合并环境配置
    if (options.env) {
      this.options.env = {
        development: {
          ...this.options.env.development,
          ...(options.env.development || {})
        },
        production: {
          ...this.options.env.production,
          ...(options.env.production || {})
        }
      };
    }

    // 合并通知配置
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

  apply(compiler: Compiler): void {
    const isProduction = compiler.options.mode === 'production';
    const envConfig = this.options.env[isProduction ? 'production' : 'development'];

    // 如果当前环境未启用，则不注入代码
    if (!envConfig.enabled) {
      return;
    }

    // 在编译完成后注入代码
    compiler.hooks.done.tap('ETagAutoRefreshPlugin', () => {
      const code = this.generateInjectionCode(isProduction, envConfig);
      // 将代码注入到HTML文件中
      compiler.hooks.compilation.tap('ETagAutoRefreshPlugin', (compilation: Compilation) => {
        compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tap(
          'ETagAutoRefreshPlugin',
          (htmlPluginData: { html: string }) => {
            htmlPluginData.html = htmlPluginData.html.replace(
              '</body>',
              `${code}</body>`
            );
          }
        );
      });
    });
  }

  private generateInjectionCode(isProduction: boolean, envConfig: PluginOptions['env']['development']): string {
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
          const config = ${JSON.stringify({
            ...this.options,
            interval: envConfig.interval,
            quiet: envConfig.quiet
          })};
          let previousETag: string | null = null;
          let timer: number | null = null;
          let isRunning = false;

          async function fetchETag(): Promise<string> {
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

          async function checkUpdate(): Promise<void> {
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

          function onUpdateDetected(): void {
            if (!config.quiet) {
              showNotification();
            }
            setTimeout(() => {
              window.location.reload(true);
            }, 3000);
          }

          function showNotification(): void {
            const notification = document.createElement('div');
            notification.style.cssText = \`${containerStyles}\`;
            notification.innerHTML = config.notification.template;

            const button = notification.querySelector('button');
            if (button) {
              button.style.cssText = \`${buttonStyles}\`;
              button.addEventListener('click', () => {
                window.location.reload(true);
              });
            }

            document.body.appendChild(notification);

            setTimeout(() => {
              notification.style.animation = 'fadeOut 0.5s';
              setTimeout(() => notification.remove(), 500);
            }, 5000);

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
          (async function init(): Promise<void> {
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

          function start(): void {
            if (isRunning) return;
            isRunning = true;
            timer = window.setInterval(checkUpdate, config.interval);
          }

          function stop(): void {
            if (!isRunning) return;
            if (timer) {
              window.clearInterval(timer);
            }
            isRunning = false;
          }
        })();
      </script>
    `;
  }
}

export default ETagAutoRefreshPlugin; 