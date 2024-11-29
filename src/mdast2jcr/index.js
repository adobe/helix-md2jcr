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

/* eslint-disable no-param-reassign */

import path from 'path';
import Handlebars from 'handlebars';
import { readFile } from 'fs/promises';
import xmlFormatter from 'xml-formatter';
import { splitSection, unwrapImages as unwrapElements, wrapParagraphs } from './utils.js';
import sanitizeHtml from './mdast-sanitize-html.js';
import headingPartial from './partials/heading.js';
import stringPartial from './partials/strong.js';
import emphasisPartial from './partials/emphasis.js';
import linkPartial from './partials/link.js';
import paragraphWrapperPartial from './partials/paragraph.js';
import nameHelper, { nameReset } from './helpers/name-helper.js';
import sectionHelper from './helpers/section-helper.js';
import imagePartial from './partials/image.js';
import encodeHelper from './helpers/encode-helper.js';
import whichPartialHelper from './helpers/which-partial-helper.js';
import gridTablePartial from './partials/grid-table.js';
import blockQuotePartial from './partials/blockquote.js';
import tablePartial from './partials/table.js';
import pageHelper from './helpers/page-helper.js';

/**
 * Converts a markdown AST to JCR XML.  This function is the main entry point
 * for the mdast2jcr module. The function takes a markdown AST and an options
 * object as input and returns a promise that resolves to a string containing
 * the JCR XML representation of the markdown AST.
 * @param mdast The markdown AST to convert to JCR XML.
 * @param {Mdast2JCROptions} options An options object that can be used to customize the conversion.
 * @returns {Promise<string>}
 */
export default async function mdast2jcr(mdast, options = {}) {
  mdast = sanitizeHtml(mdast);
  mdast = splitSection(mdast);
  mdast = unwrapElements(mdast);
  mdast = wrapParagraphs(mdast);

  Handlebars.registerPartial('heading', headingPartial);
  Handlebars.registerPartial('image', imagePartial);
  Handlebars.registerPartial('link', linkPartial);
  Handlebars.registerPartial('strong', stringPartial);
  Handlebars.registerPartial('emphasis', emphasisPartial);
  Handlebars.registerPartial('paragraphWrapper', paragraphWrapperPartial);
  Handlebars.registerPartial('gridTable', gridTablePartial);
  Handlebars.registerPartial('blockquote', blockQuotePartial); // TODO
  Handlebars.registerPartial('table', tablePartial); // TODO

  Handlebars.registerHelper('whichPartial', whichPartialHelper);
  Handlebars.registerHelper('encode', encodeHelper);
  Handlebars.registerHelper('nameHelper', nameHelper);
  Handlebars.registerHelper('section', sectionHelper);
  Handlebars.registerHelper('page', pageHelper);

  // reset the name helper counter
  nameReset();

  // register page template
  const pageTemplateXML = await readFile(
    path.resolve('./src/mdast2jcr', 'templates', 'page.xml'),
    'utf-8',
  );

  const template = Handlebars.compile(pageTemplateXML);

  const ctx = {
    models: options.models,
    definition: options.definition,
    filters: options.filters,
    children: mdast.children,
  };

  let xml = template(ctx);

  xml = xmlFormatter(xml, {
    indentation: '  ', // 2 spaces
    filter: (node) => node.type !== 'Comment', // Remove comments
    collapseContent: true,
    lineSeparator: '\n',
  });

  process.stdout.write(xml);

  process.stdout.write('\n');
  process.stdout.write('==================================================\n');
  return xml;
}
