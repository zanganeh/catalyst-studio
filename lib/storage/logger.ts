export class Logger {
  private static isDevelopment = process.env.NODE_ENV === 'development';

  static log(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(message, ...args);
    }
  }

  static warn(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.warn(message, ...args);
    }
  }

  static error(message: string, ...args: any[]): void {
    // Always log errors
    console.error(message, ...args);
  }

  static debug(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.debug(message, ...args);
    }
  }
}