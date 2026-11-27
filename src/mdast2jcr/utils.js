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
import Handlebars from 'handlebars';
import { toString } from 'mdast-util-to-string';

/* eslint-disable no-param-reassign */

/**
 * This method modifies the mdast tree in place. Given a flat list of nodes,
 * gather the children of each section and wrap them in a section node.
 * For example given a mdast tree of:
 * [Heading, Text, Image, ThematicBreak, Text, ThematicBreak, Text] would
 * result in [Section[Heading, Text, Image], Section[Text], Section[Text]].
 */
export function splitSection(mdast) {
  // obtain the index of all thematicBreak nodes from the list of children
  const thematicBreakIndexes = mdast.children
    .filter((node) => node.type === 'thematicBreak')
    // then get their index in the list of children
    .map((node) => mdast.children.indexOf(node));

  // find pairwise permutations of spaces between blocks
  // include the very start and end of the document
  const starts = [0, ...thematicBreakIndexes];
  const ends = [...thematicBreakIndexes, mdast.children.length];

  // content.mdast.children = _.zip(starts, ends)
  const nodes = starts
    .map((k, i) => [k, ends[i]])
    // but filter out empty section
    .filter(([start, end]) => start !== end);
    // then return all nodes that are in between

  mdast.children = nodes.map(([start, end]) => {
    // skip 'thematicBreak' nodes
    const index = mdast.children[start].type === 'thematicBreak' ? start + 1 : start;
    return {
      type: 'section',
      children: mdast.children.slice(index, end),
    };
  });

  // unwrap sole section directly on the root
  // if (mdast.children.length === 1 && mdast.children[0].type === 'section') {
  //   mdast.children = mdast.children[0].children;
  // }

  return mdast;
}

export function wrapParagraphs(mdast) {
  const sections = mdast.children.filter((node) => node.type === 'section');

  sections.forEach((section) => {
    const { children } = section;
    const newChildren = [];
    let paragraphGroup = [];

    // process.stdout.write('==================================================\n');
    // process.stdout.write(inspect(section));
    // process.stdout.write('\n');
    // process.stdout.write('==================================================\n');

    for (let i = 0; i < children.length; i += 1) {
      const node = children[i];

      // Group paragraph and heading (depth >= 3) into the same paragraphWrapper
      // group strong and emphasis into the same paragraphWrapper if they are not a button
      if (node.type === 'paragraph'
        || node.type === 'list'
        || node.type === 'code'
        || (node.type === 'heading' && node.depth >= 3)
        || (node.type === 'strong' && (node.children.length !== 1 || (node.children.length === 1 && node.children[0].type !== 'link')))
        || (node.type === 'emphasis' && (node.children.length !== 1 || (node.children.length === 1 && node.children[0].type !== 'link')))
      ) {
        paragraphGroup.push(node);

        if (i === children.length - 1) {
          newChildren.push({
            type: 'paragraphWrapper',
            children: paragraphGroup,
          });
        }
      } else {
        if (paragraphGroup.length > 0) {
          newChildren.push({
            type: 'paragraphWrapper',
            children: paragraphGroup,
          });
          paragraphGroup = [];
        }
        newChildren.push(node);
      }
    }
    section.children = newChildren;

    // process.stdout.write('==================================================\n');
    // process.stdout.write(inspect(section));
    // process.stdout.write('\n');
    // process.stdout.write('==================================================\n');
  });
  return mdast;
}

export function unwrapImages(mdast) {
  const sections = mdast.children.filter((node) => node.type === 'section');

  sections.forEach((section) => {
    const newChildren = [];

    for (const node of section.children) {
      if (node.type === 'paragraph') {
        let currentText = [];
        const images = [];

        // Handle single child unwrapping for `link`, `strong`, and `em`
        if (node.children.length === 1) {
          const onlyChild = node.children[0];
          if (['link', 'strong', 'emphasis'].includes(onlyChild.type)) {
            // Move the single child outside the paragraph
            newChildren.push(onlyChild);
            // eslint-disable-next-line no-continue
            continue; // Skip further processing of this paragraph node
          }
        }

        // process.stdout.write('==================================================\n');
        // process.stdout.write(inspect(node));
        // process.stdout.write('\n');
        // process.stdout.write('==================================================\n');

        // Traverse paragraph children to separate images and text nodes
        for (let i = 0; i < node.children.length; i += 1) {
          const child = node.children[i];

          if (child.type === 'image') {
            // If we have accumulated text, push it as a paragraph before the image
            if (currentText.length > 0) {
              newChildren.push({
                type: 'paragraph',
                children: currentText,
                position: node.position,
              });
              currentText = [];
            }
            // Push the image outside the paragraph
            images.push(child);
          } else {
            // Collect non-image children as part of the paragraph
            currentText.push(child);
          }
        }

        // If there are remaining text nodes, add them as a paragraph
        if (currentText.length > 0) {
          newChildren.push({
            type: 'paragraph',
            children: currentText,
            position: node.position,
          });
        }

        // Move all images to their proper position in the parent tree
        newChildren.push(...images);
      } else {
        // Non-paragraph nodes stay as they are
        newChildren.push(node);
      }
    }

    section.children = newChildren;
  });
  return mdast;
}

class PreEncodedAttribute {
  constructor(value) {
    this.value = value === null || value === undefined ? '' : String(value);
  }
}

/**
 * Mark an attribute value as already XML-escaped so serializeXmlAttributes
 * does not double-escape it (used for richtext encoded via encodeHtml).
 * @param {string} value - Pre-escaped XML attribute value.
 * @return {PreEncodedAttribute}
 */
export function preEncodedAttribute(value) {
  return new PreEncodedAttribute(value);
}

/**
 * Escape a raw value for safe inclusion inside a double-quoted XML attribute.
 * @param {*} value - The raw attribute value.
 * @return {string} The XML-escaped attribute value.
 */
export function escapeXmlAttribute(value) {
  if (value instanceof PreEncodedAttribute) {
    return value.value;
  }
  if (value === null || value === undefined) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Serialize a map or entry list of attributes into an XML attribute string,
 * escaping every value for double-quoted XML attributes.
 * @param {Object<string, *>|Array<[string, *]>} attributes - Attributes object or entries.
 * @return {string} Space-separated `key="escapedValue"` string.
 */
export function serializeXmlAttributes(attributes) {
  const entries = Array.isArray(attributes) ? attributes : Object.entries(attributes);
  return entries
    .map(([k, v]) => `${k}="${escapeXmlAttribute(v)}"`)
    .join(' ');
}

export function encodeHtml(str) {
  return Handlebars.escapeExpression(str);
}

/**
 * Strip the new line characters from the given value.  If the value is of Node, toString
 * is then performed and then a replacement occurs.  If the value is a string, a simple replace
 * is performed.
 * @param value the string or Node to strip newlines from.
 * @return {string} the string with newlines replaced with spaces.
 */
export function stripNewlines(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.replace(/\n/g, ' ').trim();
  }
  return toString(value).replace(/\n/g, ' ').trim();
}

/**
 * Sort properties by the following order: sling, jcr, other.
 * @param {string} p1 - property 1
 * @param {string} p2 - property 2
 * @return {number} -1 if p1 is before p2, 1 if p2 is before p1, 0 if they are equal.
 */
export const sortJcrProperties = ([p1], [p2]) => {
  if (p1.startsWith('sling:')) {
    return -1;
  }
  if (p2.startsWith('sling:')) {
    return 1;
  }
  if (p1.startsWith('jcr:')) {
    return -1;
  }
  if (p2.startsWith('jcr:')) {
    return 1;
  }
  return p1.localeCompare(p2);
};
