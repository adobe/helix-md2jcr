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
import {
  findModelById,
  getField,
  getModelFieldNames,
} from '../../domain/Models.js';

/**
 * Normalizes strings by converting to lowercase and replacing spaces with hyphens
 * @param {string} str
 * @return {string}
 */
function normalizeString(str) {
  return str.toLowerCase().replaceAll(' ', '-');
}

/**
 * Helper function to find the section model ID from the grid table.
 * @param {Node} tree
 * @return {string|null}
 */
function getSectionModelId(tree) {
  const blockModelIdCell = find(tree, { type: 'text', value: 'blockModelId' });
  if (!blockModelIdCell) {
    return null;
  }

  const parentRow = find(tree, (node) => node.type === 'gtRow' && find(node, (child) => child === blockModelIdCell));

  if (!parentRow) {
    return null;
  }

  const cells = findAll(parentRow, (node) => node.type === 'gtCell', true);
  return cells.length > 1 ? toString(cells[1]) : null;
}

/**
 * Processes metadata rows and extracts field values
 * @param {Array} rows
 * @param {Model} model
 * @return {object} result with attributes and modelFields
 */
function processMetadataRows(rows, model) {
  const attributes = {};

  // always push the model fields so UE can use them, even if no attributes are found
  const modelFields = getModelFieldNames(model);

  for (const row of rows) {
    const cells = findAll(row, (n) => n.type === 'gtCell', true);
    if (cells.length < 2) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const key = toString(cells[0])?.trim();
    const value = toString(cells[1])?.trim();

    // Skip empty keys/values and the special blockModelId field
    if (!key || !value || key === 'blockModelId') {
      // eslint-disable-next-line no-continue
      continue;
    }

    const field = getField(model, key);
    if (!field) {
      // eslint-disable-next-line no-continue
      continue;
    }

    if (field.component === 'multiselect') {
      const multiValue = value.split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      attributes[key] = `[${multiValue.join(',')}]`;
    } else {
      attributes[key] = value;
    }
  }

  return { attributes, modelFields };
}

/**
 * Finds and processes the section metadata table
 * @param {Array} children
 * @param {Array} models
 * @return {object|null}
 */
function findSectionMetadata(children, models) {
  for (const child of children) {
    if (child.type !== 'gridTable') {
      // eslint-disable-next-line no-continue
      continue;
    }

    const headerCell = find(child, { type: 'gtCell' });
    if (!headerCell) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const isMetadata = normalizeString(toString(headerCell)) === 'section-metadata';
    if (!isMetadata) {
      // eslint-disable-next-line no-continue
      continue;
    }

    // Found section metadata table
    const sectionModelId = getSectionModelId(child) || 'section';
    const model = findModelById(models, sectionModelId);

    if (!model) {
      return null;
    }

    const [, ...rows] = findAll(child, (n) => n.type === 'gtRow', false);

    const result = processMetadataRows(rows, model);

    return {
      attributes: result.attributes,
      modelFields: result.modelFields,
    };
  }

  // see if there is a global section model to use
  const sectionModel = findModelById(models, 'section');
  if (!sectionModel) {
    return null;
  }

  return {
    modelFields: getModelFieldNames(sectionModel),
  };
}

function sectionHelper(index, children, options) {
  const { models } = options.data.root;
  const uniqueName = Handlebars.helpers.nameHelper.call(this, 'section');

  const metadataResult = findSectionMetadata(children, models);

  let attributes = {
    'sling:resourceType': 'core/franklin/components/section/v1/section',
    'jcr:primaryType': 'nt:unstructured',
  };
  let modelFields = [];

  if (metadataResult) {
    attributes = { ...attributes, ...metadataResult.attributes };
    modelFields = metadataResult.modelFields;
  }

  if (modelFields.length > 0) {
    attributes.modelFields = `[${modelFields.join(',')}]`;
  }

  const attributesStr = Object.entries(attributes)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');

  return `<section${uniqueName} ${attributesStr}>${options.fn(this)}</section${uniqueName}>`;
}

export default sectionHelper;
