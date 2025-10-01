import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { SessionManager } from '../../src/session';
import { CLIConfig, SessionState } from '../../src/types';
import { existsSync, rmSync } from 'fs';

describe('Session Management', () => {
  let sessionManager: SessionManager;
  let testConfig: CLIConfig;

  beforeEach(() => {
    testConfig = {
      mode: 'file',
      categories: ['good', 'bad', 'test'],
      sources: ['test1.txt', 'test2.txt'],
    };

    sessionManager = new SessionManager(testConfig);
  });

  afterEach(() => {
    // Clean up test sessions
    const sessionFile = sessionManager.getSessionFile();
    if (existsSync(sessionFile)) {
      rmSync(sessionFile, { force: true });
    }
  });

  it('should generate consistent session IDs', () => {
    const sessionManager2 = new SessionManager(testConfig);
    expect(sessionManager.getSessionFile()).toBe(sessionManager2.getSessionFile());
  });

  it('should save and load session state', () => {
    const sessionState: SessionState = {
      config: testConfig,
      currentIndex: 5,
      classifications: [
        {
          itemId: 'test-item-1',
          category: 1,
          categoryName: 'good',
          timestamp: new Date().toISOString(),
        },
      ],
      items: [],
      totalItems: 10,
      startTime: new Date().toISOString(),
    };

    sessionManager.saveSession(sessionState);

    const loaded = sessionManager.loadSession();
    expect(loaded).not.toBeNull();
    expect(loaded?.currentIndex).toBe(5);
    expect(loaded?.classifications).toHaveLength(1);
    expect(loaded?.classifications[0].categoryName).toBe('good');
  });

  it('should return null for non-existent session', () => {
    const loaded = sessionManager.loadSession();
    expect(loaded).toBeNull();
  });

  it('should filter invalid classifications when merging', () => {
    const existingClassifications = [
      {
        itemId: 'valid-item',
        category: 1,
        categoryName: 'good',
        timestamp: new Date().toISOString(),
      },
      {
        itemId: 'invalid-item',
        category: 2,
        categoryName: 'bad',
        timestamp: new Date().toISOString(),
      },
    ];

    const newItems = [
      { id: 'valid-item', content: 'test' },
    ];

    const merged = sessionManager.mergeClassifications(existingClassifications, newItems);

    expect(merged).toHaveLength(1);
    expect(merged[0].itemId).toBe('valid-item');
  });

  it('should detect existing sessions', () => {
    expect(sessionManager.hasExistingSession()).toBe(false);

    sessionManager.saveSession({
      config: testConfig,
      currentIndex: 0,
      classifications: [],
      items: [],
      totalItems: 0,
      startTime: new Date().toISOString(),
    });

    expect(sessionManager.hasExistingSession()).toBe(true);
  });
});