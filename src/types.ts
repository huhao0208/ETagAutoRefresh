export interface NotificationStyles {
  container: Partial<CSSStyleDeclaration>;
  button: Partial<CSSStyleDeclaration>;
  template: string;
}

export interface EnvironmentConfig {
  enabled: boolean;
  interval: number;
  quiet: boolean;
}

export interface PluginOptions {
  resource: string;
  env: {
    development: EnvironmentConfig;
    production: EnvironmentConfig;
  };
  notification: NotificationStyles;
}

export interface Compiler {
  options: {
    mode: 'development' | 'production';
  };
  hooks: {
    done: {
      tap: (name: string, callback: () => void) => void;
    };
    compilation: {
      tap: (name: string, callback: (compilation: any) => void) => void;
    };
  };
}

export interface Compilation {
  hooks: {
    htmlWebpackPluginAfterHtmlProcessing: {
      tap: (name: string, callback: (data: { html: string }) => void) => void;
    };
  };
}

export interface NotificationStyle {
  container?: {
    position?: string;
    bottom?: string;
    right?: string;
    padding?: string;
    background?: string;
    color?: string;
    borderRadius?: string;
    boxShadow?: string;
    zIndex?: string;
    animation?: string;
    [key: string]: string | undefined;
  };
  button?: {
    marginTop?: string;
    padding?: string;
    background?: string;
    color?: string;
    border?: string;
    borderRadius?: string;
    cursor?: string;
    [key: string]: string | undefined;
  };
  template?: string;
}

export interface ETagAutoRefreshOptions {
  resource?: string;
  interval?: number;
  quiet?: boolean;
  notification?: NotificationStyle;
}

// 更新 Window 接口扩展
declare global {
  interface Window {
    ETagAutoRefresh?: {
      started: boolean;
      currentEtag: string | null;
      lastCheckTime: number | null;
      version: string;
      options: {
        resource: string;
        interval: number;
        quiet: boolean;
      };
    };
  }
  
  namespace ETagAutoRefreshPlugin {
    type Options = ETagAutoRefreshOptions;
  }
}

export type { ETagAutoRefreshOptions as ETagAutoRefreshPlugin }; 