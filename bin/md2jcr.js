#!/usr/bin/env node

/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-disable no-await-in-loop,no-console */
import {
  readdir, readFile, stat, writeFile,
} from 'fs/promises';
import path from 'path';
import { decode } from 'entities';
import { md2jcr } from '../src/index.js';

/**
 * Read a JSON file. If the file does not exist, return an empty object.
 * @param {string} filePath The path to the JSON file.
 * @returns {Promise<{}|any>} A promise that resolves to the JSON object in the file,
 */
async function readJsonFile(filePath) {
  try {
    if ((await stat(filePath)).isFile()) {
      const models = await readFile(filePath, 'utf-8');
      return JSON.parse(models);
    }
  } catch (error) {
    // ignore the fact that the file doesn't exist
    // console.error(`Error due to: ${error} for file ${filePath}`);
  }
  return {};
}

/**
 * Convert a markdown file to JCR XML.
 * @param mdFile {string} The path to the markdown file.
 * @param verbose - if true the XML will be printed to the console.
 * @param decodeXML - if true a file with the decoded XML will be created.
 * @param ueFilesDir - optional path to directory containing UE files (models, definitions, filters)
 * @returns {Promise<void>} A promise that resolves when the conversion is
 * complete, or rejects if the file is not a markdown file.
 */
async function convert(
  mdFile,
  verbose = false,
  decodeXML = false,
  ueFilesDir = null,
) {
  if (!mdFile.endsWith('.md')) {
    return Promise.reject(new Error('File must be a markdown file'));
  }

  const dir = path.dirname(mdFile);
  const base = path.basename(mdFile, '.md');
  const fileJcrXML = path.resolve(dir, `${base}.xml`);

  let modelJson;
  let definitionJson;
  let filtersJson;

  // Use provided UE files directory if specified
  if (ueFilesDir) {
    const ueDir = path.resolve(process.cwd(), ueFilesDir);

    // Try to load models.json
    const modelsPath = path.resolve(ueDir, 'component-models.json');
    const loadedModels = await readJsonFile(modelsPath);
    modelJson = Array.isArray(loadedModels) ? loadedModels : loadedModels.models;

    // Try to load definitions.json
    const definitionsPath = path.resolve(ueDir, 'component-definition.json');
    const loadedDefinitions = await readJsonFile(definitionsPath);
    if (loadedDefinitions.groups) {
      definitionJson = loadedDefinitions;
    } else if (loadedDefinitions.definitions) {
      // Wrap definitions in the expected structure
      definitionJson = {
        groups: [
          {
            title: 'Blocks',
            id: 'blocks',
            components: loadedDefinitions.definitions,
          },
        ],
      };
    } else {
      definitionJson = loadedDefinitions;
    }

    // Try to load filters.json
    const filtersPath = path.resolve(ueDir, 'component-filters.json');
    const loadedFilters = await readJsonFile(filtersPath);
    filtersJson = Array.isArray(loadedFilters) ? loadedFilters : loadedFilters.filters;
  } else {
    // Fall back to automatic discovery
    const blockDefinitionsPath = path.resolve(dir, `_${base}.json`);

    // check to see if the blockFiles exists
    try {
      await stat(blockDefinitionsPath);
      const blockDefinitionFile = await readJsonFile(path.resolve(dir, `_${base}.json`));
      modelJson = blockDefinitionFile.models;
      definitionJson = {
        groups: [
          {
            title: 'Blocks',
            id: 'blocks',
            components: [
              ...blockDefinitionFile.definitions,
            ],
          },
        ],
      };
      filtersJson = blockDefinitionFile.filters;
    } catch (err) {
      const modelFile = path.resolve(dir, `${base}-models.json`);
      const definitionFile = path.resolve(dir, `${base}-definitions.json`);
      const filtersFile = path.resolve(dir, `${base}-filters.json`);
      modelJson = await readJsonFile(modelFile);
      definitionJson = await readJsonFile(definitionFile);
      filtersJson = await readJsonFile(filtersFile);
    }
  }

  const md = await readFile(mdFile, 'utf-8');

  /** @type {Mdast2JCROptions} */
  const opts = {
    models: modelJson,
    definition: definitionJson,
    filters: filtersJson,
  };

  const xml = await md2jcr(md, opts);

  if (verbose) {
    if (!decodeXML) {
      console.log(xml);
    } else if (decodeXML) {
      console.log(decode(xml));
    }
  }

  return writeFile(fileJcrXML, xml);
}

/**
 * Parse command-line arguments
 * @returns {object} Parsed arguments
 */
function parseArgs() {
  const args = {
    path: null,
    verbose: false,
    decode: false,
    ueFilesDir: null,
  };

  for (let i = 2; i < process.argv.length; i += 1) {
    const arg = process.argv[i];

    if (arg === '-v' || arg === '--verbose') {
      args.verbose = true;
    } else if (arg === '-d' || arg === '--decode') {
      args.decode = true;
    } else if (arg === '-ue' || arg === '--ue-files') {
      args.ueFilesDir = process.argv[i + 1];
      i += 1;
    } else if (!arg.startsWith('-')) {
      args.path = arg;
    }
  }

  return args;
}

/**
 * Entry point to convert a markdown file to JCR XML.
 * @param inPath {string} The path to the markdown file or directory containing
 * markdown files.
 * @param verbose {boolean} If true, print output to console
 * @param htmlDecode {boolean} If true, decode HTML entities in output
 * @param ueFilesDir {string|null} Optional path to directory containing UE files
 * @returns {Promise<void>} A promise that resolves when the conversion is
 * complete.
 */
export async function run(inPath, verbose, htmlDecode, ueFilesDir) {
  const dirOrFilePath = path.resolve(process.cwd(), inPath);

  const files = [];
  if ((await stat(dirOrFilePath)).isDirectory()) {
    const items = await readdir(dirOrFilePath);
    items
      .filter((item) => item.endsWith('.md'))
      .forEach((item) => files.push(path.resolve(dirOrFilePath, item)));
  } else {
    files.push(dirOrFilePath);
  }

  for (const file of files) {
    await convert(file, verbose, htmlDecode, ueFilesDir);
  }
}

const args = parseArgs();

run(
  args.path || process.cwd(),
  args.verbose,
  args.decode,
  args.ueFilesDir,
).catch(console.error);
