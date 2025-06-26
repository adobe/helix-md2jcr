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

import { visit } from 'unist-util-visit';

/**
 * findAll goes through the children of a node searching for nodes that match a
 * test function.
 *
 * @param node the node to search through.
 * @param test the test function
 * @param flatten if true, the function will return the children of the matching nodes, without
 * their parent.
 * @return {*[]} an array of nodes that match the test function.
 */
function findAll(node, test, flatten = false) {
  // given the root of the mdast tree, find all the nodes that are identified by the test function
  const results = [];

  if (test(node)) {
    results.push(node);
    return results;
  }

  if (node.children) {
    node.children.forEach((child) => {
      results.push(...findAll(child, test));
    });
  }

  if (flatten) {
    return results.map((c) => c.children).flat();
  } else {
    return results;
  }
}

/**
 * Find all nodes that match the test condition
 * @param {Node} tree - Node(s) to search
 * @param {Function|string} test - Test function or node type
 * @returns {Array} Array of matching nodes
 */
function findAllDeep(tree, test) {
  const results = [];
  visit(tree, test, (node) => {
    results.push(node);
  });
  return results;
}

export {
  findAll,
  findAllDeep,
};
