/**
 * Logging utility for Redash MCP server
 * Provides structured logging with MCP notification support
 */

// Type definitions for log severity levels
export type LogLevel =
  | 'debug'
  | 'info'
  | 'notice'
  | 'warning'
  | 'error'
  | 'critical'
  | 'alert'
  | 'emergency';

// Log level constants for convenience
export const LogLevelValues = {
  DEBUG: 'debug' as const,
  INFO: 'info' as const,
  NOTICE: 'notice' as const,
  WARNING: 'warning' as const,
  ERROR: 'error' as const,
  CRITICAL: 'critical' as const,
  ALERT: 'alert' as const,
  EMERGENCY: 'emergency' as const,
} as const;

interface LoggerState {
  mcpServer: any | null;
}

const state: LoggerState = {
  mcpServer: null,
};

/**
 * Configure MCP server for remote logging
 */
function setServer(server: any): void {
  state.mcpServer = server;
}

/**
 * Format log message with timestamp and level
 */
function formatMessage(level: LogLevel, msg: string): string {
  return `[${level.toUpperCase()}] ${msg}`;
}

/**
 * Send log notification to MCP client if available
 */
function sendNotification(level: LogLevel, msg: string): void {
  if (!state.mcpServer?.notification) {
    return;
  }

  try {
    state.mcpServer.notification({
      method: 'notifications/logging',
      params: {
        level,
        data: msg,
      },
    });
  } catch (error) {
    // Silently fail if notification cannot be sent
    console.error(`Log notification failed: ${error}`);
  }
}

/**
 * Core logging function
 */
function log(level: LogLevel, msg: string): void {
  const formatted = formatMessage(level, msg);
  console.error(formatted);
  sendNotification(level, msg);
}

/**
 * Log debug information
 */
function debug(msg: string): void {
  log('debug', msg);
}

/**
 * Log general information
 */
function info(msg: string): void {
  log('info', msg);
}

/**
 * Log warning messages
 */
function warning(msg: string): void {
  log('warning', msg);
}

/**
 * Log error messages
 */
function error(msg: string): void {
  log('error', msg);
}

// Export logger interface
export const logger = {
  setServer,
  debug,
  info,
  warning,
  error,
  log,
};
