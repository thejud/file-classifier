# Implementation Plan: Web Data Classifier (macOS)

## Overview
A macOS-focused TypeScript CLI tool that launches a web interface for manually classifying files or CSV rows. Built for rapid personal use with Bun runtime and CLI-configurable categories.

**Tech Stack**: Bun + TypeScript + Vanilla HTML/CSS/JS (macOS only)

## CLI Interface

### Basic Usage
```bash
file-classifier file1.txt file2.txt                    # File mode, default categories
file-classifier --csv data.csv                         # CSV mode, default categories
file-classifier --categories "spam,ham,unsure" *.txt   # Custom categories
file-classifier -c "bug,feature,question" --csv data.csv
```

### Default Categories
- **good** (1)
- **bad** (2)
- **review** (3)

### Arguments
- `--csv` / `-c`: CSV mode (otherwise file mode)
- `--categories "cat1,cat2,cat3"`: Custom categories (comma-separated, 1-9 max)
- `--port 8080`: Specific port (default: random)
- `--no-browser`: Don't auto-launch browser

## Architecture

```
CLI Args → Server Setup → Browser Launch
    ↓         ↓              ↓
Categories  HTTP Server   Classification UI
Files/CSV   REST API      Keyboard (1-9)
Export      JSON I/O      Progress Tracking
```

## Project Structure
```
src/
├── cli.ts              # Entry point, arg parsing, server start
├── server.ts           # HTTP server + all API routes
├── processor.ts        # File/CSV processing logic
├── session.ts          # Session management + persistence
├── public/
│   ├── index.html      # Single-page UI
│   ├── app.js          # Frontend classification logic
│   └── styles.css      # Clean, minimal styling
└── types.ts           # TypeScript interfaces
```

## Key Features

### CLI Processing
- Parse categories from `--categories "cat1,cat2,cat3"`
- Validate 1-9 categories max
- Map to keyboard numbers 1-9
- Default to "good,bad,review" if not specified

### Web Interface
- Dynamic category buttons based on CLI input
- Content display (files with line numbers / CSV as table)
- Keyboard shortcuts (1-9 for categories, arrows for navigation)
- Real-time progress tracking
- Session auto-save + resume

### API Design (minimal)
```typescript
GET  /api/state          # Current session + categories
POST /api/classify       # { itemIndex: 0, category: 1 }
GET  /api/item/:index    # Get item content
POST /api/export         # Generate JSON output
```

## UI Layout
```
┌─────────────────────────────────────┐
│ 📁 Data Classifier - data.csv (3/25)│
├─────────────────────────────────────┤
│                                     │
│         Content Display             │
│    (file content or CSV row)        │
│                                     │
├─────────────────────────────────────┤
│ Status: ⚪ Unclassified            │
├─────────────────────────────────────┤
│ [1] Good [2] Bad [3] Review [S] Skip│  # Dynamic from CLI
├─────────────────────────────────────┤
│ ← Prev | 3/25 | Next → | ✅8 ⏭2 ⏳15│
└─────────────────────────────────────┘
```

## Data Models
```typescript
interface CLIConfig {
  mode: 'file' | 'csv';
  categories: string[];           # From --categories arg
  sources: string[];             # File paths
  port?: number;
  noBrowser?: boolean;
}

interface Classification {
  itemId: string;
  category: number;              # 1-based index into categories array
  categoryName: string;          # Actual category name
  timestamp: string;
}
```

## Testing Strategy
- **Playwright E2E**: Test with different category configurations
- **CLI Testing**: Verify argument parsing and category setup
- **Session Testing**: Persistence across browser refresh
- **Export Testing**: JSON output validation

### Test Examples
```typescript
test('should use custom categories from CLI', async ({ page }) => {
  await startClassifier(['--categories', 'urgent,normal,low', 'test.csv']);
  await expect(page.locator('[data-category="1"]')).toHaveText('urgent');
  await expect(page.locator('[data-category="2"]')).toHaveText('normal');
});
```

## Build & Distribution
```bash
# Development
bun install && bun run dev

# macOS binary
bun build --compile --target=darwin-x64 src/cli.ts --outfile file-classifier
# OR for Apple Silicon
bun build --compile --target=darwin-arm64 src/cli.ts --outfile file-classifier

# Single ~40MB binary, zero dependencies
```

## Implementation Plan

### Phase 1: Foundation (3 days)
**Day 1: Project Setup & CLI**
- [ ] Initialize TypeScript project with Bun
- [ ] Set up project structure (`src/`, `public/`, `tests/`)
- [ ] Implement CLI argument parsing (`cli.ts`)
  - Parse `--categories`, `--csv`, `--port`, `--no-browser`
  - Validate arguments (1-9 categories, file existence)
  - Set default categories ["good", "bad", "review"]
- [ ] Create basic TypeScript interfaces (`types.ts`)

**Day 2: Basic Server**
- [ ] Implement HTTP server (`server.ts`)
  - Static file serving for `public/` directory
  - Random port selection with CLI override
  - Graceful shutdown handling (Ctrl+C)
- [ ] Add basic API routes structure
- [ ] Test server startup and static serving

**Day 3: File Processing**
- [ ] Implement file reading and processing (`processor.ts`)
  - File mode: Read multiple text files
  - CSV mode: Parse CSV with proper handling
  - Content validation and error handling
- [ ] Basic session management (`session.ts`)
- [ ] Test file/CSV processing with sample data

### Phase 2: Web Interface (3 days)
**Day 4: HTML Structure & Basic UI**
- [ ] Create main HTML template (`public/index.html`)
- [ ] Basic CSS styling (`public/styles.css`)
  - Clean, minimal design
  - Responsive layout
  - Classification button styling
- [ ] Basic JavaScript structure (`public/app.js`)

**Day 5: Classification Logic**
- [ ] Implement dynamic category button generation
- [ ] Keyboard shortcut handling (1-9 keys)
- [ ] Classification API integration
- [ ] Real-time status updates

**Day 6: Navigation & Content Display**
- [ ] Content display component
  - File mode: Line numbers and syntax
  - CSV mode: Key-value table format
- [ ] Navigation controls (prev/next, progress)
- [ ] Arrow key navigation support

### Phase 3: Persistence & Export (2 days)
**Day 7: Session Management**
- [ ] Auto-save after each classification
- [ ] Session resume functionality
- [ ] Browser refresh persistence
- [ ] Session state API endpoints

**Day 8: Export & Testing Setup**
- [ ] JSON export functionality
- [ ] Output file generation (`classifications-[timestamp].json`)
- [ ] Basic unit tests setup
- [ ] E2E test framework setup (Playwright)

### Phase 4: Polish & Distribution (2 days)
**Day 9: Testing & Bug Fixes**
- [ ] Comprehensive E2E tests
  - Different category configurations
  - File vs CSV modes
  - Session persistence
  - Export validation
- [ ] Performance testing with large files
- [ ] Bug fixes and edge case handling

**Day 10: Build & Documentation**
- [ ] macOS binary compilation (Intel + Apple Silicon)
- [ ] README documentation
- [ ] Usage examples and screenshots
- [ ] Final testing and validation

## Deliverables

### Code Structure
```
web_classifier/
├── src/
│   ├── cli.ts              # ✅ CLI entry point
│   ├── server.ts           # ✅ HTTP server + routes
│   ├── processor.ts        # ✅ File/CSV processing
│   ├── session.ts          # ✅ Session management
│   ├── types.ts            # ✅ TypeScript interfaces
│   └── public/
│       ├── index.html      # ✅ Main UI
│       ├── app.js          # ✅ Frontend logic
│       └── styles.css      # ✅ Styling
├── tests/
│   ├── e2e/               # ✅ Playwright tests
│   └── fixtures/          # ✅ Test data
├── dist/                  # ✅ Compiled binaries
├── package.json           # ✅ Dependencies & scripts
├── tsconfig.json          # ✅ TypeScript config
├── playwright.config.ts   # ✅ Test configuration
└── README.md              # ✅ Documentation
```

### Final Binary
- **file-classifier** (macOS Intel): ~40MB self-contained binary
- **file-classifier-arm64** (Apple Silicon): ~40MB self-contained binary
- Zero dependencies, works offline
- Simple CLI interface with sensible defaults

**Target**: Complete, tested, distributable tool in 10 days