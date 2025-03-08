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
import Handlebars from 'handlebars';
import { find } from 'unist-util-find';
import { toString } from 'mdast-util-to-string';
import { findAll } from '../../utils/mdast.js';
import { findModelById, getField, getModelFields } from '../../domain/Models.js';

function sectionHelper(index, children, options) {
  const {
    models,
  } = options.data.root;

  const attributes = {
    'sling:resourceType': 'core/franklin/components/section/v1/section',
    'jcr:primaryType': 'nt:unstructured',
  };

  const model = findModelById(models, 'section');
  if (model) {
    const fields = getModelFields(model);
    attributes.modelFields = `[${fields}]`;
  }

  const uniqueName = Handlebars.helpers.nameHelper.call(this, 'section');

  // find the table that has a gtHeader that has a header value that contains 'section-metadata'
  for (const child of children) {
    if (child.type === 'gridTable') {
      const cell = find(child, { type: 'gtCell' });
      if (cell) {
        const isMetadata = toString(cell).toLowerCase().replaceAll(' ', '-') === 'section-metadata';
        if (isMetadata) {
          const [, ...rows] = findAll(child, (n) => n.type === 'gtRow', false);
          for (const row of rows) {
            const cells = findAll(row, (n) => n.type === 'gtCell', true);
            const key = toString(cells[0]);
            const value = toString(cells[1]);
            if (key !== '' && value !== '') {
              const field = getField(model, key);
              if (field?.component === 'multiselect') {
                const multiValue = value.split(',').map((s) => s.trim()).filter(Boolean);
                attributes[key.toLowerCase().replaceAll(' ', '-')] = `[${multiValue.join(',')}]`;
              } else {
                attributes[key.toLowerCase().replaceAll(' ', '-')] = value;
              }
            }
          }
          break;
        }
      }
    }
  }

  const attributesStr = Object.entries(attributes).map(([k, v]) => `${k}="${v}"`).join(' ');
  return `<section${uniqueName} ${attributesStr}>${options.fn(this)}</section${uniqueName}>`;
}

export default sectionHelper;
