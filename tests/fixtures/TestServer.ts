import { createServer } from '../../src/server';
import { CLIConfig, SessionState } from '../../src/types';
import { join } from 'path';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';

export interface TestData {
  files: string[];
  tempDir: string;
  cleanup: () => Promise<void>;
}

export class TestServer {
  private server: any;
  private testData: TestData | null = null;
  public url: string = '';

  async start(config?: Partial<CLIConfig>): Promise<string> {
    this.testData = await this.setupTestData();

    const defaultConfig: CLIConfig = {
      mode: 'file',
      categories: ['good', 'bad', 'review'],
      sources: this.testData.files,
      port: 0, // Random port to avoid conflicts
    };

    const finalConfig = { ...defaultConfig, ...config };

    this.server = await createServer(finalConfig);
    this.url = `http://localhost:${this.server.port}`;

    return this.url;
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.stop();
      this.server = null;
    }
    if (this.testData) {
      await this.testData.cleanup();
      this.testData = null;
    }
  }

  private async setupTestData(): Promise<TestData> {
    const tempDir = join(tmpdir(), `web-classifier-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);

    // Ensure temp directory exists
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // Create test files
    const testFile1 = join(tempDir, 'test1.txt');
    const testFile2 = join(tempDir, 'test2.txt');
    const testCsv = join(tempDir, 'test.csv');

    writeFileSync(testFile1, 'This is test content for file 1\nWith multiple lines');
    writeFileSync(testFile2, 'Different content for file 2\nAlso multiple lines');
    writeFileSync(testCsv, 'id,content,category\n1,"Sample text 1",\n2,"Sample text 2",\n3,"Sample text 3",');

    const files = [testFile1, testFile2];

    return {
      files,
      tempDir,
      cleanup: async () => {
        try {
          if (existsSync(tempDir)) {
            rmSync(tempDir, { recursive: true, force: true });
          }
        } catch (error) {
          console.warn('Failed to cleanup test directory:', error);
        }
      }
    };
  }

  // Helper method to get current session state
  async getState(): Promise<SessionState> {
    const response = await fetch(`${this.url}/api/state`);
    const data = await response.json();
    return data.data;
  }

  // Helper method to classify an item
  async classify(itemIndex: number, category: number): Promise<any> {
    const response = await fetch(`${this.url}/api/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemIndex, category }),
    });
    return response.json();
  }
}