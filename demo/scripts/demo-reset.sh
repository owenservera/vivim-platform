#!/bin/bash
# Quick Demo Reset
# Usage: bun run demo:reset

set -e

echo "🔄 Resetting VIVIM investor demo..."

cd "$(dirname "$0")/.."

# Set demo mode
export VIVIM_DEMO_MODE=true

# Run reset
bun run demo/scripts/reset-demo.ts

echo "✅ Demo ready"
echo ""
echo "Demo URL: http://localhost:5173"
echo "Demo account: alex@vivimdemo.io"
