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

'use strict';

/*
   copied and adapted from
   https://github.com/syntax-tree/hast-util-to-mdast/blob/main/lib/handlers/table.js
 */

// Ensure the cells in a row are properly structured.
function toCells(children) {
  const nodes = [];
  let queue;

  children.forEach((node) => {
    if (node.type === 'tableCell') {
      if (queue) {
        // eslint-disable-next-line no-param-reassign
        node.children = queue.concat(node.children);
        queue = undefined;
      }

      nodes.push(node);
    } else {
      if (!queue) {
        queue = [];
      }
      queue.push(node);
    }
  });

  if (queue) {
    let node = nodes[nodes.length - 1];

    if (!node) {
      node = { type: 'tableCell', children: [] };
      nodes.push(node);
    }

    node.children = node.children.concat(queue);
  }

  return nodes;
}

// Ensure the rows are properly structured.
function toRows(children) {
  const nodes = [];
  let queue;

  children.forEach((node) => {
    if (node.type === 'tableRow') {
      if (queue) {
        // eslint-disable-next-line no-param-reassign
        node.children = queue.concat(node.children);
        queue = undefined;
      }

      nodes.push(node);
    } else {
      if (!queue) {
        queue = [];
      }
      queue.push(node);
    }
  });

  if (queue) {
    const node = nodes[nodes.length - 1];
    node.children = node.children.concat(queue);
  }
  nodes.forEach((node) => {
    // eslint-disable-next-line no-param-reassign
    node.children = toCells(node.children);
  });

  return nodes;
}

export default function table(state, node) {
  const mdNode = {
    type: 'table',
    children: toRows(state.all(node)),
    // clean up table in respect to row and colspan and compute alignments
    align: [],
    maxCols: 0,
  };

  // compute the number of cells in each row, respecting the row and col spans.
  const pendingRowSpans = [];
  for (const row of mdNode.children) {
    row.numCols = pendingRowSpans.shift() || 0;
    for (const cell of row.children) {
      const rowSpan = Number.parseInt(cell.data?.rowSpan || '1', 10);
      const colSpan = Number.parseInt(cell.data?.colSpan || '1', 10);
      if (cell.data?.align && !mdNode.align[row.numCols]) {
        mdNode.align[row.numCols] = cell.data.align;
      }
      row.numCols += colSpan;
      if (rowSpan > 1) {
        for (let i = 0; i < rowSpan - 1; i += 1) {
          pendingRowSpans[i] = (pendingRowSpans[i] || 0) + colSpan;
        }
      }
    }
    mdNode.maxCols = Math.max(mdNode.maxCols, row.numCols);
  }

  // add empty cells if needed
  for (const row of mdNode.children) {
    for (let i = row.numCols; i < mdNode.maxCols; i += 1) {
      row.children.push({ type: 'tableCell', children: [] });
    }
    delete row.numCols;
  }

  return mdNode;
}
