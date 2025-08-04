interface Logger {
 info: (message: string, ...args: any[]) => void;
 warn: (message: string, ...args: any[]) => void;
 error: (message: string, ...args: any[]) => void;
 debug: (message: string, ...args: any[]) => void;
}

const createLogger = (): Logger => {
 const log = (level: string, message: string, ...args: any[]) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  switch (level) {
   case 'error':
    console.error(logMessage, ...args);
    break;
   case 'warn':
    console.warn(logMessage, ...args);
    break;
   case 'debug':
    if (process.env.NODE_ENV === 'development') {
     console.log(logMessage, ...args);
    }
    break;
   default:
    console.log(logMessage, ...args);
  }
 };

 return {
  info: (message: string, ...args: any[]) => log('info', message, ...args),
  warn: (message: string, ...args: any[]) => log('warn', message, ...args),
  error: (message: string, ...args: any[]) => log('error', message, ...args),
  debug: (message: string, ...args: any[]) => log('debug', message, ...args),
 };
};

export const logger = createLogger();
