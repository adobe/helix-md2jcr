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
import { readFile, stat } from 'fs/promises';
import { resolve } from 'path';

/**
 * Load block resources from the fixtures.
 * @param spec the name of the block
 * @param folder the folder where the md is located
 * @return {Promise<{models, definition: {groups: [{title: string,
 * id: string, components: *[]}]}, filters}>}
 */
export async function loadBlockResources(spec, folder) {
  let modelJson;
  let definitionJson;
  let filtersJson;

  const blockDefinitionsPath = resolve(__testdir, `${folder}`, `_${spec}.json`);

  try {
    await stat(blockDefinitionsPath);
    const blockDefinitionFile = await readFile(blockDefinitionsPath, 'utf-8');
    const json = JSON.parse(blockDefinitionFile);
    modelJson = json.models;
    definitionJson = {
      groups: [
        {
          title: 'Blocks',
          id: 'blocks',
          components: [
            ...json.definitions,
          ],
        },
      ],
    };
    filtersJson = json.filters;
  } catch (err) {
    // Helper to try spec-specific file first, then fall back to component-* file
    async function loadWithFallback(specFile, fallbackFile) {
      const specPath = resolve(__testdir, folder, specFile);
      try {
        await stat(specPath);
        return readFile(specPath, 'utf-8');
      } catch {
        return readFile(resolve(__testdir, folder, fallbackFile), 'utf-8');
      }
    }

    // Helper for definition file which can be singular or plural
    async function loadDefinitionFile() {
      // Try spec-definitions.json (plural) first
      const pluralPath = resolve(__testdir, folder, `${spec}-definitions.json`);
      try {
        await stat(pluralPath);
        return readFile(pluralPath, 'utf-8');
      } catch {
        // Try spec-definition.json (singular)
        const singularPath = resolve(__testdir, folder, `${spec}-definition.json`);
        try {
          await stat(singularPath);
          return readFile(singularPath, 'utf-8');
        } catch {
          // Fall back to component-definition.json
          return readFile(resolve(__testdir, folder, 'component-definition.json'), 'utf-8');
        }
      }
    }

    const modelFile = await loadWithFallback(`${spec}-models.json`, 'component-models.json');
    const definitionFile = await loadDefinitionFile();
    const filtersFile = await loadWithFallback(`${spec}-filters.json`, 'component-filters.json');

    modelJson = JSON.parse(modelFile);
    definitionJson = JSON.parse(definitionFile);
    filtersJson = JSON.parse(filtersFile);
  }

  return {
    models: modelJson,
    definition: definitionJson,
    filters: filtersJson,
  };
}
