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