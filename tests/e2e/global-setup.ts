import { rm } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

async function globalSetup() {
  // Clean up any existing session files before running tests
  const sessionDir = join(homedir(), '.config', 'file-classifier');

  try {
    // Remove all session files
    await rm(sessionDir, { recursive: true, force: true });
    console.log('Cleaned up session directory:', sessionDir);
  } catch (error) {
    // Directory might not exist, which is fine
    console.log('No existing session directory to clean');
  }
}

export default globalSetup;