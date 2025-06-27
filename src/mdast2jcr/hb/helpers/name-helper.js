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

/**
 * An object that keeps track of the number of times a certain node has been
 * added.  Each time a node is added, the counter is incremented, thereby
 * generating a unique name for the node.
 */
const nameCounter = [];

/**
 * The name helper function keeps track of the number of times a certain node
 * has been created, and returns a unique name for it.  The format of the name
 * is the name of the node followed by an underscore and a number.  For example,
 * if the name of the node is 'title', the first node will have no underscore or
 * number.  A second occurrence of the node will have the name '_1', and so on.
 *
 * Special handling is done for the 'section' node.  The 'section' node is treated
 * as a top level node, and the name counter is reset each time a 'section' node.
 *
 * @param name The node name (e.g. 'title', 'section')
 * @returns {string} The unique name for the node (e.g. '', '_1', '_2')
 * or an empty string if the node is unique.
 */
function nameHelper(name) {
  // Support for per-context nameCounter
  const context = this || {};
  const counter = context.nameCounter || nameCounter;

  // reset the name counter if the node is a section or if the name counter is empty
  if (name === 'section' || !counter.length) {
    counter.push({});
  }

  // treat sections as a top level node and return the length of the name counter
  if (name === 'section') {
    return counter.length > 1 ? `_${counter.length - 1}` : '';
  }

  // get the current counter
  const currentCounter = counter[counter.length - 1];

  // increment the counter for the node name
  currentCounter[name] = (currentCounter[name] || 0) + 1;

  // return the counter value if it is greater than 1 (the node is not unique)
  return currentCounter[name] > 1 ? `_${currentCounter[name] - 1}` : '';
}

export function nameReset() {
  nameCounter.length = 0;
}

export default nameHelper;
