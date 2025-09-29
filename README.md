# Web Data Classifier

A fast, lightweight macOS CLI tool that launches a web interface for manually classifying files or CSV rows. Built with Bun, TypeScript, and vanilla web technologies for maximum performance and simplicity.

## Features

- 🚀 **Blazing Fast**: Built with Bun runtime, starts in milliseconds
- 📱 **Responsive Web UI**: Clean, keyboard-driven interface
- 💾 **Auto-Save**: Classifications persist automatically across sessions
- 🔧 **Configurable Categories**: Support for 1-9 custom categories
- 📄 **Multiple Formats**: Works with text files and CSV data
- ⌨️ **Rich Keyboard Shortcuts**: Navigation, classification, comments, and help
- 📝 **Markdown Rendering**: Toggle markdown display mode (Cmd+M)
- 💬 **Comments System**: Add notes to items with keyboard shortcuts (M key)
- 🎯 **Zero Dependencies**: Self-contained ~60MB binaries
- 🔄 **Session Resume**: Automatically restores previous work
- 🔍 **CSV Column Selection**: Focus on specific columns with --columns

## Installation

Download the appropriate binary for your Mac:

- **Apple Silicon (M1/M2/M3)**: `file-classifier-arm64`
- **Intel Macs**: `file-classifier`

Make it executable:
```bash
chmod +x file-classifier-arm64
sudo mv file-classifier-arm64 /usr/local/bin/file-classifier
```

## Quick Start

### File Mode (Default)
Classify text files line by line:
```bash
file-classifier document.txt report.txt
```

### CSV Mode
Classify CSV rows as individual items:
```bash
file-classifier --csv data.csv
```

### Column Selection (CSV Mode)
Show only specific columns from CSV files:
```bash
file-classifier --csv --columns "title,content,priority" data.csv
```

### Categories

By default, the classifier uses three categories: **good** (1), **bad** (2), and **review** (3). The keyboard shortcuts correspond to the order you specify, not alphabetical order.

#### Custom Categories
Define your own classification categories:
```bash
file-classifier --categories "urgent,normal,low" emails.txt
file-classifier --csv --categories "spam,ham,unsure" messages.csv
```

## Usage

```
Usage: file-classifier [options] <files...>

Options:
  --csv, -c                        CSV mode (otherwise file mode)
  --categories "cat1,cat2"         Custom categories (comma-separated, 1-9 max)
  --columns "col1,col2"            CSV column subset (default: all columns)
  --port <number>                  Specific port (default: random)
  --no-browser                     Don't auto-launch browser
  --reset                          Clear previous classifications and comments for specified files

Examples:
  file-classifier file1.txt file2.txt
  file-classifier --csv data.csv
  file-classifier --csv --columns "Detection Name,uuid,message" data.csv
  file-classifier --categories "spam,ham,unsure" *.txt
  file-classifier -c "bug,feature,question" --csv data.csv
  file-classifier --reset file1.txt file2.txt
```

## Data Management

### Clearing Classifications

To clear previous classifications and comments for specific files:

```bash
# Clear classification data for specific files
file-classifier --reset file1.txt file2.txt

# Clear CSV data classifications
file-classifier --reset --csv data.csv

# Clear with specific categories (must match original session)
file-classifier --reset --categories "spam,ham,unsure" *.txt
```

Classification data is stored in `~/.config/file-classifier/` as session files (following XDG Base Directory Specification). Each unique combination of files, categories, and mode creates a separate session. The `--reset` option only clears data for the exact session that matches your specified files and options, leaving other sessions intact.

## Keyboard Shortcuts

### Classification
- **1-9**: Classify current item with category 1-9

### Navigation
- **←/→** or **J/K**: Navigate between items (or click Prev/Next)
- **Shift+←/→** or **Shift+J/K**: Navigate to unrated items only
- **Space**: Skip to next item without classifying

### Display & Export
- **Cmd+M** (or Ctrl+M): Toggle markdown rendering mode
- **Cmd+E** (or Ctrl+E): Export results to JSON file
- **M**: Add/edit comment for current item
- **Shift+Enter**: Save comment (when in comment modal)

### Help
- **?** or **/**: Show/hide keyboard shortcut help
- **Escape**: Close any open modal

## Web Interface

The tool automatically opens your browser to a clean, responsive interface:

```
┌─────────────────────────────────────┐
│ 📁 Data Classifier - data.csv (3/25)│
├─────────────────────────────────────┤
│                                     │
│         Content Display             │
│    (file content or CSV row)        │
│                                     │
├─────────────────────────────────────┤
│ Status: ✅ Classified as "Good"    │
├─────────────────────────────────────┤
│ [1] Good [2] Bad [3] Review [S] Skip│
├─────────────────────────────────────┤
│ ← Prev | 3/25 | Next → | ✅8 ⏭2 ⏳15│
└─────────────────────────────────────┘
```

## Session Management

Classifications are automatically saved to `~/.web-classifier/` and restored when you restart with the same files and categories. This allows you to:

- Stop and resume work anytime
- Refresh the browser without losing progress
- Recover from crashes or interruptions

## Export & Results

Results are exported as JSON with this structure:

```json
{
  "sessionId": "session-1234567890",
  "config": {
    "mode": "csv",
    "categories": ["spam", "ham", "unsure"],
    "sources": ["messages.csv"]
  },
  "classifications": [
    {
      "itemId": "messages.csv:row:1",
      "category": 2,
      "categoryName": "ham",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "summary": {
    "totalItems": 100,
    "classifiedItems": 75,
    "unclassifiedItems": 25,
    "categoryCounts": {
      "spam": 20,
      "ham": 50,
      "unsure": 5
    }
  },
  "exportedAt": "2024-01-15T11:00:00.000Z"
}
```

## File Formats

### Text Files
- Each file is treated as one classification item
- Displayed with syntax highlighting and line numbers
- Supports any text-based format (.txt, .md, .log, etc.)

### CSV Files
- Each row becomes a classification item
- Displayed as key-value pairs for easy reading
- Automatic parsing with quote handling
- Header row used for column names

## Development

Built with modern web technologies:

- **Runtime**: Bun (blazing fast JavaScript runtime)
- **Language**: TypeScript (type safety)
- **Frontend**: Vanilla HTML/CSS/JS (no framework bloat)
- **Testing**: Bun test + Playwright E2E
- **Packaging**: Single executable binaries

### Building from Source

```bash
# Clone and install dependencies
git clone <repository>
cd web-classifier
bun install
```

### Running from Source (Development)

For **Apple Silicon Macs** (M1/M2/M3) - most common:
```bash
# Run directly with TypeScript files
bun src/index.ts file1.txt file2.txt
bun src/index.ts --csv data.csv
bun src/index.ts --categories "spam,ham,unsure" --csv messages.csv
```

For **Intel Macs**:
```bash
# Same commands work
bun src/index.ts --csv --columns "title,content" data.csv
```

### Alternative Development Commands
```bash
# Using the dev script (opens with sample data)
bun run dev file.txt

# Run tests
bun test
bun run test:e2e

# Build standalone binaries
bun run build        # Intel Mac
bun run build:arm64  # Apple Silicon
```

## Use Cases

- **Email Classification**: Sort emails into spam/ham/unsure
- **Document Triage**: Categorize documents by priority/topic
- **Content Moderation**: Review and classify user-generated content
- **Data Labeling**: Create training datasets for ML models
- **Bug Triage**: Classify bug reports by severity/type
- **Research Data**: Categorize survey responses or research data

## Performance

- **Startup Time**: < 100ms
- **Memory Usage**: ~20MB base + data size
- **File Handling**: Tested with files up to 10MB
- **Browser Compatibility**: Modern browsers (Chrome, Safari, Firefox)
- **Keyboard Responsiveness**: Sub-100ms classification

## Requirements

- **macOS**: 10.15+ (Catalina or newer)
- **Architecture**: Intel x64 or Apple Silicon (ARM64)
- **Browser**: Any modern browser for the web interface
- **Disk Space**: 100MB for binaries + session storage


## Support

- Report issues: [GitHub Issues]
- Documentation: This README
- Examples: See `tests/fixtures/` for sample data formats

---

**Built with ❤️ for rapid manual data classification**
