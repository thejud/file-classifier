# Tools Directory

This directory contains utility scripts for development and documentation.

## capture-screenshots.ts

Automated screenshot capture script using Playwright for documenting the UI.

### Usage

```bash
# Start the classifier with test data
bun src/cli.ts --csv --categories "critical,investigate,false-positive" \
  --columns "alert_id,severity,event_type,risk_assessment" \
  test-data/security-alerts.csv --port 8899 --no-browser

# In another terminal, run the screenshot capture
bun run tools/capture-screenshots.ts
```

### What it captures

The script automatically navigates through the UI and captures:

1. **ui-initial.png** - Initial view with first item
2. **ui-markdown-content.png** - View with markdown content
3. **ui-comment-modal.png** - Comment modal dialog
4. **ui-markdown-rendered.png** - Markdown rendering mode enabled
5. **ui-help-modal.png** - Keyboard shortcuts help modal
6. **ui-export-success.png** - Export completion notification
7. **ui-progress-view.png** - View showing classification progress

All screenshots are saved to the `screenshots/` directory.

### Requirements

- Playwright must be installed (`@playwright/test` in devDependencies)
- The classifier must be running on port 8899
- Chromium browser will be launched in non-headless mode

### Customization

Edit the script to:
- Change the port number (default: 8899)
- Adjust viewport size (default: 1200x800)
- Modify the sequence of interactions
- Add more screenshot capture points