/*
 * Copyright 2021 Adobe. All rights reserved.
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
import { md2jcr } from '../index.js';

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
 * @param decodeXML - if true a file with the decoded XML will be created.
 * @returns {Promise<void>} A promise that resolves when the conversion is
 * complete, or rejects if the file is not a markdown file.
 */
async function convert(mdFile, decodeXML = false) {
  if (!mdFile.endsWith('.md')) {
    return Promise.reject(new Error('File must be a markdown file'));
  }

  const dir = path.dirname(mdFile);
  const base = path.basename(mdFile, '.md');
  const fileJcrXML = path.resolve(dir, `${base}.xml`);
  const decodedXML = path.resolve(dir, `${base}-decoded.xml`);

  let modelJson;
  let definitionJson;
  let filtersJson;

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

  const md = await readFile(mdFile, 'utf-8');

  /** @type {Mdast2JCROptions} */
  const opts = {
    models: modelJson,
    definition: definitionJson,
    filters: filtersJson,
  };

  const xml = await md2jcr(md, opts);

  if (decodeXML) {
    writeFile(decodedXML, decode(xml));
  }

  return writeFile(fileJcrXML, xml);
}

/**
 * Entry point to convert a markdown file to JCR XML.
 * @param inPath {string} The path to the markdown file or directory containing
 * markdown files.
 * @returns {Promise<void>} A promise that resolves when the conversion is
 * complete.
 */
async function run(inPath) {
  const dirOrFilePath = path.resolve(process.cwd(), inPath);

  const files = [];
  if ((await stat(dirOrFilePath)).isDirectory()) {
    files.push(...await readdir(dirOrFilePath));
  } else {
    files.push(dirOrFilePath);
  }

  for (const file of files) {
    await convert(file, process.argv.includes('-d'));
  }
}

run(process.argv[2] || process.cwd()).catch(console.error);
