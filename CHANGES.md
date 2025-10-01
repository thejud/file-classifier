# Changelog

All notable changes to file-classifier will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-09-30

### Added
- Export button in bottom navigation bar for better discoverability
- Session file path printed to stdout on shutdown for easy data location

### Fixed
- Corrected build command documentation in README for ARM64 vs Intel architectures
- Restored auto-advance functionality after classification for rapid review workflows
- Fixed GitHub Actions release permissions

### Changed
- Updated E2E tests to properly handle auto-advance navigation behavior
- Export button uses subtle styling to avoid visual distraction

## [0.2.0] - 2025-09-29

### Added
- Cross-platform support for Linux (x64 and ARM64)
- GitHub Actions CI/CD pipeline for automated builds and releases
- Automated installation scripts with platform detection
- Test execution in CI pipeline before builds
- Support for custom installation directories
- Uninstall script for clean removal
- Pre-built binaries for all supported platforms via GitHub releases

### Changed
- Updated binary naming convention to include platform (e.g., `file-classifier-macos-arm64`)
- Improved documentation with comprehensive installation instructions
- Project now described as cross-platform instead of macOS-only

### Technical
- Added `build:linux-x64` and `build:linux-arm64` npm scripts
- Added `install:local` and `uninstall:local` npm scripts
- CI/CD workflow runs tests before building binaries
- Automatic release creation on version tags

## [0.1.0] - 2025-09-28

### Initial Release
- Core functionality for classifying files and CSV data
- Web-based interface with keyboard shortcuts
- Session persistence and resume capability
- Markdown rendering support
- Comments system for adding notes to items
- Export to JSON with detailed statistics
- Support for custom categories (1-9)
- CSV column filtering with `--columns` option
- Auto-save functionality
- Rich keyboard navigation
- macOS support (Intel and Apple Silicon)

### Features
- File mode for classifying individual text files
- CSV mode for classifying rows as items
- Configurable categories with keyboard shortcuts
- Persistent sessions based on file+category combinations
- XDG-compliant configuration storage
- Zero runtime dependencies (standalone binaries)
- Sub-100ms startup time
- Responsive web UI with modern design

[0.2.0]: https://github.com/thejud/file-classifier/releases/tag/v0.2.0
[0.1.0]: https://github.com/thejud/file-classifier/releases/tag/v0.1.0