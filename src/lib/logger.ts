// Centralized logging utility for the application

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development';

    private formatMessage(level: LogLevel, category: string, message: string, context?: LogContext) {
        return {
            level,
            category,
            message,
            context,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
        };
    }

    info(category: string, message: string, context?: LogContext) {
        const formatted = this.formatMessage('info', category, message, context);
        console.log(`[${formatted.level.toUpperCase()}] [${category}]:`, message, context || '');

        if (this.isDevelopment) {
            console.log('Full context:', formatted);
        }
    }

    warn(category: string, message: string, context?: LogContext) {
        const formatted = this.formatMessage('warn', category, message, context);
        console.warn(`[${formatted.level.toUpperCase()}] [${category}]:`, message, context || '');

        if (this.isDevelopment) {
            console.warn('Full context:', formatted);
        }
    }

    error(category: string, error: Error | string, context?: LogContext) {
        const message = error instanceof Error ? error.message : error;
        const formatted = this.formatMessage('error', category, message, {
            ...context,
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : undefined,
        });

        console.error(`[${formatted.level.toUpperCase()}] [${category}]:`, message);
        console.error('Error details:', formatted);
    }

    debug(category: string, message: string, context?: LogContext) {
        if (!this.isDevelopment) return;

        const formatted = this.formatMessage('debug', category, message, context);
        console.debug(`[${formatted.level.toUpperCase()}] [${category}]:`, message, context || '');
    }

    // Log API requests
    apiRequest(method: string, endpoint: string, context?: LogContext) {
        this.info('API Request', `${method} ${endpoint}`, context);
    }

    // Log API responses
    apiResponse(method: string, endpoint: string, status: number, context?: LogContext) {
        const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
        this[level]('API Response', `${method} ${endpoint} - ${status}`, context);
    }

    // Log database operations
    dbOperation(operation: string, table: string, context?: LogContext) {
        this.info('Database', `${operation} on ${table}`, context);
    }

    // Log authentication events
    auth(event: string, context?: LogContext) {
        this.info('Authentication', event, context);
    }

    // Log payment events
    payment(event: string, context?: LogContext) {
        this.info('Payment', event, context);
    }

    // Log file operations
    file(operation: string, context?: LogContext) {
        this.info('File Operation', operation, context);
    }
}

// Export singleton instance
export const logger = new Logger();

// Export specific loggers for different modules
export const authLogger = {
    info: (message: string, context?: LogContext) => logger.auth(message, context),
    error: (error: Error | string, context?: LogContext) => logger.error('Authentication', error, context),
    warn: (message: string, context?: LogContext) => logger.warn('Authentication', message, context),
};

export const dbLogger = {
    operation: (operation: string, table: string, context?: LogContext) =>
        logger.dbOperation(operation, table, context),
    error: (error: Error | string, context?: LogContext) => logger.error('Database', error, context),
};

export const paymentLogger = {
    info: (message: string, context?: LogContext) => logger.payment(message, context),
    error: (error: Error | string, context?: LogContext) => logger.error('Payment', error, context),
};

export const fileLogger = {
    info: (operation: string, context?: LogContext) => logger.file(operation, context),
    error: (error: Error | string, context?: LogContext) => logger.error('File Operation', error, context),
};
