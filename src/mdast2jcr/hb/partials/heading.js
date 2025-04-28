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

function heading(context) {
// You can access the context here and return a string based on it
  const uniqueName = Handlebars.helpers.nameHelper.call(context, 'title');
  const { depth } = context;

  const parseInlineElements = (node) => {
    if (node.type === 'text') {
      return node.value;
    }
    if (node.type === 'emphasis') {
      return `<em>${node.children.map(parseInlineElements).join('')}</em>`;
    }
    if (node.type === 'strong') {
      return `<strong>${node.children.map(parseInlineElements).join('')}</strong>`;
    }
    if (node.type === 'link') {
      return `<a href="${node.url}">${node.children.map(parseInlineElements).join('')}</a>`;
    }
    if (node.type === 'inlineCode') {
      return `<code>${node.value}</code>`;
    }
    if (node.type === 'image') {
      return `<img src="${node.url}" alt="${node.alt}"/>`;
    }
    if (node.type === 'html') {
      return node.value; // HTML tags are included directly
    }
    return '';
  };

  let title = '';
  // Traverse the children of the heading to build the title, there can be
  // multiple children that contribute to the title like text, link, strong, etc.

  title = Handlebars.Utils.escapeExpression(context.children.map(parseInlineElements).join(''));

  return `<title${uniqueName} sling:resourceType="core/franklin/components/title/v1/title" jcr:primaryType="nt:unstructured" title="${title}" titleType="h${depth}"/>\n`;
}

export default heading;
