import { describe, it, expect } from 'bun:test';
import { parseArgs } from '../../src/cli';

describe('CLI Argument Parsing', () => {
  it('should parse basic file mode arguments', () => {
    const args = ['file1.txt', 'file2.txt'];
    const config = parseArgs(args);

    expect(config.mode).toBe('file');
    expect(config.sources).toEqual(['file1.txt', 'file2.txt']);
    expect(config.categories).toEqual(['good', 'bad', 'review']);
  });

  it('should parse CSV mode arguments', () => {
    const args = ['--csv', 'data.csv'];
    const config = parseArgs(args);

    expect(config.mode).toBe('csv');
    expect(config.sources).toEqual(['data.csv']);
    expect(config.categories).toEqual(['good', 'bad', 'review']);
  });

  it('should parse custom categories', () => {
    const args = ['--categories', 'spam,ham,unsure', 'file.txt'];
    const config = parseArgs(args);

    expect(config.categories).toEqual(['spam', 'ham', 'unsure']);
    expect(config.sources).toEqual(['file.txt']);
  });

  it('should parse port option', () => {
    const args = ['--port', '8080', 'file.txt'];
    const config = parseArgs(args);

    expect(config.port).toBe(8080);
  });

  it('should parse no-browser option', () => {
    const args = ['--no-browser', 'file.txt'];
    const config = parseArgs(args);

    expect(config.noBrowser).toBe(true);
  });

  it('should validate category count (max 9)', () => {
    const args = ['--categories', 'a,b,c,d,e,f,g,h,i,j', 'file.txt'];

    expect(() => parseArgs(args)).toThrow('Maximum 9 categories allowed');
  });

  it('should require at least one source file', () => {
    const args = ['--categories', 'good,bad'];

    expect(() => parseArgs(args)).toThrow('At least one source file is required');
  });
});