# Helix Markdown to JCR

> A library that converts markdown to JCR.

## Status
[![codecov](https://img.shields.io/codecov/c/github/adobe/helix-md2jcr.svg)](https://codecov.io/gh/adobe/helix-md2jcr)
[![GitHub license](https://img.shields.io/github/license/adobe/helix-md2jcr.svg)](https://github.com/adobe/helix-md2jcr/blob/main/LICENSE.txt)
[![GitHub issues](https://img.shields.io/github/issues/adobe/helix-md2jcr.svg)](https://github.com/adobe/helix-md2jcr/issues)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## Development
Install all dependencies by running:

```bash
npm install
```

## Usage
You can install the package via npm:

```bash
npm install @adobe/helix-md2jcr
```

## Converting Markdown to JCR Nodes
Running the following command will generate an XML file with the JCR structure alongside of the input file.

For example generating xml for the simple.md file, run:
```bash
node ./src/cli/convert2jcr.js test/fixtures/simple.md 
```
If you wish to see the output in the console, you can run the following command with the verbose flag -v
```bash
node ./src/cli/convert2jcr.js test/fixtures/simple.md -v
```

If you wish to see the decoded output in the console you can run the following command with the verbose and decode flags -v and -d:
```bash
node ./src/cli/convert2jcr.js test/fixtures/simple.md -v -d
```

The converter will produce a `.xml` which is the generated document converted
from markdown. This can be used to check for potential content changes due to conversion.

## Baseline XML Files
Running the ./baseline-tests.sh script will detect any md file under test/fixtures and execute the convert2jcr node script.  
The script will generate new xml files beside the md files it locates. This is helpful when making changes to the converter
and you want to see if the changes have any impact on the output.  By using git diff, you will see the new changes in the xml files.
If you are satisfied with the changes, you can commit the new xml files.


## Running Tests
Simply execute the following command to run the tests:
```bash
npm test
```
