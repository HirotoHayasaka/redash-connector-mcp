import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../src/logger.js';

describe('logger', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('log levels', () => {
    it('should log debug messages', () => {
      logger.debug('Test debug');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[DEBUG] Test debug');
    });

    it('should log info messages', () => {
      logger.info('Test info');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[INFO] Test info');
    });

    it('should log warning messages', () => {
      logger.warning('Test warning');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[WARNING] Test warning');
    });

    it('should log error messages', () => {
      logger.error('Test error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Test error');
    });
  });

  describe('MCP server integration', () => {
    it('should send notification when server is set', () => {
      const mockServer = {
        notification: vi.fn(),
      };

      logger.setServer(mockServer);
      logger.info('Test with server');

      expect(mockServer.notification).toHaveBeenCalledWith({
        method: 'notifications/logging',
        params: { level: 'info', data: 'Test with server' },
      });
    });

    it('should not throw if notification fails', () => {
      const mockServer = {
        notification: vi.fn(() => {
          throw new Error('Notification failed');
        }),
      };

      logger.setServer(mockServer);
      expect(() => logger.info('Test')).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('[INFO] Test');
    });

    it('should not throw if server is not set', () => {
      logger.setServer(null as any);
      expect(() => logger.info('Test without server')).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('[INFO] Test without server');
    });
  });

  describe('custom log method', () => {
    it('should support custom log level', () => {
      logger.log('custom' as any, 'Custom message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[CUSTOM] Custom message');
    });

    it('should handle empty messages', () => {
      logger.info('');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[INFO] ');
    });

    it('should handle special characters in messages', () => {
      logger.info('Message with "quotes" and \\backslash');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[INFO] Message with "quotes" and \\backslash');
    });

    it('should handle multiline messages', () => {
      logger.info('Line 1\\nLine 2');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[INFO] Line 1\\nLine 2');
    });
  });
});
