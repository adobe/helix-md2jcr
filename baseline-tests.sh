#!/bin/bash

# Set the root directory to search for .md files
MD_DIR="test/fixtures"

# Node script to execute
NODE_SCRIPT="src/cli/convert2jcr.js"

# Check if the directory exists
if [ ! -d "$MD_DIR" ]; then
  echo "Directory $MD_DIR does not exist. Please check the path."
  exit 1
fi

# Find all .md files recursively in the directory
MD_FILES=$(find "$MD_DIR" -type f -name "*.md")

# Check if no .md files are found
if [ -z "$MD_FILES" ]; then
  echo "No .md files found in $MD_DIR or its subdirectories."
  exit 1
fi

# Iterate over each .md file
for MD_FILE in $MD_FILES; do
  # Execute the Node.js script with the .md file as an argument
  echo "*******************************************************************************"
  echo "Processing $MD_FILE..."
  echo "*******************************************************************************"
  echo ""

  if [ "$1" == "-d" ]; then
    NODE_ENV=debug node "$NODE_SCRIPT" "$MD_FILE"
  else
    node "$NODE_SCRIPT" "$MD_FILE"
  fi

  # Check if the Node.js script executed successfully
  if [ $? -ne 0 ]; then
    echo "Error processing $MD_FILE with $NODE_SCRIPT."
    exit 1
  fi
done

echo "All .md files have been processed successfully."
