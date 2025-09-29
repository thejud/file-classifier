# Data Format Migration Tool

This directory contains migration tools for updating existing classification data files to new formats.

## migrate-data-format.ts

Migrates existing SessionState files to include a `line` field in ClassificationItem objects:

- **Files**: `line = 0` (since file content is treated as single unit)
- **CSV**: `line = 1, 2, 3...` (1-based row numbers matching spreadsheet conventions)

### Usage

```bash
# Using Node.js (recommended - works everywhere)
node migration-tools/migrate-data-format.js path/to/session-abc123.json
node migration-tools/migrate-data-format.js ~/.local/share/web-classifier/

# Using Bun (if available)
bun migration-tools/migrate-data-format.ts path/to/session-abc123.json
bun migration-tools/migrate-data-format.ts ~/.local/share/web-classifier/
```

### What it does

1. **Scans** for files matching pattern `session-*.json`
2. **Checks** if already migrated (skips if `line` field exists)
3. **Creates backup** with `.backup` extension
4. **Migrates data** by adding appropriate `line` values
5. **Writes** updated JSON with proper formatting

### Example

**Before migration:**
```json
{
  "items": [
    {
      "id": "/path/file.csv:row:1",
      "csvRow": {...}
    },
    {
      "id": "/path/file.csv:row:2",
      "csvRow": {...}
    }
  ]
}
```

**After migration:**
```json
{
  "items": [
    {
      "id": "/path/file.csv:row:1",
      "csvRow": {...},
      "line": 1
    },
    {
      "id": "/path/file.csv:row:2",
      "csvRow": {...},
      "line": 2
    }
  ]
}
```

### Safety

- Creates `.backup` files before modifying originals
- Skips already-migrated files
- Shows detailed progress and validation output
- Safe to run multiple times (idempotent)