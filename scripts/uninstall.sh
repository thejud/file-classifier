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

# Check if running with proper permissions
check_permissions() {
    if [[ -f "$INSTALL_DIR/$BINARY_NAME" ]] && [[ ! -w "$INSTALL_DIR/$BINARY_NAME" ]]; then
        echo -e "${YELLOW}Cannot remove $INSTALL_DIR/$BINARY_NAME - insufficient permissions.${NC}"
        echo -e "${YELLOW}You may need to run this script with sudo:${NC}"
        echo -e "  ${GREEN}sudo bash scripts/uninstall.sh${NC}"
        exit 1
    fi
}

# Main uninstallation
main() {
    echo -e "${GREEN}Uninstalling file-classifier...${NC}"

    # Check if installed
    if [[ ! -f "$INSTALL_DIR/$BINARY_NAME" ]]; then
        echo -e "${YELLOW}file-classifier is not installed at $INSTALL_DIR/$BINARY_NAME${NC}"
        echo ""
        echo "Checking other common locations..."

        # Check other common locations
        for dir in /usr/bin /opt/local/bin ~/.local/bin ~/bin; do
            if [[ -f "$dir/$BINARY_NAME" ]]; then
                echo -e "${YELLOW}Found at: $dir/$BINARY_NAME${NC}"
                echo "To uninstall from there, run:"
                echo "  INSTALL_DIR=$dir bash scripts/uninstall.sh"
            fi
        done
        exit 0
    fi

    # Check permissions
    check_permissions

    # Remove the binary
    echo "Removing $INSTALL_DIR/$BINARY_NAME..."
    rm -f "$INSTALL_DIR/$BINARY_NAME"

    # Verify removal
    if [[ ! -f "$INSTALL_DIR/$BINARY_NAME" ]]; then
        echo -e "${GREEN}Successfully uninstalled file-classifier${NC}"
    else
        echo -e "${RED}Failed to remove file-classifier${NC}"
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
            echo "  $0                    # Uninstall from /usr/local/bin"
            echo "  $0 --dir ~/.local/bin # Uninstall from ~/.local/bin"
            echo "  sudo $0               # Uninstall with elevated permissions"
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