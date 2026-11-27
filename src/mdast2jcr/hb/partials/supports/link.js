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
import { find } from 'unist-util-find';
import { toString } from 'mdast-util-to-string';

/** @typedef {import('mdast').Node} Node */

const link = {
  supports: (node) => find(node, { type: 'link' }) !== undefined,

  /**
   * Returns the type of the link based on the node's parent.  Links can be wrapped
   * in either strong or emphasis tags to denote primary and secondary links respectively.
   * @param parentNode {Node} The parent node of the link
   * @return {string} The type of the link (primary, secondary, or empty string)
   */
  getType: (parentNode) => {
    if (find(parentNode, { type: 'emphasis' })) {
      return 'secondary';
    }
    if (find(parentNode, { type: 'strong' })) {
      return 'primary';
    }
    return '';
  },

  getProperties: (child) => {
    const node = find(child, { type: 'link' });
    return {
      href: node.url,
      text: toString(node),
      title: node.title || '',
    };
  },

};

export default link;
