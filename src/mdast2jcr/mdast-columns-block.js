/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { toString } from 'mdast-util-to-string';
import { findAllDeep } from './utils/mdast.js';
import link from './hb/partials/supports/link.js';
import image from './hb/partials/supports/image.js';

export function splitColumns(mdast) {
  const tables = findAllDeep(mdast, (node) => node.type === 'gridTable');

  tables.map((table) => {
    const header = findAllDeep(table, (node) => node.type === 'gtHeader');
    const value = toString(header);
    if (value.toLowerCase().startsWith('columns')) {
      // eslint-disable-next-line no-param-reassign
      table.type = 'columns';
    }
    return table;
  });

  // now that we have columns, we need to merge their children
  findAllDeep(mdast, (node) => node.type === 'columns').forEach((column) => {
    // find all rows of the table body
    const rows = findAllDeep(column.children[1], (node) => node.type === 'gtRow');

    rows.forEach((row) => {
      const cells = findAllDeep(row, (node) => node.type === 'gtCell');

      cells.forEach((cell) => {
        const newChildren = [];
        let paragraphGroup = [];

        const { children } = cell;

        // group elements that are not links or images into a paragraphWrapper
        // until the next link or image
        for (let i = 0; i < children.length; i += 1) {
          const node = children[i];
          // if we are a liink image, or heading we need to push the node to the new children
          // otherwise we need to group the node and its children into a paragraphWrapper
          if (node?.children?.length === 1
            && (node.children[0].type === 'link'
              || node.children[0].type === 'image'
              || node.type === 'heading')
          ) {
            // if we had previously grouped nodes we need to close them off and reset
            if (paragraphGroup.length > 0) {
              newChildren.push({
                type: 'paragraphWrapper',
                children: paragraphGroup,
              });
              // reset the paragraphGroup
              paragraphGroup = [];
            }

            // push the node as a new child
            if (image.supports(node) || link.supports(node)) {
              newChildren.push(node.children[0]);
            } else {
              newChildren.push(node);
            }
          } else {
            // we have something that needs to be grouped into a paragraphWrapper
            paragraphGroup.push(node);

            // if it's the last node, we need to add the paragraphWrapper to the newChildren
            if (i === children.length - 1) {
              newChildren.push({
                type: 'paragraphWrapper',
                children: paragraphGroup,
              });
            }
          }
        }
        // eslint-disable-next-line no-param-reassign
        cell.children = newChildren;
      });
    });
  });

  return mdast;
}
