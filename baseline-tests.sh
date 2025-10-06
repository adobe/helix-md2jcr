#!/bin/bash

# create a function that prints the usage of the script
usage() {
  echo "Usage: $0 [-v] [-d] [-f file]"
  echo "  -v: Verbose mode"
  echo "  -d: Decode output mode"
  echo "  -f: Specify a single file to process"
  exit 1
}

# verify that the command arguments are only -v, -d, or -f if any other commands are found exit with an error
while getopts ":vdf:" opt; do
  case ${opt} in
    v )
      VERBOSE="true"
      ;;
    d )
      DECODE="true"
      ;;
    f )
      SPECIFIC_FILE="$OPTARG"
      ;;
    \? )
      echo "Invalid option: $OPTARG" 1>&2
      usage
      ;;
    : )
      echo "Invalid option: $OPTARG requires an argument" 1>&2
      usage
      ;;
  esac
done

# Set the root directory to search for .md files
MD_DIR="test/fixtures"

# Node script to execute
NODE_SCRIPT="bin/md2jcr.js"

# Check if the directory exists
if [ ! -d "$MD_DIR" ]; then
  echo "Directory $MD_DIR does not exist. Please check the path."
  exit 1
fi

ARGS=""
[ "$VERBOSE" = "true" ] && ARGS="$ARGS -v"
[ "$DECODE" = "true" ] && ARGS="$ARGS -d"

# If a specific file is provided, process only that file
if [ -n "$SPECIFIC_FILE" ]; then
  if [ ! -f "$SPECIFIC_FILE" ]; then
    echo "File $SPECIFIC_FILE does not exist."
    exit 1
  fi
  
  echo "Processing $SPECIFIC_FILE..."
  [ "$VERBOSE" = "true" ] && echo
  
  node "$NODE_SCRIPT" "$SPECIFIC_FILE" $ARGS 2>/dev/null
  
  if [ $? -ne 0 ]; then
    echo "Error processing $SPECIFIC_FILE with $NODE_SCRIPT."
    exit 1
  fi
  
  echo "File processed successfully."
  exit 0
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
  # if VERBOSE is true then echo a new line
  [ "$VERBOSE" = "true" ] && echo

  # Execute the Node.js script with the .md file as an argument
  echo "Processing $MD_FILE..."

  # if VERBOSE is true then echo a new line
  [ "$VERBOSE" = "true" ] && echo

  node "$NODE_SCRIPT" "$MD_FILE" $ARGS 2>/dev/null

  # Check if the Node.js script executed successfully
  if [ $? -ne 0 ]; then
    echo "Error processing $MD_FILE with $NODE_SCRIPT."
    exit 1
  fi
done

echo "All .md files have been processed successfully."
