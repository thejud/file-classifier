#!/usr/bin/env node
/**
 * Migration tool to add "line" field to existing classification data files
 *
 * This tool migrates existing SessionState files to include a "line" field in ClassificationItem:
 * - Files: line = 0 (since file content is treated as single unit)
 * - CSV: line = zero-indexed row number for the CSV record
 *
 * Usage: node migration-tools/migrate-data-format.js <data-file-or-directory>
 */

const fs = require('fs');
const path = require('path');

function migrateClassificationItem(item) {
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

function migrateSessionState(legacyState) {
  return {
    ...legacyState,
    items: legacyState.items.map(migrateClassificationItem)
  };
}

function isSessionStateFile(filePath) {
  const filename = path.basename(filePath);
  return filename.startsWith('session-') && filename.endsWith('.json');
}

function migrateFile(filePath) {
  try {
    console.log(`Migrating: ${filePath}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const legacyState = JSON.parse(content);

    // Check if already migrated
    if (legacyState.items.length > 0 && 'line' in legacyState.items[0]) {
      console.log(`  ✓ Already migrated, skipping`);
      return;
    }

    const newState = migrateSessionState(legacyState);

    // Backup original file
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, content, 'utf-8');
    console.log(`  📦 Backup created: ${backupPath}`);

    // Write migrated file
    fs.writeFileSync(filePath, JSON.stringify(newState, null, 2), 'utf-8');
    console.log(`  ✅ Migrated ${newState.items.length} items`);

    // Show sample of migrated items
    newState.items.slice(0, 3).forEach((item, i) => {
      const mode = item.csvRow ? 'CSV' : 'File';
      console.log(`    Item ${i + 1}: ${mode} mode, line=${item.line}, id=${item.id.substring(0, 50)}...`);
    });

  } catch (error) {
    console.error(`  ❌ Failed to migrate ${filePath}:`, error.message);
  }
}

function migrateDirectory(dirPath) {
  console.log(`Scanning directory: ${dirPath}`);

  const files = fs.readdirSync(dirPath);
  const sessionFiles = files.filter(f => isSessionStateFile(f));

  console.log(`Found ${sessionFiles.length} session state files`);

  for (const file of sessionFiles) {
    migrateFile(path.join(dirPath, file));
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length !== 1) {
    console.error('Usage: node migrate-data-format.js <data-file-or-directory>');
    console.error('');
    console.error('Examples:');
    console.error('  node migrate-data-format.js session-abc123.json');
    console.error('  node migrate-data-format.js ~/.local/share/web-classifier/');
    process.exit(1);
  }

  const target = args[0];

  try {
    const stat = fs.statSync(target);

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
    console.error(`Error accessing ${target}:`, error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}