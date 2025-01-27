# Helix Markdown to JCR

> A library that converts markdown to JCR.

## Status
[![codecov](https://img.shields.io/codecov/c/github/adobe/helix-md2jcr.svg)](https://codecov.io/gh/adobe/helix-md2jcr)
[![GitHub license](https://img.shields.io/github/license/adobe/helix-md2jcr.svg)](https://github.com/adobe/helix-md2jcr/blob/main/LICENSE.txt)
[![GitHub issues](https://img.shields.io/github/issues/adobe/helix-md2jcr.svg)](https://github.com/adobe/helix-md2jcr/issues)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## Installation

## Usage

```bash
npm install @adobe/helix-md2jcr
```

## Converting Markdown to JCR XML document

just run:

```bash
node ./src/cli/convert2jcr.js <file>
```

The converter will produce a `.xml` file with the generated document converted following the JCR XML schema.
