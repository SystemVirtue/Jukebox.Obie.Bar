#!/bin/bash
# Exit on error
set -o errexit

# Install serve if not already installed
if ! command -v serve &> /dev/null; then
  echo "Installing serve..."
  npm install -g serve
fi

# Start the server
echo "Starting production server..."
serve -s dist -l $PORT
