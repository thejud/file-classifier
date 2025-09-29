# Product Requirements Document: Web-Based Data Classifier

## Executive Summary

A web-based application for manually reviewing and classifying data items (files or CSV rows) through an intuitive interface with progress tracking and session persistence.

## Core Functionality

### 1. Data Input

#### 1.1 File Mode
- Upload multiple files for classification
- Support for text files of any size
- Files are processed sequentially

#### 1.2 CSV Mode
- Upload a single CSV file
- Each row becomes a classification item
- Option to select specific columns for display

### 2. Display & Navigation

#### 2.1 Content Display
- **File Mode**: Display file content with line numbers
- **CSV Mode**: Display row fields as a table of key-value pairs
  - Field names in left column
  - Field values in right column
  - Clear visual separation between fields
- Content area takes majority of screen real estate
- Clear visual hierarchy for easy reading

#### 2.2 Paging
- Large content (files or CSV rows with extensive data) is paginated automatically
- Page size adapts to viewport height
- Navigation controls:
  - Page Up/Down
  - Line-by-line scrolling
  - Jump to top/bottom
- Current position indicator (e.g., "Lines 1-50 of 500")

#### 2.3 Item Navigation
- Previous/Next buttons to move between items
- Current position display (e.g., "Item 3 of 25")
- Keyboard shortcuts for quick navigation
- Auto-advance to next item after classification

### 3. Classification

#### 3.1 Category Selection
- Configure 1-9 custom categories before starting
- Single-key classification (press 1-9)
- Visual buttons as alternative to keyboard
- Clear display of current item's classification status

#### 3.2 Classification Actions
- **Classify**: Assign category to current item
- **Skip**: Mark item as skipped (won't be classified)
- **Undo**: Remove classification from current item
- Auto-advance to next unclassified item after action

#### 3.3 Status Display
- Prominent indicator showing current item's status:
  - Unclassified (default)
  - Category name and number (if classified)
  - Skipped (if skipped)
- Real-time progress tracking:
  - Total items
  - Number classified
  - Number skipped
  - Number remaining

### 4. Data Persistence

#### 4.1 Session Management
- Auto-save after each classification
- Resume capability from previous session
- Session includes:
  - All classifications
  - Current position
  - Timestamp data

#### 4.2 Output Format
JSON file containing:
```json
{
  "session_id": "uuid",
  "source_type": "file|csv",
  "started_at": "ISO-8601 timestamp",
  "classifications": [
    {
      "item_id": "identifier",
      "category": 1,
      "classified_at": "ISO-8601 timestamp",
      // Additional metadata based on source type
    }
  ],
  "skipped": [
    {"item_id": "identifier"}
  ]
}
```

**File Mode Metadata**:
- `file_path`: Original file path/name

**CSV Mode Metadata**:
- `row_index`: Zero-based row number
- `row_data`: Object containing all row fields

### 5. User Interface Layout

```
┌─────────────────────────────────────────────┐
│ Header: [App Title] - [Current Item Name]   │
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│           Content Display Area              │
│         (File content or CSV row)           │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│     Classification Status: [Status]         │
├─────────────────────────────────────────────┤
│ [1] Cat1 [2] Cat2 [3] Cat3 ... [S] Skip    │
├─────────────────────────────────────────────┤
│ ← Previous | Item 3/25 | Next →             │
│ Classified: 10 | Skipped: 2 | Remaining: 13 │
└─────────────────────────────────────────────┘
```

### 6. Technical Requirements

#### 6.1 Frontend
- Single-page application (SPA)
- Responsive design for desktop browsers
- Keyboard navigation support
- No external dependencies for core functionality

#### 6.2 Backend
- Lightweight local web server
- REST API for data operations
- Direct file system access (no upload needed)
- Session storage
- Automatic JSON export to file system

#### 6.3 CLI Integration
- Command-line launcher
- Automatic browser opening
- Graceful shutdown on browser close
- Output file path displayed in terminal

#### 6.4 Performance
- Handle typical files (< 1MB) efficiently
- Support CSV files with a few thousand rows
- Fast startup time (< 2 seconds)
- Smooth scrolling and navigation
- Fast classification response (< 100ms)
- Minimal time switching between items
- Page responsiveness for quick classification workflow

### 7. User Workflow

1. **Launch**
   - Start from command line: `file-classifier --csv-mode path/to/file.csv`
   - Or: `file-classifier file1.txt file2.txt ...`
   - Web server starts automatically and opens browser

2. **Setup**
   - Define classification categories (1-9) if not already configured
   - Choose session mode:
     - Resume: Continue from last position
     - Skip Classified: Show only unclassified items (toggleable)
     - Start Fresh: Begin from first item

3. **Review & Classify**
   - View current item
   - Scroll/page through content if needed
   - Press number key (1-9) to classify
   - Automatically advance to next item
   - Toggle "skip classified" mode as needed
   - Repeat until all items processed

4. **Completion**
   - Classifications auto-saved throughout session
   - Close browser to end session
   - JSON file automatically saved to specified location
   - Terminal shows completion summary and output file path

### 8. Success Metrics

- Time to classify per item (target: < 5 seconds average)
- Session completion rate
- Error rate in classifications (via undo actions)
- Fast startup/shutdown cycle
- Minimal time switching between items
- Seamless terminal integration
- Browser compatibility

### 9. Out of Scope

- Custom themes/styling
- Configurable key bindings
- Batch operations
- Collaborative classification
- Machine learning assistance
- Search functionality
- Filtering/sorting of items
- Import of classification files
- User authentication
- Cloud storage integration

### 10. Future Considerations

- API mode for programmatic data input
- Real-time progress sync across devices
- Classification history/audit trail
- Bulk actions for similar items
- Export to multiple formats (CSV, Excel)