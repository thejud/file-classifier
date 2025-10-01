# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **cross-platform CLI tool** (macOS and Linux) that provides a **web-based interface** for manually classifying files or CSV data. Built with Bun runtime and TypeScript, it targets data labeling workflows like email classification, document triage, and research data categorization.

## Development Commands

### Runtime & Scripts
Default to using Bun instead of Node.js:
- `bun src/cli.ts [options] <files...>` - Run from source
- `bun run dev` - Development mode with sample data
- `bun install` - Install dependencies

### Build & Distribution
- `bun run build` - Build macOS ARM64 binary
- `bun run build:intel` - Build macOS Intel binary
- `bun run build:linux-x64` - Build Linux x64 binary
- `bun run build:linux-arm64` - Build Linux ARM64 binary
- `bun run lint` - TypeScript type checking

### Installation
- `bun run install:local` - Auto-detect platform and install binary
- `bun run uninstall:local` - Remove installed binary
- `INSTALL_DIR=~/.local/bin bun run install:local` - Install to custom directory

### Testing
- `bun test` - Unit tests
- `bun run test:e2e` - Playwright E2E tests
- `bun run test:all` - Run both test suites

## Architecture

### Backend (TypeScript/Bun)
- **CLI Entry Point**: `src/cli.ts` - Argument parsing and validation
- **HTTP Server**: `src/server.ts` - RESTful API with `Bun.serve()`
- **Session Management**: `src/session.ts` - XDG-compliant persistence in `~/.config/file-classifier/`
- **File Processing**: `src/processor.ts` - Handles both individual files and CSV parsing
- **Type Definitions**: `src/types.ts` - Core interfaces for configuration and state

### Frontend (Vanilla JavaScript)
- **Component Architecture**: Class-based structure in `src/public/`
- **State Management**: `StateManager.js` - API communication and data synchronization
- **Keyboard Handling**: Rich shortcut system for rapid classification
- **Comment System**: Modal-based with persistence via API

### Data Flow
1. CLI parses arguments and creates session configuration
2. Server loads/creates session state from XDG config directory
3. Frontend polls server for state and synchronizes classifications
4. Classifications persist automatically with unique session IDs
5. Export generates JSON with metadata and statistics

## Key Features & Patterns

### Session Persistence
- Sessions identified by hash of files + categories + mode
- State stored in `~/.config/file-classifier/sessions/`
- Automatic resume across application restarts

### Dual Mode Support
- **File Mode**: Each file is one classification item
- **CSV Mode**: Each row becomes a classification item with column filtering

### Performance Considerations
- Sub-100ms startup time with Bun runtime
- Efficient file reading with `Bun.file`
- Minimal frontend dependencies for fast loading

## Bun-Specific APIs

Use Bun's native APIs instead of Node.js equivalents:
- `Bun.serve()` for HTTP server (not Express)
- `Bun.file()` for file operations (not fs)
- `bun:test` for testing framework
- Automatic .env loading (no dotenv needed)

## Testing Strategy

- **Unit Tests**: Core logic validation in `tests/unit/*.test.ts` (run with `bun test`)
- **E2E Tests**: Browser automation with Playwright in `tests/e2e/*.spec.ts` (run with `bun run test:e2e`)
- **Test Data**: Sample files in `tests/fixtures/`
- **Test Separation**: Bun test runner configured via `bunfig.toml` to only discover unit tests in `tests/unit/`, preventing conflicts with Playwright E2E tests

## Important Implementation Notes

### Classification Storage
Classifications use `itemId` (not array index) for persistence to handle dynamic item reordering and CSV row identification.

### Frontend State Sync
The frontend polls the backend API to maintain state synchronization, allowing multiple clients or recovery from browser refresh.

### CSV Processing
Uses PapaParse for robust CSV handling with quote escaping and header detection. Column filtering reduces cognitive load during classification.
- use semantic versioning when creating new releases and change log notes.