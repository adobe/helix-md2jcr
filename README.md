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

### Installation

You can install the package via npm:

```bash
npm install @adobe/helix-md2jcr
```

Or use it directly with `npx` without installing:

```bash
npx @adobe/helix-md2jcr path/to/content.md
```

### Converting Markdown to JCR Nodes

The package includes a CLI tool `md2jcr` that converts markdown files to JCR XML format.

**Basic usage:**
```bash
npx @adobe/helix-md2jcr path/to/content.md
```

**Convert a single file:**
```bash
md2jcr test/fixtures/simple.md
```

**Convert all markdown files in a directory:**
```bash
md2jcr test/fixtures/
```

**View output in console with verbose flag `-v`:**
```bash
md2jcr test/fixtures/simple.md -v
```

**View decoded XML output with `-v` and `-d` flags:**
```bash
md2jcr test/fixtures/simple.md -v -d
```

The converter will generate a `.xml` file alongside the markdown file containing the JCR structure. This can be used to check for potential content changes due to conversion.

### Programmatic Usage

You can also use the library programmatically in your Node.js code:

```javascript
import { md2jcr } from '@adobe/helix-md2jcr';

const markdown = '# Hello World\n\nThis is a test.';
const options = {
  models: [...],
  definition: {...},
  filters: [...]
};

const xml = await md2jcr(markdown, options);
console.log(xml);
```

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
