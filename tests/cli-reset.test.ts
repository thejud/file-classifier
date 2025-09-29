import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { parseArgs } from '../src/cli';
import { SessionManager } from '../src/session';
import { CLIConfig } from '../src/types';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('CLI Reset Functionality', () => {
  let tempDir: string;
  let testFile: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `cli-reset-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    mkdirSync(tempDir, { recursive: true });
    testFile = join(tempDir, 'test.txt');
    writeFileSync(testFile, 'test content');
  });

  afterEach(() => {
    try {
      const { rmSync } = require('fs');
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should parse reset option correctly', () => {
    const args = ['--reset', 'file.txt'];
    const config = parseArgs(args);

    expect(config.reset).toBe(true);
    expect(config.sources).toEqual(['file.txt']);
  });

  it('should parse reset with other options', () => {
    const args = ['--reset', '--csv', '--categories', 'a,b,c', 'data.csv'];
    const config = parseArgs(args);

    expect(config.reset).toBe(true);
    expect(config.mode).toBe('csv');
    expect(config.categories).toEqual(['a', 'b', 'c']);
    expect(config.sources).toEqual(['data.csv']);
  });

  it('should create session-specific reset behavior', () => {
    const config1: CLIConfig = {
      mode: 'file',
      categories: ['good', 'bad'],
      sources: [testFile],
      reset: true,
    };

    const config2: CLIConfig = {
      mode: 'csv',
      categories: ['good', 'bad'],
      sources: [testFile],
      reset: true,
    };

    const sessionManager1 = new SessionManager(config1);
    const sessionManager2 = new SessionManager(config2);

    // Different configs should generate different session files
    expect(sessionManager1.getSessionFile()).not.toBe(sessionManager2.getSessionFile());
  });

  it('should handle reset when no session exists', () => {
    const config: CLIConfig = {
      mode: 'file',
      categories: ['good', 'bad'],
      sources: [testFile],
      reset: true,
    };

    const sessionManager = new SessionManager(config);

    // Should not throw error when clearing non-existent session
    expect(() => sessionManager.clearSession()).not.toThrow();
    expect(sessionManager.hasExistingSession()).toBe(false);
  });
});