import { describe, it, expect } from 'bun:test';
import { FileProcessor } from '../../src/processor';
import { CLIConfig } from '../../src/types';
import { join } from 'path';

describe('File Processor', () => {
  const fixturesDir = join(import.meta.dir, '../fixtures');

  it('should process text files', async () => {
    const config: CLIConfig = {
      mode: 'file',
      categories: ['good', 'bad'],
      sources: [join(fixturesDir, 'test.txt')],
    };

    const items = await FileProcessor.processFiles(config);

    expect(items).toHaveLength(1);
    expect(items[0].filename).toBe('test.txt');
    expect(items[0].content).toContain('This is a test file');
  });

  it('should process CSV files', async () => {
    const config: CLIConfig = {
      mode: 'csv',
      categories: ['spam', 'ham'],
      sources: [join(fixturesDir, 'test.csv')],
    };

    const items = await FileProcessor.processFiles(config);

    expect(items).toHaveLength(3); // 3 data rows in test.csv
    expect(items[0].csvRow?.name).toBe('John Doe');
    expect(items[0].csvRow?.email).toBe('john@example.com');
    expect(items[0].content).toContain('name   : John Doe');
  });

  it('should throw error for non-existent files', async () => {
    const config: CLIConfig = {
      mode: 'file',
      categories: ['good', 'bad'],
      sources: ['non-existent.txt'],
    };

    expect(FileProcessor.processFiles(config)).rejects.toThrow('File not found');
  });

  it('should handle multiple files', async () => {
    const config: CLIConfig = {
      mode: 'file',
      categories: ['good', 'bad'],
      sources: [
        join(fixturesDir, 'test.txt'),
        join(fixturesDir, 'test.csv'), // Will be processed as text file
      ],
    };

    const items = await FileProcessor.processFiles(config);

    expect(items).toHaveLength(2);
    expect(items[0].filename).toBe('test.txt');
    expect(items[1].filename).toBe('test.csv');
  });
});