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
import {
  findModelById,
  getField,
  getModelFieldNames,
} from '../../domain/Models.js';
import { findAll } from '../../utils/mdast.js';
import { encodeHTMLEntities, stripNewlines } from '../../utils.js';
import link from '../partials/supports/link.js';
import image from '../partials/supports/image.js';

function buildPageMetadata(table, models) {
  const aemMapping = {
    description: 'jcr:description',
    canonical: 'cq:canonicalUrl',
    robots: 'cq:robotsTags',
    title: 'jcr:title',
  };

  const model = findModelById(models, 'page-metadata');

  const isMultiField = (fieldName) => {
    const field = getField(model, fieldName.name);
    return field && (field.component === 'multiselect' || field.component === 'aem-tag' || field.component === 'checkbox-group' || field.multi);
  };

  const metadata = {};
  const [, ...rows] = findAll(table, (node) => node.type === 'gtRow', false);
  rows.forEach((row) => {
    const cells = findAll(row, (node) => node.type === 'gtCell', true);
    const key = toString(cells[0]);

    // if the model has the field, then add it to the metadata
    let field;
    if (Object.keys(aemMapping).includes(key.toLowerCase())) {
      const aemValue = aemMapping[key.toLowerCase()];
      field = getField(model, aemValue);
    } else {
      field = getField(model, key);
    }

    if (field) {
      // if the field is an image then we need to dig into the row to find the image
      if (find(row.children[1], { type: 'image' })) {
        const { url } = image.getProperties(row);
        metadata['xwalk:imageReference'] = url;
      } else if (link.supports(row)) {
        const { href } = link.getProperties(row);
        metadata[field.name] = href;
      } else {
        let value = stripNewlines(cells[1]);
        if (isMultiField(field)) {
          value = value.split(',').map((v) => encodeHTMLEntities(v.trim()));
          value = value.length > 0 ? `[${value.join(',')}]` : '';
        } else {
          value = encodeHTMLEntities(value);
        }
        metadata[field.name] = value;
      }
    }
  });

  const mappedMetadata = { ...metadata };
  // we need to add a property called modelFields for the Universal Editor
  // that has all the fields for the model
  if (model) {
    const fields = getModelFieldNames(model);
    mappedMetadata.modelFields = `[${fields.join(',')}]`;
  }

  return mappedMetadata;
}

function pageHelper(options) {
  const {
    models,
    ...mdast
  } = options.data.root;

  const attributes = {
    'cq:template': '/libs/core/franklin/templates/page',
    'sling:resourceType': 'core/franklin/components/page/v1/page',
    'jcr:primaryType': 'cq:PageContent',
  };

  const tables = findAll(mdast, (node) => node.type === 'gridTable', false);
  if (tables) {
    tables.forEach((table) => {
      const cell = find(table, { type: 'gtCell' });
      if (cell) {
        const isMetadata = toString(cell).toLowerCase() === 'metadata';
        if (isMetadata) {
          const meta = buildPageMetadata(table, models, attributes);
          Object.assign(attributes, meta);
        }
      }
    });
  }

  // pull the image reference out of the attributes
  const { 'xwalk:imageReference': imageRef, ...properties } = attributes;
  const attributesStr = Object.entries(properties).map(([k, v]) => `${k}="${v}"`).join(' ');

  return `<jcr:content ${attributesStr}>
    ${options.fn(this)}
    ${imageRef ? `<image jcr:primaryType="nt:unstructured" fileReference="${imageRef}" />` : ''}
    </jcr:content>
  `;
}

export default pageHelper;
