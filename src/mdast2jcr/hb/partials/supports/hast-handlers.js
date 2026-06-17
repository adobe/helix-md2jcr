/*
 * Copyright 2026 Adobe. All rights reserved.
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
 * Creates a hast handler that maps a custom mdast node type to an inline HTML element.
 * mdast-util-to-hast has no built-in knowledge of superscript/subscript/underline nodes
 * (introduced by mdast-sanitize-html), so without these handlers those nodes fall back
 * to <div>, losing the semantic tag.
 *
 * @param {string} tagName - HTML tag to emit (e.g. 'sup', 'sub', 'u')
 * @returns {function(State, Node): Element} hast handler
 */
function formatHandler(tagName) {
  return (state, node) => ({
    type: 'element',
    tagName,
    properties: {},
    children: state.all(node),
  });
}

/**
 * Custom hast handlers for mdast node types that mdast-util-to-hast does not recognize
 * by default. Pass these as the `handlers` option wherever toHast() is called so that
 * inline formatting round-trips correctly through the mdast → hast → HTML pipeline.
 */
export const customHastHandlers = {
  superscript: formatHandler('sup'),
  subscript: formatHandler('sub'),
  underline: formatHandler('u'),
};
