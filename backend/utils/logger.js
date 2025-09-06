const fs = require('fs');
const path = require('path');
const os = require('os');

let logger = console;

// Prefer winston if present (non-fatal if not installed)
let createWinstonLogger = null;
try {
  const { createLogger, format, transports } = require('winston');
  createWinstonLogger = (opts) => createLogger(opts);
  var winstonFormat = format;
  var winstonTransports = transports;
} catch (e) {
  // winston not available — we'll use console fallback
  createWinstonLogger = null;
}

const isLambda = !!process.env.LAMBDA_TASK_ROOT;
const envLogDir = process.env.LOG_DIR || '';
const defaultLogDir = isLambda ? path.join(os.tmpdir(), 'backend', 'logs') : path.join(__dirname, '..', 'logs');
const logsDir = envLogDir || defaultLogDir;

let useFileTransport = false;
let fileTransportOptions = {};
try {
  // Try to create the directory (recursive so intermediate dirs don't fail)
  fs.mkdirSync(logsDir, { recursive: true });
  useFileTransport = true;
  fileTransportOptions.filename = path.join(logsDir, 'app.log');
} catch (err) {
  // Fall back to console logging — do not let this crash the process
  console.warn(`[logger] Could not create log directory "${logsDir}", falling back to console. Error: ${err && err.message}`);
  useFileTransport = false;
}

if (createWinstonLogger) {
  // Build transports array conditionally
  const t = [];
  if (useFileTransport) {
    t.push(new winstonTransports.File({ filename: fileTransportOptions.filename, level: process.env.LOG_LEVEL || 'info' }));
  }
  t.push(new winstonTransports.Console({ level: process.env.LOG_LEVEL || 'info' }));

  logger = createWinstonLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winstonFormat.combine(
      winstonFormat.timestamp(),
      winstonFormat.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} ${level}: ${message}${metaStr}`;
      })
    ),
    transports: t
  });
} else {
  // Simple console wrapper with same methods used commonly
  const wrap = (level) => (...args) => {
    const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
    console[level](`${new Date().toISOString()} ${level.toUpperCase()}: ${msg}`);
  };
  logger = {
    error: wrap('error'),
    warn: wrap('warn'),
    info: wrap('log'),
    debug: wrap('log')
  };
}

module.exports = logger;