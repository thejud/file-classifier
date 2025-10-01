import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { TestServer } from '../fixtures/TestServer';
import { CLIConfig } from '../../src/types';

describe('HTTP Server', () => {
  let testServer: TestServer;
  let baseUrl: string;

  beforeAll(async () => {
    testServer = new TestServer();
    baseUrl = await testServer.start();
  });

  afterAll(async () => {
    if (testServer) {
      await testServer.stop();
    }
  });

  it('should serve static files', async () => {
    const response = await fetch(`${baseUrl}/`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
  });

  it('should return session state', async () => {
    const response = await fetch(`${baseUrl}/api/state`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Categories should preserve original order for keyboard shortcuts
    expect(data.data.config.categories).toEqual(['good', 'bad', 'review']);
  });

  it('should handle classification requests', async () => {
    const response = await fetch(`${baseUrl}/api/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemIndex: 0, category: 1 }),
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should return 404 for unknown routes', async () => {
    const response = await fetch(`${baseUrl}/unknown`);
    expect(response.status).toBe(404);
  });
});