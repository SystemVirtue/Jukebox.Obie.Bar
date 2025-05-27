#!/bin/bash
# Exit on error
set -o errexit

# Install serve if not already installed
if ! command -v serve &> /dev/null; then
  echo "Installing serve..."
  npm install -g serve
fi

# Start the server
echo "Starting production server on port $PORT..."
# Explicitly bind to 0.0.0.0 to make it accessible from all network interfaces
serve -s dist -l "0.0.0.0:$PORT"
