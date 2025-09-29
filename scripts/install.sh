#!/usr/bin/env bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Default installation directory
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"
BINARY_NAME="file-classifier"

# Detect OS and architecture
detect_platform() {
    local OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    local ARCH=$(uname -m)

    case "$OS" in
        darwin*)
            OS="darwin"
            ;;
        linux*)
            OS="linux"
            ;;
        *)
            echo -e "${RED}Unsupported operating system: $OS${NC}"
            exit 1
            ;;
    esac

    case "$ARCH" in
        x86_64|amd64)
            ARCH="x64"
            ;;
        aarch64|arm64)
            ARCH="arm64"
            ;;
        *)
            echo -e "${RED}Unsupported architecture: $ARCH${NC}"
            exit 1
            ;;
    esac

    # Special case for macOS Intel
    if [[ "$OS" == "darwin" && "$ARCH" == "x64" ]]; then
        PLATFORM="macos-intel"
    elif [[ "$OS" == "darwin" && "$ARCH" == "arm64" ]]; then
        PLATFORM="macos-arm64"
    else
        PLATFORM="${OS}-${ARCH}"
    fi

    echo "$PLATFORM"
}

# Check if running with proper permissions
check_permissions() {
    if [[ ! -w "$INSTALL_DIR" ]]; then
        echo -e "${YELLOW}Installation directory $INSTALL_DIR is not writable.${NC}"
        echo -e "${YELLOW}You may need to run this script with sudo:${NC}"
        echo -e "  ${GREEN}sudo bash scripts/install.sh${NC}"
        exit 1
    fi
}

# Build the binary if it doesn't exist
build_binary() {
    local platform=$1
    local binary_path="dist/file-classifier-${platform}"

    if [[ ! -f "$binary_path" ]]; then
        echo -e "${YELLOW}Binary for $platform not found. Building...${NC}" >&2

        # Check if bun is installed
        if ! command -v bun &> /dev/null; then
            echo -e "${RED}Bun is not installed. Please install Bun first:${NC}" >&2
            echo "  curl -fsSL https://bun.sh/install | bash" >&2
            exit 1
        fi

        # Install dependencies if needed
        if [[ ! -d "node_modules" ]]; then
            echo "Installing dependencies..." >&2
            bun install
        fi

        # Generate assets
        echo "Generating assets..." >&2
        node scripts/generate-assets.cjs

        # Build for the target platform
        echo "Building binary for $platform..." >&2
        case "$platform" in
            macos-arm64)
                bun build --compile --target=bun-darwin-arm64 src/cli.ts --outfile "$binary_path"
                ;;
            macos-intel)
                bun build --compile --target=bun-darwin-x64 src/cli.ts --outfile "$binary_path"
                ;;
            linux-x64)
                bun build --compile --target=bun-linux-x64 src/cli.ts --outfile "$binary_path"
                ;;
            linux-arm64)
                bun build --compile --target=bun-linux-arm64 src/cli.ts --outfile "$binary_path"
                ;;
            *)
                echo -e "${RED}Unknown platform: $platform${NC}" >&2
                exit 1
                ;;
        esac
    fi

    echo "$binary_path"
}

# Main installation
main() {
    echo -e "${GREEN}Installing file-classifier...${NC}"

    # Detect platform
    PLATFORM=$(detect_platform)
    echo "Detected platform: $PLATFORM"

    # Check if we're in the right directory
    if [[ ! -f "package.json" ]] || [[ ! -f "src/cli.ts" ]]; then
        echo -e "${RED}Error: This script must be run from the file-classifier project root.${NC}"
        exit 1
    fi

    # Build or locate binary
    BINARY_PATH=$(build_binary "$PLATFORM")

    if [[ ! -f "$BINARY_PATH" ]]; then
        echo -e "${RED}Failed to build or locate binary at $BINARY_PATH${NC}"
        exit 1
    fi

    # Check permissions
    check_permissions

    # Install the binary
    echo "Installing to $INSTALL_DIR/$BINARY_NAME..."
    cp "$BINARY_PATH" "$INSTALL_DIR/$BINARY_NAME"
    chmod +x "$INSTALL_DIR/$BINARY_NAME"

    # Verify installation
    if [[ -f "$INSTALL_DIR/$BINARY_NAME" ]]; then
        echo -e "${GREEN}Successfully installed file-classifier to $INSTALL_DIR/$BINARY_NAME${NC}"
        echo ""
        echo "You can now run: file-classifier --help"

        # Check if install dir is in PATH
        if ! echo "$PATH" | grep -q "$INSTALL_DIR"; then
            echo -e "${YELLOW}Warning: $INSTALL_DIR is not in your PATH.${NC}"
            echo "You may need to add it to your shell configuration."
        fi
    else
        echo -e "${RED}Installation failed.${NC}"
        exit 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dir)
            INSTALL_DIR="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --dir <path>    Installation directory (default: /usr/local/bin)"
            echo "  --help, -h      Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Install to /usr/local/bin"
            echo "  $0 --dir ~/.local/bin # Install to ~/.local/bin"
            echo "  sudo $0               # Install with elevated permissions"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

main