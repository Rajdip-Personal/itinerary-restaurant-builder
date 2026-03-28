// __tests__/utils/errorLogger.test.ts
// Tests for centralized error logging with severity levels

import {
  log,
  logFatal,
  logError,
  logWarning,
  logInfo,
  logDebug,
  getRecentErrors,
  clearLog,
  getErrorStats,
} from 'utils/errorLogger';
import { MOCK_ERROR_ENTRIES } from '__tests__/fixtures/index';
import type { ErrorSeverity } from 'types/index';

beforeEach(() => {
  clearLog();
});

describe('log', () => {
  it('stores a log entry with correct severity and message', () => {
    log('error', 'Something failed', 'testContext');
    const entries = getRecentErrors();
    expect(entries).toHaveLength(1);
    expect(entries[0].severity).toBe('error');
    expect(entries[0].message).toBe('Something failed');
    expect(entries[0].context).toBe('testContext');
  });

  it('adds timestamp to each entry', () => {
    log('info', 'Test message');
    const entries = getRecentErrors();
    expect(entries[0].timestamp).toBeGreaterThan(0);
  });

  it('stores optional stack trace', () => {
    log('fatal', 'Crash', 'ctx', 'Error: stack trace here');
    const entries = getRecentErrors();
    expect(entries[0].stack).toBe('Error: stack trace here');
  });

  it('uses console.error for fatal severity', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    log('fatal', 'Fatal crash');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('uses console.error for error severity', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    log('error', 'An error');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('uses console.warn for warning severity', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation();
    log('warning', 'A warning');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('uses console.log for info severity', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    log('info', 'An info');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('uses console.log for debug severity', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    log('debug', 'Debug msg');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('FIFO buffer limit', () => {
  it('evicts oldest entries when buffer exceeds 1000', () => {
    for (let i = 0; i < 1005; i++) {
      log('debug', `Entry ${i}`);
    }
    const entries = getRecentErrors(1005);
    expect(entries.length).toBeLessThanOrEqual(1000);
    // Oldest entries should be evicted — entry 0-4 gone, entry 5+ present
    expect(entries[0].message).toBe('Entry 5');
  });
});

describe('getRecentErrors', () => {
  it('returns last N entries (default 50)', () => {
    for (let i = 0; i < 60; i++) {
      log('info', `Entry ${i}`);
    }
    const entries = getRecentErrors();
    expect(entries).toHaveLength(50);
    // Should be most recent 50
    expect(entries[entries.length - 1].message).toBe('Entry 59');
  });

  it('filters by severity', () => {
    log('error', 'Error 1');
    log('info', 'Info 1');
    log('error', 'Error 2');
    log('debug', 'Debug 1');

    const errors = getRecentErrors(50, 'error');
    expect(errors).toHaveLength(2);
    expect(errors.every((e) => e.severity === 'error')).toBe(true);
  });

  it('returns empty array when no entries match severity', () => {
    log('info', 'Info only');
    const fatals = getRecentErrors(50, 'fatal');
    expect(fatals).toHaveLength(0);
  });
});

describe('clearLog', () => {
  it('removes all entries', () => {
    log('error', 'Error 1');
    log('info', 'Info 1');
    clearLog();
    expect(getRecentErrors()).toHaveLength(0);
  });
});

describe('getErrorStats', () => {
  it('returns correct counts by severity', () => {
    log('fatal', 'F1');
    log('error', 'E1');
    log('error', 'E2');
    log('warning', 'W1');
    log('info', 'I1');
    log('debug', 'D1');

    const stats = getErrorStats();
    expect(stats.total).toBe(6);
    expect(stats.bySeverity.fatal).toBe(1);
    expect(stats.bySeverity.error).toBe(2);
    expect(stats.bySeverity.warning).toBe(1);
    expect(stats.bySeverity.info).toBe(1);
    expect(stats.bySeverity.debug).toBe(1);
  });

  it('returns zeros when log is empty', () => {
    const stats = getErrorStats();
    expect(stats.total).toBe(0);
    expect(stats.bySeverity.fatal).toBe(0);
  });
});

describe('helper shortcuts', () => {
  it('logFatal logs with fatal severity', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    logFatal('Fatal message', 'ctx');
    const entries = getRecentErrors();
    expect(entries[0].severity).toBe('fatal');
    spy.mockRestore();
  });

  it('logError logs with error severity', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    logError('Error message');
    const entries = getRecentErrors();
    expect(entries[0].severity).toBe('error');
    spy.mockRestore();
  });

  it('logWarning logs with warning severity', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation();
    logWarning('Warning message');
    const entries = getRecentErrors();
    expect(entries[0].severity).toBe('warning');
    spy.mockRestore();
  });

  it('logInfo logs with info severity', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    logInfo('Info message');
    const entries = getRecentErrors();
    expect(entries[0].severity).toBe('info');
    spy.mockRestore();
  });

  it('logDebug logs with debug severity', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    logDebug('Debug message');
    const entries = getRecentErrors();
    expect(entries[0].severity).toBe('debug');
    spy.mockRestore();
  });
});
