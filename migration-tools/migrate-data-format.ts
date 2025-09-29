#!/usr/bin/env bun
/**
 * Migration tool to add "line" field to existing classification data files
 *
 * This tool migrates existing SessionState files to include a "line" field in ClassificationItem:
 * - Files: line = 0 (since file content is treated as single unit)
 * - CSV: line = zero-indexed row number for the CSV record
 *
 * Usage: bun migration-tools/migrate-data-format.ts <data-file-or-directory>
 */

import { readFileSync, writeFileSync, statSync, readdirSync } from 'fs';
import { basename, extname, join } from 'path';

// Legacy interfaces (before migration)
interface LegacyClassificationItem {
  id: string;
  content: string;
  filename?: string;
  lineNumbers?: number[];
  csvRow?: Record<string, string>;
}

interface LegacySessionState {
  config: any;
  currentIndex: number;
  classifications: any[];
  items: LegacyClassificationItem[];
  totalItems: number;
  startTime: string;
}

// New interfaces (after migration)
interface NewClassificationItem {
  id: string;
  content: string;
  filename?: string;
  lineNumbers?: number[];
  csvRow?: Record<string, string>;
  line: number; // NEW FIELD
}

interface NewSessionState {
  config: any;
  currentIndex: number;
  classifications: any[];
  items: NewClassificationItem[];
  totalItems: number;
  startTime: string;
}

function migrateClassificationItem(item: LegacyClassificationItem): NewClassificationItem {
  // Extract line number from item ID or default based on mode
  let line = 0;

  if (item.csvRow) {
    // CSV mode: extract row number from ID pattern "filepath:row:N"
    const match = item.id.match(/:row:(\d+)$/);
    if (match) {
      line = parseInt(match[1]); // Use 1-based indexing for CSV (matches spreadsheet conventions)
    }
  } else {
    // File mode: always 0 (entire file content)
    line = 0;
  }

  return {
    ...item,
    line
  };
}

function migrateSessionState(legacyState: LegacySessionState): NewSessionState {
  return {
    ...legacyState,
    items: legacyState.items.map(migrateClassificationItem)
  };
}

function isSessionStateFile(filePath: string): boolean {
  const filename = basename(filePath);
  return filename.startsWith('session-') && filename.endsWith('.json');
}

function migrateFile(filePath: string): void {
  try {
    console.log(`Migrating: ${filePath}`);

    const content = readFileSync(filePath, 'utf-8');
    const legacyState: LegacySessionState = JSON.parse(content);

    // Check if already migrated
    if (legacyState.items.length > 0 && 'line' in legacyState.items[0]) {
      console.log(`  ✓ Already migrated, skipping`);
      return;
    }

    const newState = migrateSessionState(legacyState);

    // Backup original file
    const backupPath = filePath + '.backup';
    writeFileSync(backupPath, content, 'utf-8');
    console.log(`  📦 Backup created: ${backupPath}`);

    // Write migrated file
    writeFileSync(filePath, JSON.stringify(newState, null, 2), 'utf-8');
    console.log(`  ✅ Migrated ${newState.items.length} items`);

    // Show sample of migrated items
    newState.items.slice(0, 3).forEach((item, i) => {
      const mode = item.csvRow ? 'CSV' : 'File';
      console.log(`    Item ${i + 1}: ${mode} mode, line=${item.line}, id=${item.id.substring(0, 50)}...`);
    });

  } catch (error) {
    console.error(`  ❌ Failed to migrate ${filePath}:`, error);
  }
}

function migrateDirectory(dirPath: string): void {
  console.log(`Scanning directory: ${dirPath}`);

  const files = readdirSync(dirPath);
  const sessionFiles = files.filter(f => isSessionStateFile(f));

  console.log(`Found ${sessionFiles.length} session state files`);

  for (const file of sessionFiles) {
    migrateFile(join(dirPath, file));
  }
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length !== 1) {
    console.error('Usage: bun migrate-data-format.ts <data-file-or-directory>');
    console.error('');
    console.error('Examples:');
    console.error('  bun migrate-data-format.ts session-abc123.json');
    console.error('  bun migrate-data-format.ts ~/.config/file-classifier/');
    process.exit(1);
  }

  const target = args[0];

  try {
    const stat = statSync(target);

    if (stat.isFile()) {
      if (!isSessionStateFile(target)) {
        console.error(`Error: ${target} is not a session state file`);
        process.exit(1);
      }
      migrateFile(target);
    } else if (stat.isDirectory()) {
      migrateDirectory(target);
    } else {
      console.error(`Error: ${target} is neither a file nor a directory`);
      process.exit(1);
    }

    console.log('\n🎉 Migration completed!');

  } catch (error) {
    console.error(`Error accessing ${target}:`, error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}