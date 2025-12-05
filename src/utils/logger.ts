export class Logger {
  private context = 'Function Finder';

  log(message: string, ...args: any[]): void {
    console.log(`[${this.context}] ${message}`, ...args);
  }

  info(message: string, ...args: any[]): void {
    console.info(`[${this.context}] INFO: ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.context}] WARN: ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[${this.context}] ERROR: ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    console.debug(`[${this.context}] DEBUG: ${message}`, ...args);
  }
}
