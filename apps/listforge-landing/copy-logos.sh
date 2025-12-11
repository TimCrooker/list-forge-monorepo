#!/bin/bash

# Script to copy ListForge logos from the main web app to the landing page

SOURCE_DIR="../listforge-web/public/assets"
DEST_DIR="./public/assets"

# Create destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

# Copy logo files
echo "Copying ListForge logos..."
cp "$SOURCE_DIR/full_logo.png" "$DEST_DIR/"
cp "$SOURCE_DIR/icon_logo.png" "$DEST_DIR/"
cp "$SOURCE_DIR/text_logo.png" "$DEST_DIR/"

echo "✓ Logos copied successfully!"
echo ""
echo "Copied files:"
ls -lh "$DEST_DIR"/*.png

echo ""
echo "The logos are now available at:"
echo "  - /assets/full_logo.png (full logo with icon and text)"
echo "  - /assets/icon_logo.png (icon only)"
echo "  - /assets/text_logo.png (text only)"
