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
import { toString } from 'mdast-util-to-string';
import { find } from 'unist-util-find';
import { findAllDeep } from '../../utils/mdast.js';
import whichPartialHelper from '../helpers/which-partial-helper.js';
import { getModelId } from '../../domain/Definitions.js';
import {
  findModelById,
  getField,
} from '../../domain/Models.js';

// eslint-disable-next-line no-unused-vars
function columnsPartial(context) {
  const {
    children: [tHeader, tBody],
    models,
    definition,
  } = context;

  const uniqueName = Handlebars.helpers.nameHelper.call(context, 'columns');

  const rows = findAllDeep(tBody, (node) => node.type === 'gtRow');
  const columns = findAllDeep(rows[0], (node) => node.type === 'gtCell');

  const textNode = find(tHeader, { type: 'text' });
  const regex = /^(?<blockName>[^(]+)\s*(\((?<classes>[^)]+)\))?$/;
  const match = toString(textNode).match(regex);

  let headerProps = {};

  if (match) {
    const blockName = match.groups.blockName.trim();
    const modelId = getModelId(definition, blockName) || 'columns';
    const blockClasses = match.groups.classes ? match.groups.classes.split(',').map((c) => c.trim()) : [];

    const model = findModelById(models, modelId);
    const classesField = getField(model, 'classes');
    let classes = [];

    if (blockClasses.length > 0 && classesField) {
      classes = (classesField.multi === true) ? `[${blockClasses.join(',')}]` : blockClasses.join(',');
    }

    headerProps = {
      // name: match.groups.blockName.trim(),
      // modelFields: `[${getModelFieldNames(model).join(',')}]`,
      classes,
      rows: rows.length,
      columns: columns.length,
    };

    // remove properties that are empty
    headerProps = Object.fromEntries(Object.entries(headerProps).filter(([_, v]) => v !== '' && (Array.isArray(v) ? v.length > 0 : v !== null)));
  }

  const attributes = {
    'sling:resourceType': 'core/franklin/components/columns/v1/columns',
    'jcr:primaryType': 'nt:unstructured',
    ...headerProps,
  };

  const rowEls = rows.map((row, rowIndex) => {
    const cells = findAllDeep(row, (node) => node.type === 'gtCell');
    const columnEls = cells.map((cell, cellIndex) => {
      // custom naming counter for columns
      const nameCounter = [{}];

      // const columnFilter = filters.find((f) => f.id === 'column');
      // const components = columnFilter?.components || [];

      // render the children of the cell by calling the associated default content partial function
      // eg. text, image, title, link
      const childrenEls = cell.children.map((child) => {
        const partial = whichPartialHelper(child.type);
        // we shouldn't get a unsupported partial as the mdast should have been cleaned up earlier
        // see mdast-columns-block.js how it cleans up the mdast tree
        if (partial === Handlebars.partials.unsupported) {
          throw new Error(`Unsupported node type in columns: ${child.type}`);
        }

        // call the partial to render the xml for this node, pass the name counter
        // to keep track of the unique names
        return partial({ ...child, nameCounter });
      });
      return `<col${cellIndex + 1} jcr:primaryType="nt:unstructured">${childrenEls.join('\n')}</col${cellIndex + 1}>`;
    });
    return `<row${rowIndex + 1} jcr:primaryType="nt:unstructured">${columnEls.join('\n')}</row${rowIndex + 1}>`;
  });

  const attributesStr = Object.entries(attributes).map(([k, v]) => `${k}="${v}"`).join(' ');
  return `<columns${uniqueName} ${attributesStr}>${rowEls.join('\n')}</columns${uniqueName}>`;
}

export default columnsPartial;
