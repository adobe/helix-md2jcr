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
 * @param unit if true, load from the unit folder instead of the blocks folder
 * @return {Promise<{models, definition: {groups: [{title: string,
 * id: string, components: *[]}]}, filters}>}
 */
export async function loadBlockResources(spec, unit = false) {
  let modelJson;
  let definitionJson;
  let filtersJson;
  const unitFolder = unit ? 'unit' : 'blocks';

  const blockDefinitionsPath = resolve(__testdir, `fixtures/${unitFolder}/${spec}`, `_${spec}.json`);

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
    const modelFile = await readFile(resolve(__testdir, `fixtures/${unitFolder}/${spec}`, `${spec}-models.json`), 'utf-8');
    const definitionFile = await readFile(resolve(__testdir, `fixtures/${unitFolder}/${spec}`, `${spec}-definitions.json`), 'utf-8');
    const filtersFile = await readFile(resolve(__testdir, `fixtures/${unitFolder}/${spec}`, `${spec}-filters.json`), 'utf-8');

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
