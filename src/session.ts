import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { SessionState, CLIConfig, Classification } from './types';

export class SessionManager {
  private sessionDir: string;
  private sessionFile: string;

  constructor(config: CLIConfig) {
    // Use XDG Base Directory Specification
    const configHome = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
    this.sessionDir = join(configHome, 'file-classifier');

    // Create a session identifier based on sources and categories
    const sessionId = this.generateSessionId(config);
    this.sessionFile = join(this.sessionDir, `${sessionId}.json`);

    // Ensure session directory exists
    if (!existsSync(this.sessionDir)) {
      mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  private generateSessionId(config: CLIConfig): string {
    const sources = [...config.sources].sort().join(',');
    const categories = [...config.categories].sort().join(',');
    const mode = config.mode;

    // Create a hash-like identifier
    const content = `${mode}:${categories}:${sources}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return `session-${Math.abs(hash).toString(16)}`;
  }

  saveSession(sessionState: SessionState): void {
    try {
      // Ensure session directory exists before saving
      if (!existsSync(this.sessionDir)) {
        mkdirSync(this.sessionDir, { recursive: true });
      }

      const data = {
        ...sessionState,
        lastSaved: new Date().toISOString(),
      };

      writeFileSync(this.sessionFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
  }

  loadSession(): SessionState | null {
    try {
      if (!existsSync(this.sessionFile)) {
        return null;
      }

      const data = readFileSync(this.sessionFile, 'utf-8');
      const sessionState = JSON.parse(data) as SessionState;

      // Validate session state
      if (!this.isValidSessionState(sessionState)) {
        console.warn('Invalid session state found, ignoring');
        return null;
      }

      return sessionState;
    } catch (error) {
      console.warn('Failed to load session:', error);
      return null;
    }
  }

  private isValidSessionState(state: any): state is SessionState {
    return (
      state &&
      typeof state === 'object' &&
      state.config &&
      Array.isArray(state.config.categories) &&
      Array.isArray(state.config.sources) &&
      typeof state.currentIndex === 'number' &&
      Array.isArray(state.classifications) &&
      Array.isArray(state.items) &&
      typeof state.totalItems === 'number'
    );
  }

  clearSession(): void {
    try {
      if (existsSync(this.sessionFile)) {
        unlinkSync(this.sessionFile);
        console.log(`Session file cleared: ${this.sessionFile}`);
      } else {
        console.log('No existing session found for these files - nothing to clear');
      }
    } catch (error) {
      console.warn('Failed to clear session:', error);
    }
  }

  clearAllSessions(): void {
    try {
      if (existsSync(this.sessionDir)) {
        const files = readdirSync(this.sessionDir);

        let clearedCount = 0;
        for (const file of files) {
          if (file.startsWith('session-') && file.endsWith('.json')) {
            const filePath = join(this.sessionDir, file);
            unlinkSync(filePath);
            clearedCount++;
          }
        }

        if (clearedCount > 0) {
          console.log(`Cleared ${clearedCount} session file(s)`);
        } else {
          console.log('No session files found to clear');
        }
      }
    } catch (error) {
      console.warn('Failed to clear all sessions:', error);
    }
  }


  getSessionFile(): string {
    return this.sessionFile;
  }

  hasExistingSession(): boolean {
    return existsSync(this.sessionFile);
  }

  mergeClassifications(
    existingClassifications: Classification[],
    newItems: any[]
  ): Classification[] {
    // Filter out classifications for items that no longer exist
    const validItemIds = new Set(newItems.map(item => item.id));

    return existingClassifications.filter(classification =>
      validItemIds.has(classification.itemId)
    );
  }
}