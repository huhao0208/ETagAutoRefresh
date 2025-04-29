import type { ETagAutoRefreshOptions } from './types';
import type { Plugin, ViteDevServer } from 'vite';

/**
 * ETagAutoRefresh - 基于ETag检测的前端自动刷新插件
 * 支持作为webpack/vite插件使用，同时支持开发环境和生产环境
 */
class ETagAutoRefresh {
  private options: ETagAutoRefreshOptions;
  private etagMap: Map<string, string> = new Map();
  private checkInterval: NodeJS.Timeout | number | null = null;
  private isServer: boolean;
  public isVite: boolean;
  private isProduction: boolean;

  constructor(options: ETagAutoRefreshOptions = {}) {
    this.options = {
      resource: '/',
      interval: 30000,
      quiet: false,
      ...options
    };
    this.isServer = typeof window === 'undefined';
    this.isVite = typeof process !== 'undefined' && 
      (process.env.VITE !== undefined || 
       (process.env.npm_lifecycle_script || '').includes('vite') ||
       (process.env.npm_package_dependencies || '').includes('vite'));
    this.isProduction = process.env.NODE_ENV === 'production';

    console.log('[ETagAutoRefresh] 初始化配置:', {
      isServer: this.isServer,
      isVite: this.isVite,
      isProduction: this.isProduction,
      options: this.options
    });
  }

  // Webpack 插件接口
  apply(compiler: any) {
    console.log('[ETagAutoRefresh] 应用 Webpack 插件');
    if (this.isVite) {
      console.log('[ETagAutoRefresh] 跳过 Webpack 插件，因为当前是 Vite 环境');
      return;
    }

    if (compiler.hooks) {
      // 开发环境
      compiler.hooks.afterEmit.tap('ETagAutoRefreshPlugin', (compilation: any) => {
        console.log('[ETagAutoRefresh] 触发 afterEmit 钩子');
        this.initMonitoring(compilation);
      });

      // 生产环境注入代码
      compiler.hooks.compilation.tap('ETagAutoRefreshPlugin', (compilation: any) => {
        if (compilation.hooks.htmlWebpackPluginAfterHtmlProcessing) {
          compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tap(
            'ETagAutoRefreshPlugin',
            (data: { html: string }) => {
              if (this.options.quiet !== true) {
                console.log('[ETagAutoRefresh] 注入客户端代码到HTML');
              }
              data.html = data.html.replace(
                '</body>',
                `<script>${this.generateClientCode()}</script></body>`
              );
              return data;
            }
          );
        } else if (compilation.hooks.processAssets) {
          compilation.hooks.processAssets.tap(
            {
              name: 'ETagAutoRefreshPlugin',
              stage: compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE
            },
            (assets: any) => {
              if (this.options.quiet !== true) {
                console.log('[ETagAutoRefresh] 注入客户端代码到资源');
              }
              
              // 找到HTML资源并注入代码
              Object.keys(assets).forEach((fileName) => {
                if (fileName.endsWith('.html')) {
                  const asset = assets[fileName];
                  const html = asset.source().toString();
                  const updatedHtml = html.replace(
                    '</body>',
                    `<script>${this.generateClientCode()}</script></body>`
                  );
                  assets[fileName] = {
                    source: () => updatedHtml,
                    size: () => updatedHtml.length
                  };
                }
              });
            }
          );
        }
      });
    }
  }

  // Vite 插件接口
  vitePlugin(): Plugin {
    const self = this;
    return {
      name: 'etag-auto-refresh',
      configureServer(server: ViteDevServer) {
        if (self.options.quiet !== true) {
          console.log('[ETagAutoRefresh] 配置 Vite 服务器');
        }
        
        // 记录ETag的中间件
        server.middlewares.use((req: any, res: any, next: any) => {
          // 跳过 Vite 内部请求
          if (req.url && (req.url.startsWith('/@') || req.url.includes('node_modules'))) {
            return next();
          }
          
          const originalSetHeader = res.setHeader;
          
          res.setHeader = function(name: string, value: any) {
            if (name.toLowerCase() === 'etag') {
              const url = req.url;
              // 检查当前 URL 是否匹配监控的资源
              const resourcePath = self.options.resource || '/';
              const shouldMonitor = 
                url === resourcePath || 
                (resourcePath === '/' && (url === '/index.html' || url === '/'));
              
              if (shouldMonitor) {
                if (self.options.quiet !== true) {
                  console.log('[ETagAutoRefresh] 记录资源 ETag:', { url, etag: value });
                }
                self.etagMap.set(url, value);
              }
            }
            return originalSetHeader.call(this, name, value);
          };
          
          next();
        });

        self.initMonitoring();
      },
      
      transformIndexHtml(html: string) {
        if (self.options.quiet !== true) {
          console.log('[ETagAutoRefresh] 转换 HTML');
        }
        
        return html.replace(
          '</body>',
          `<script>${self.generateClientCode()}</script></body>`
        );
      }
    };
  }

  // 生成客户端代码
  private generateClientCode(): string {
    if (this.options.quiet !== true) {
      console.log('[ETagAutoRefresh] 生成客户端代码');
    }

    // 默认通知样式
    const defaultNotification = {
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
    };

    // 合并用户配置和默认配置
    const notification = {
      container: { ...defaultNotification.container, ...(this.options.notification?.container || {}) },
      button: { ...defaultNotification.button, ...(this.options.notification?.button || {}) },
      template: this.options.notification?.template || defaultNotification.template
    };

    return `
      (function() {
        if (!window.ETagAutoRefresh) {
          const options = ${JSON.stringify({
            resource: this.options.resource,
            interval: this.options.interval,
            quiet: this.options.quiet
          })};
          const notification = ${JSON.stringify(notification)};
          let currentEtag = null;
          let checkInterval = null;
          let refreshTimeout = null;
          let lastCheckTime = null;

          // 创建自定义样式
          const style = document.createElement('style');
          style.textContent = '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }';
          document.head.appendChild(style);

          function startChecking() {
            if (options.quiet !== true) {
              console.log('[ETagAutoRefresh] 开始检查更新，间隔:', options.interval, 'ms');
            }
            
            clearInterval(checkInterval);
            checkInterval = setInterval(checkForChanges, options.interval);
            
            // 立即执行一次，获取初始ETag
            checkForChanges();
          }

          async function checkForChanges() {
            lastCheckTime = new Date().getTime();
            // 更新全局状态
            window.ETagAutoRefresh.lastCheckTime = lastCheckTime;
            
            try {
              const url = options.resource || '/';
              
              // 修复 URL 解析逻辑
              let fullUrl;
              if (url.startsWith('http')) {
                fullUrl = url;
              } else {
                // 处理 Vite 开发服务器特殊路径
                const baseUrl = window.location.origin;
                
                // 避免处理 Vite 内部路径，如 /@fs/ 开头的路径
                if (url.startsWith('/@') || window.location.pathname.startsWith('/@')) {
                  console.log('[ETagAutoRefresh] 跳过 Vite 内部路径检查');
                  return;
                }
                
                fullUrl = baseUrl + (url.startsWith('/') ? url : '/' + url);
              }
              
              if (options.quiet !== true) {
                console.log('[ETagAutoRefresh] 检查资源:', fullUrl);
              }
              
              const response = await fetch(fullUrl, { 
                method: 'HEAD',
                cache: 'no-store',
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
                }
              });
              
              const newEtag = response.headers.get('etag');
              
              if (!newEtag) {
                if (options.quiet !== true) {
                  console.warn('[ETagAutoRefresh] 服务器未返回ETag头信息');
                }
                return;
              }
              
              // 更新全局状态
              window.ETagAutoRefresh.currentEtag = newEtag;
              
              if (currentEtag === null) {
                // 首次获取ETag
                currentEtag = newEtag;
                if (options.quiet !== true) {
                  console.log('[ETagAutoRefresh] 初始ETag:', newEtag);
                }
                return;
              }

              if (newEtag !== currentEtag) {
                if (options.quiet !== true) {
                  console.log('[ETagAutoRefresh] 检测到ETag变化:', {
                    old: currentEtag,
                    new: newEtag
                  });
                }
                
                currentEtag = newEtag;
                showNotification();
              }
            } catch (error) {
              if (options.quiet !== true) {
                console.error('[ETagAutoRefresh] 检查更新出错:', error);
              }
            }
          }

          function showNotification() {
            if (options.quiet === true) return;
            
            if (refreshTimeout) {
              clearTimeout(refreshTimeout);
            }
            
            // 移除已存在的通知
            const existingNotification = document.querySelector('.etag-auto-refresh-notification');
            if (existingNotification) {
              document.body.removeChild(existingNotification);
            }
            
            // 创建通知元素
            const notificationElement = document.createElement('div');
            notificationElement.className = 'etag-auto-refresh-notification';
            
            // 应用容器样式
            Object.keys(notification.container).forEach(key => {
              notificationElement.style[key] = notification.container[key];
            });
            
            // 设置内容
            notificationElement.innerHTML = notification.template;
            
            // 查找并样式化按钮
            document.body.appendChild(notificationElement);
            const button = notificationElement.querySelector('button');
            
            if (button) {
              Object.keys(notification.button).forEach(key => {
                button.style[key] = notification.button[key];
              });
              
              button.addEventListener('click', () => {
                window.location.reload();
              });
            }
            
            // 3秒后自动刷新
            refreshTimeout = setTimeout(() => {
              window.location.reload();
            }, 3000);
          }

          // 初始化
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startChecking);
          } else {
            startChecking();
          }
          
          // 存储实例防止重复初始化
          window.ETagAutoRefresh = { 
            started: true,
            currentEtag: null,
            lastCheckTime: null,
            version: '${require('../package.json').version}',
            options: options
          };
        }
      })();
    `;
  }

  private initMonitoring(compilation?: any) {
    if (this.options.quiet !== true) {
      console.log('[ETagAutoRefresh] 初始化监控');
    }

    if (this.checkInterval) {
      if (this.isServer) {
        clearInterval(this.checkInterval as NodeJS.Timeout);
      } else {
        window.clearInterval(this.checkInterval as number);
      }
    }

    if (this.isServer) {
      this.checkInterval = setInterval(() => {
        this.checkResourceEtag(compilation);
      }, this.options.interval);
    }
  }

  private async checkResourceEtag(compilation?: any) {
    if (this.isServer || !this.options.resource) return;

    try {
      // 处理 URL 路径
      const resourcePath = this.options.resource;
      let requestUrl;
      
      if (resourcePath.startsWith('http')) {
        requestUrl = resourcePath;
      } else {
        // 在浏览器环境中，我们使用完整的 URL
        // 在服务器环境中，我们只检查相对路径
        if (!this.isServer && typeof window !== 'undefined') {
          const baseUrl = window.location.origin;
          requestUrl = baseUrl + (resourcePath.startsWith('/') ? resourcePath : '/' + resourcePath);
        } else {
          requestUrl = resourcePath;
        }
      }
      
      if (this.options.quiet !== true) {
        console.log('[ETagAutoRefresh] 检查资源 ETag:', requestUrl);
      }
      
      const response = await fetch(requestUrl, { 
        method: 'HEAD',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      const newEtag = response.headers.get('etag');
      if (!newEtag) {
        if (this.options.quiet !== true) {
          console.warn('[ETagAutoRefresh] 服务器未返回ETag头信息');
        }
        return;
      }
      
      const oldEtag = this.etagMap.get(this.options.resource);
      
      if (oldEtag && newEtag !== oldEtag) {
        if (this.options.quiet !== true) {
          console.log('[ETagAutoRefresh] 检测到资源ETag变化:', {
            resource: this.options.resource,
            oldEtag,
            newEtag
          });
        }
        
        this.etagMap.set(this.options.resource, newEtag);
      }
    } catch (error) {
      if (this.options.quiet !== true) {
        console.error('[ETagAutoRefresh] 检查资源ETag出错:', error);
      }
    }
  }
}

/**
 * 创建ETagAutoRefreshPlugin实例
 */
class ETagAutoRefreshPlugin extends ETagAutoRefresh {
  constructor(options: ETagAutoRefreshOptions = {}) {
    super(options);
    
    // 如果是Vite环境，返回Vite插件
    if (this.isVite) {
      return this.vitePlugin() as any;
    }
    
    return this;
  }
}

// 工厂函数 - 用于Vite环境
function createETagAutoRefresh(options: ETagAutoRefreshOptions = {}): Plugin | ETagAutoRefresh {
  const plugin = new ETagAutoRefresh(options);
  return plugin.isVite ? plugin.vitePlugin() : plugin;
}

// 默认导出插件类
export default ETagAutoRefreshPlugin;

// 命名导出
export { ETagAutoRefresh, createETagAutoRefresh, ETagAutoRefreshPlugin }; 