// utils/errorLogger.ts
// Centralized error logging with 5 severity levels and FIFO buffer

import type { ErrorLogEntry, ErrorSeverity } from 'types/index';

const MAX_BUFFER_SIZE = 1000;
const DEFAULT_RECENT_COUNT = 50;

const buffer: ErrorLogEntry[] = [];

/**
 * Log a message at the given severity level.
 */
export function log(
  severity: ErrorSeverity,
  message: string,
  context?: string,
  stack?: string,
): void {
  const entry: ErrorLogEntry = {
    timestamp: Date.now(),
    severity,
    message,
    context,
    stack,
  };

  buffer.push(entry);

  // FIFO eviction when buffer exceeds max
  if (buffer.length > MAX_BUFFER_SIZE) {
    buffer.splice(0, buffer.length - MAX_BUFFER_SIZE);
  }

  // Route to appropriate console method
  const prefix = context ? `[${context}]` : '[Log]';
  switch (severity) {
    case 'fatal':
    case 'error':
      console.error(`${prefix} ${message}`);
      break;
    case 'warning':
      console.warn(`${prefix} ${message}`);
      break;
    case 'info':
    case 'debug':
      console.log(`${prefix} ${message}`);
      break;
  }
}

/**
 * Get recent log entries, optionally filtered by severity.
 */
export function getRecentErrors(
  count: number = DEFAULT_RECENT_COUNT,
  severity?: ErrorSeverity,
): ErrorLogEntry[] {
  let entries = severity
    ? buffer.filter((e) => e.severity === severity)
    : [...buffer];
  return entries.slice(-count);
}

/**
 * Clear all log entries.
 */
export function clearLog(): void {
  buffer.length = 0;
}

/**
 * Get aggregated error statistics.
 */
export function getErrorStats(): {
  total: number;
  bySeverity: Record<ErrorSeverity, number>;
} {
  const bySeverity: Record<ErrorSeverity, number> = {
    fatal: 0,
    error: 0,
    warning: 0,
    info: 0,
    debug: 0,
  };

  for (const entry of buffer) {
    bySeverity[entry.severity]++;
  }

  return { total: buffer.length, bySeverity };
}

// ─── Convenience shortcuts ────────────────────────────────────────────────

export function logFatal(message: string, context?: string, stack?: string): void {
  log('fatal', message, context, stack);
}

export function logError(message: string, context?: string, stack?: string): void {
  log('error', message, context, stack);
}

export function logWarning(message: string, context?: string, stack?: string): void {
  log('warning', message, context, stack);
}

export function logInfo(message: string, context?: string, stack?: string): void {
  log('info', message, context, stack);
}

export function logDebug(message: string, context?: string, stack?: string): void {
  log('debug', message, context, stack);
}
