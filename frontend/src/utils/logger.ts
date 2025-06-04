type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
}

class LoggerService {
  private config: LoggerConfig = {
    level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    enableConsole: process.env.NODE_ENV !== 'production'
  };

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const configLevelIndex = levels.indexOf(this.config.level);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= configLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 
      ? args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ')
      : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs ? ' ' + formattedArgs : ''}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug') && this.config.enableConsole) {
      // eslint-disable-next-line no-console
      console.debug(this.formatMessage('debug', message, args));
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info') && this.config.enableConsole) {
      // eslint-disable-next-line no-console
      console.info(this.formatMessage('info', message, args));
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn') && this.config.enableConsole) {
      // eslint-disable-next-line no-console
      console.warn(this.formatMessage('warn', message, args));
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      if (this.config.enableConsole) {
        // eslint-disable-next-line no-console
        console.error(this.formatMessage('error', message, args));
      }
      // TODO: In production, we could send errors to an error tracking service
      // like Sentry or store them in a database
    }
  }

  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const Logger = new LoggerService(); 