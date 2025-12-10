#!/bin/bash

# Script to replace console.log statements with this.logger in NestJS services
# This script intelligently converts console.log/warn/error/debug to proper logger calls

set -e

AI_WORKFLOWS_DIR="apps/listforge-api/src/ai-workflows"

echo "🔍 Finding files with console.log statements..."

# Find all TypeScript files with console.* in ai-workflows
files_with_console=$(grep -r -l "console\.\(log\|warn\|error\|debug\)" "$AI_WORKFLOWS_DIR" --include="*.ts" 2>/dev/null || true)

if [ -z "$files_with_console" ]; then
  echo "✅ No console statements found!"
  exit 0
fi

echo "📝 Found console statements in the following files:"
echo "$files_with_console" | while read file; do
  count=$(grep -c "console\.\(log\|warn\|error\|debug\)" "$file" 2>/dev/null || echo "0")
  echo "  - $file ($count occurrences)"
done

echo ""
echo "🔧 Starting replacements..."

# Process each file
echo "$files_with_console" | while read file; do
  if [ ! -f "$file" ]; then
    continue
  fi

  echo "Processing: $file"

  # Create backup
  cp "$file" "$file.bak"

  # Replace console.log with this.logger.debug
  sed -i.tmp "s/console\.log(/this.logger.debug(/g" "$file"

  # Replace console.warn with this.logger.warn
  sed -i.tmp "s/console\.warn(/this.logger.warn(/g" "$file"

  # Replace console.error with this.logger.error(/g" "$file"

  # Replace console.debug with this.logger.debug
  sed -i.tmp "s/console\.debug(/this.logger.debug(/g" "$file"

  # Clean up temp files
  rm -f "$file.tmp"

  # Check if file has Logger import
  if ! grep -q "import.*Logger.*from '@nestjs/common'" "$file"; then
    # Check if it's a .service.ts or .processor.ts file (has class with constructor)
    if echo "$file" | grep -qE "\.(service|processor)\.ts$"; then
      echo "  ⚠️  WARNING: $file may need Logger import added manually"
    fi
  fi
done

echo ""
echo "✅ Replacement complete!"
echo ""
echo "⚠️  IMPORTANT: Please review the changes and:"
echo "  1. Ensure classes have 'private readonly logger = new Logger(ClassName.name)' in constructor"
echo "  2. Add Logger import: import { Logger } from '@nestjs/common';"
echo "  3. For node files (not services), consider creating a logger instance"
echo "  4. Check that log messages are clear and include context"
echo ""
echo "💡 Backup files created with .bak extension - remove when satisfied"
