#!/bin/bash

# create a function that prints the usage of the script
usage() {
  echo "Usage: $0 [-v] [-d]"
  echo "  -v: Verbose mode"
  echo "  -d: Decode output mode"
  exit 1
}

# verify that the command arguments are only -v or -d if any other commands are found exit with an error. If -d is present but -v is not present, exit with an error.
while getopts ":vd" opt; do
  case ${opt} in
    v )
      VERBOSE="true"
      ;;
    d )
      DECODE="true"
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

ARGS=""
[ "$VERBOSE" = "true" ] && ARGS="$ARGS -v"
[ "$DECODE" = "true" ] && ARGS="$ARGS -d"

# Iterate over each .md file
for MD_FILE in $MD_FILES; do
  # if VERBOSE is true then echo a new line
  [ "$VERBOSE" = "true" ] && echo

  # Execute the Node.js script with the .md file as an argument
  echo "Processing $MD_FILE..."

  # if VERBOSE is true then echo a new line
  [ "$VERBOSE" = "true" ] && echo

  node "$NODE_SCRIPT" "$MD_FILE" $ARGS

  # Check if the Node.js script executed successfully
  if [ $? -ne 0 ]; then
    echo "Error processing $MD_FILE with $NODE_SCRIPT."
    exit 1
  fi
done


echo "All .md files have been processed successfully."
