const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom format for development (human-readable)
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
});

// Create logs directory path
const logsDir = path.join(__dirname, '..', 'logs');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    defaultMeta: { service: 'rms-kebele' },
    transports: [
        // Console transport (always active)
        new winston.transports.Console({
            format: combine(
                colorize(),
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                devFormat
            )
        }),
        // File transport for errors
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: combine(timestamp(), json()),
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5
        }),
        // File transport for all logs
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: combine(timestamp(), json()),
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5
        })
    ]
});

// Disable file logging in test environment to keep tests clean
if (process.env.NODE_ENV === 'test') {
    logger.transports.forEach(t => {
        if (t instanceof winston.transports.File) {
            t.silent = true;
        }
    });
}

module.exports = logger;
