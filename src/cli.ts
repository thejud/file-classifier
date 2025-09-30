#!/usr/bin/env bun
import { CLIConfig } from './types';

export function parseArgs(args: string[]): CLIConfig {
  const config: CLIConfig = {
    mode: 'file',
    categories: ['good', 'bad', 'review'],
    sources: [],
    noBrowser: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    switch (arg) {
      case '--csv':
      case '-c':
        config.mode = 'csv';
        break;

      case '--categories':
        i++;
        if (i >= args.length) {
          throw new Error('--categories requires a value');
        }
        const categoriesStr = args[i];
        const categories = categoriesStr.split(',').map(c => c.trim()).filter(c => c.length > 0);

        if (categories.length === 0) {
          throw new Error('At least one category is required');
        }
        if (categories.length > 9) {
          throw new Error('Maximum 9 categories allowed');
        }

        config.categories = categories;
        break;

      case '--columns':
        i++;
        if (i >= args.length) {
          throw new Error('--columns requires a value');
        }
        const columnsStr = args[i];
        const columns = columnsStr.split(',').map(c => c.trim()).filter(c => c.length > 0);

        if (columns.length === 0) {
          throw new Error('At least one column is required');
        }

        config.columns = columns;
        break;

      case '--port':
        i++;
        if (i >= args.length) {
          throw new Error('--port requires a value');
        }
        const port = parseInt(args[i], 10);
        if (isNaN(port) || port < 1 || port > 65535) {
          throw new Error('Invalid port number');
        }
        config.port = port;
        break;

      case '--no-browser':
        config.noBrowser = true;
        break;

      case '--reset':
        config.reset = true;
        break;

      default:
        if (arg.startsWith('--')) {
          throw new Error(`Unknown option: ${arg}`);
        }
        config.sources.push(arg);
        break;
    }
    i++;
  }

  if (config.sources.length === 0) {
    throw new Error('At least one source file is required');
  }

  return config;
}

function printUsage() {
  console.log(`
Usage: file-classifier [options] <files...>

Options:
  --csv, -c                        CSV mode (otherwise file mode)
  --categories "cat1,cat2"         Custom categories (comma-separated, 1-9 max)
  --columns "col1,col2"            CSV column subset (default: all columns)
  --port <number>                  Specific port (default: random)
  --no-browser                     Don't auto-launch browser
  --reset                          Clear previous classifications and comments for specified files
  --version, -v                    Show version number
  --help, -h                       Show this help message

Examples:
  file-classifier file1.txt file2.txt
  file-classifier --csv data.csv
  file-classifier --csv --columns "Detection Name,uuid,message" data.csv
  file-classifier --categories "spam,ham,unsure" *.txt
  file-classifier -c "bug,feature,question" --csv data.csv
  file-classifier --reset file1.txt file2.txt
`);
}

async function main() {
  try {
    const args = process.argv.slice(2);

    // Handle --version flag
    if (args.includes('--version') || args.includes('-v')) {
      console.log('0.2.0');
      process.exit(0);
    }

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
      printUsage();
      process.exit(0);
    }

    const config = parseArgs(args);

    // Handle reset option
    if (config.reset) {
      console.log('Reset option detected - clearing classification data for specified files...');
      const { SessionManager } = await import('./session');
      const sessionManager = new SessionManager(config);
      sessionManager.clearSession();
      console.log('Classification data cleared for specified files!');
      return;
    }

    console.log('Starting file classifier...');
    console.log(`Mode: ${config.mode}`);
    console.log(`Categories: ${config.categories.join(', ')}`);
    console.log(`Sources: ${config.sources.join(', ')}`);

    // Start the server
    const { createServer } = await import('./server');
    const server = await createServer(config);

    console.log(`Server started at ${server.url}`);

    // Launch browser if not disabled
    if (!config.noBrowser) {
      await launchBrowser(server.url);
    }

    console.log('Press Ctrl+C to stop the server');

    // Handle graceful shutdown
    const cleanup = () => {
      console.log('\nShutting down server...');
      server.stop();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function launchBrowser(url: string) {
  try {
    const { spawn } = await import('child_process');

    // macOS
    if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true });
    }
    // Windows
    else if (process.platform === 'win32') {
      spawn('start', [url], { shell: true, detached: true });
    }
    // Linux
    else {
      spawn('xdg-open', [url], { detached: true });
    }

    console.log('Opening browser...');
  } catch (error) {
    console.log(`Browser launch failed. Please open ${url} manually.`);
  }
}

if (import.meta.main) {
  main();
}