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
import Handlebars from 'handlebars';
import { toHast } from 'mdast-util-to-hast';
import { toHtml } from 'hast-util-to-html';
import { getComponentById, getComponentByTitle, getModelId } from '../utils/Definitions.js';
import {
  findModelById, getField,
} from '../utils/Models.js';
import { findAll } from '../utils/mdast.js';
import link from './supports/link.js';
import {
  encodeHtml, encodeHTMLEntities, sortJcrProperties, stripNewlines,
} from '../utils.js';
import image from './supports/image.js';
import FieldResolver from '../models/FieldResolver.js';
import ModelHelper from '../models/ModelHelper.js';

/**
 * @typedef {import('../index.d.ts').FieldDef} Field
 * @typedef {import('../index.d.ts').DefinitionDef} Definition
 */

/**
 * Locate the name of the Block and any classes that are associated with it.
 * Return null if the block name can not be found in the models.
 * @param mdast {object} - the mdast tree
 * @param {Definition} definition - the definitions object.
 * @returns {null|{name: string, classes: string[]}, modelId: string} - the name of the
 * block, any classes, and an associated model id.
 */
function getBlockDetails(mdast, definition) {
  const header = find(mdast, { type: 'gtHeader' });
  if (header) {
    const textNode = find(header, { type: 'text' });
    // if the textNode.value looks like "block (foo, bar)", return an object that looks like
    // { name: "block", classes: ["foo", "bar"] }
    const regex = /^(?<blockName>[^(]+)\s*(\((?<classes>[^)]+)\))?$/;
    const match = toString(textNode).match(regex);

    if (match) {
      const block = {
        name: match.groups.blockName.trim(),
        classes: match.groups.classes ? match.groups.classes.split(',')
          .map((c) => c.trim()) : [],
      };

      // try to locate the model name by inspecting the definition file
      const modelId = getModelId(definition, block.name);

      if (modelId) {
        block.modelId = modelId;
      } else if (block.name.toLowerCase() === 'metadata') {
        block.modelId = 'page-metadata';
      } else if (block.name.toLowerCase() === 'section metadata') {
        block.modelId = 'section-metadata';
      }
      return block;
    }
  }
  return null;
}

/**
 * Process the field and collapse the field into the properties object.
 * @param id {string} - the id of the field
 * @param fields {Array<Field>} - the fields array
 * @param node {Node} - the node to process
 * @param parentNode {Node} - the parent node if necessary to inspect the child's parent for details
 * @param properties {object} - the properties object
 */
function collapseField(id, fields, node, parentNode, properties) {
  /* eslint-disable no-param-reassign */
  if (!fields) {
    return;
  }

  const suffixes = ['Alt', 'Type', 'MimeType', 'Text', 'Title'];
  suffixes.forEach((suffix) => {
    const field = fields.find((f) => f.name === `${id}${suffix}`);
    if (field) {
      if (suffix === 'Type') {
        // a heading can have a type like h1, h2
        if (node.type === 'heading') {
          properties[field.name] = `h${node.depth}`;
        } else if (link.supports(node)) {
          // determine the type of the link by inspecting the parent node
          // links can be wrapped in strong or em tags, or have no wrapping
          properties[field.name] = link.getType(parentNode);
        }
      } else if (link.supports(node)) {
        if (suffix === 'Text') {
          properties[field.name] = encodeHTMLEntities(link.getProperties(node).text);
        } else {
          properties[field.name] = encodeHTMLEntities(node[suffix.toLowerCase()]);
        }
      } else if (suffix === 'MimeType') {
        // TODO: can we guess the mime type from the src?
        properties[field.name] = 'image/unknown';
      } else {
        // take the suffix and read the property from the node
        properties[field.name] = encodeHTMLEntities(node[suffix.toLowerCase()]);
      }

      // clean out any empty properties so that we don't pollute the output
      if (!properties[field.name]) {
        delete properties[field.name];
      }
    }
  });
}

function extractPropertiesForNode(field, currentNode, properties) {
  const fields = field.collapsed;

  if (field.component === 'richtext') {
    // obtain the html by taking the mdast and converting it to hast and then to html
    const hast = toHast(currentNode);
    const encoded = encodeHtml(toHtml(hast));
    properties[field.name] = stripNewlines(encoded);
  } else if (field.component === 'reference') {
    const imageNode = find(currentNode, { type: 'image' });
    const { url } = image.getProperties(imageNode);
    properties[field.name] = url;
    collapseField(field.name, fields, imageNode, null, properties);
  } else {
    const linkNode = find(currentNode, { type: 'link' });
    const headlineNode = find(currentNode, { type: 'heading' });
    if (linkNode) {
      properties[field.name] = linkNode.url;
      collapseField(field.name, fields, linkNode, currentNode, properties);
    } else if (headlineNode) {
      properties[field.name] = encodeHTMLEntities(toString(headlineNode));
      collapseField(field.name, fields, headlineNode, null, properties);
    } else {
      let value = encodeHTMLEntities(toString(currentNode));
      if (field.component === 'multiselect' || field.component === 'aem-tag') {
        value = `[${value.split(',')
          .map((v) => v.trim())
          .join(',')}]`;
      }
      if (value) {
        properties[field.name] = stripNewlines(value);
        collapseField(field.name, fields, currentNode, null, properties);
      }
    }
  }
}

function extractKeyValueProperties(row, model, fieldResolver, fieldGroup, properties) {
  const [, ...nodes] = findAll(row, (node) => node.type === 'gtCell', true);

  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    const field = fieldResolver.resolve(node, fieldGroup);
    extractPropertiesForNode(field, node, properties);
  }
}

/**
 * Given a row, a component, and a model, extract the properties from the row
 * @param {object} mdast - the mdast tree.
 * @param {Model} model - the model.
 * @param {string} mode - the mode either 'keyValue' or 'simple'.
 * @param {Component} component - the component.
 * @param fields - the field grouping object.
 * @param properties
 * @return {{}} - the properties
 */
function extractProperties(mdast, model, mode, component, fields, properties) {
  const fieldsCloned = structuredClone(fields);

  // the first cells is the header row, so we skip it
  // const nodes = findAll(mdast, (node) => node.type === 'gtCell', true);
  const rows = findAll(mdast, (node) => node.type === 'gtRow', false);
  if (mode !== 'blockItem') {
    rows.shift();
  } else {
    const classesField = getField(model, 'classes');
    // if our model defines a classes field then dig out the classes from the first cell
    if (classesField) {
      // if we are a block item we need to look at the first cell to see if it has any class
      // properties by inspecting the text value for any commas
      // if there is a comma that then becomes the classes property for the block item
      const firstCell = rows[0].children[0];
      const textValue = toString(firstCell);
      const classes = textValue.split(',').map((c) => c.trim());

      // discard the component name leaving only the block option names (classes names)
      if (classes.length > 1) {
        classes.shift();
      }

      // if we are left with any classes to add to the block item, then add them
      if (classes.length > 0) {
        properties.classes = (classesField.component === 'multiselect')
          ? `[${classes.join(', ')}]` : classes.join(', ');
      }
    }
  }

  const nodesToUse = fieldsCloned.map((group) => group.fields).flat();
  const fieldResolver = new FieldResolver(model, component);

  for (const [index, row] of rows.entries()) {
    if (nodesToUse.length === index) {
      break;
    }

    let fieldGroup = fieldsCloned[index];

    let nodes;
    if (mode === 'blockItem') {
      ([, ...nodes] = findAll(row, (node) => node.type === 'gtCell', true));
    } else {
      nodes = findAll(row, (node) => node.type === 'gtCell', true);
    }

    if (mode === 'keyValue') {
      extractKeyValueProperties(row, model, fieldResolver, fieldGroup, properties);
    } else {
      nodes.forEach((node) => {
        if (mode === 'blockItem') {
          fieldGroup = fieldsCloned.shift();
        }
        const field = fieldResolver.resolve(node, fieldGroup);
        extractPropertiesForNode(field, node, properties);
      });
    }
  }
}

/**
 * Extract the properties that are belong to the block header.  Properties like
 * name, model id, and classes.
 * @param {Array<Model>} models - the models object
 * @param {Definition} definition - the definitions object
 * @param {object} mdast - the mdast tree
 * @return {{
 *   name: string,
 *   model: string,
 *   classes?: string
 * }}
 */
function extractBlockHeaderProperties(models, definition, mdast) {
  const blockDetails = getBlockDetails(mdast, definition);
  const props = {};

  props.name = blockDetails.name;
  props.model = blockDetails.modelId;

  const model = findModelById(models, blockDetails.modelId);

  // section metadata may not have a model
  if (model) {
    const classesField = getField(model, 'classes');

    if (blockDetails.classes.length > 0 && classesField) {
      props.classes = (classesField.component === 'multiselect')
        ? `[${blockDetails.classes.join(', ')}]` : blockDetails.classes.join(', ');
    }
  }

  return props;
}

function getBlockItems(mdast, modelHelper, definitions, allowedComponents) {
  // if there are no allowed components then we can't do anything
  if (!allowedComponents.length) {
    return undefined;
  }

  const items = [];
  // get all rows after the header that are more than one cell wide
  const rows = findAll(mdast, (node) => node.type === 'gtRow' && node.children.length > 1, false);

  rows.forEach((row, i) => {
    const properties = {};
    const cellText = toString(row.children[0]);
    const componentId = cellText.split(',').shift().trim();
    // check to see if we can use this component
    if (allowedComponents.includes(componentId)) {
      const fieldGroup = modelHelper.getFieldGroup(componentId);
      if (fieldGroup) {
        const component = getComponentById(definitions, componentId);
        extractProperties(row, fieldGroup.model, 'blockItem', component, fieldGroup.fields, properties);
        items.push(`<item_${i} sling:resourceType="core/franklin/components/block/v1/block/item" name="${fieldGroup.model.id}" ${Object.entries(properties).map(([k, v]) => `${k}="${v}"`).join(' ')}></item_${i}>`);
      }
    }
  });

  return items;
}

/**
 * The gridTablePartial function is a Handlebars partial that generates a block element.
 * @param {{models: Array<Model>,
 * definition: Definition,
 * filters: Filters,
 * mdast: object}} context - The context
 * object that contains the models, definition, and mdast.
 * @return {string} - The generated block element.
 */
function gridTablePartial(context) {
  const {
    models,
    definition,
    filters,
    ...mdast
  } = context;

  const uniqueName = Handlebars.helpers.nameHelper.call(context, 'block');

  // assign the header properties to the block properties
  const blockHeaderProperties = extractBlockHeaderProperties(models, definition, mdast);

  // now that we have the name of the block, we can find the associated model
  const model = findModelById(models, blockHeaderProperties.model);

  let component;
  let mode = 'simple';

  // both pageHelper metadata and section metadata are tables, but we don't want to process them
  // here they have been processed by the page helper partial and section helper.
  if (blockHeaderProperties.model === 'section-metadata' || blockHeaderProperties.model === 'page-metadata') {
    // we already processed pageHelper metadata in the pageHelper helper
    return '';
  } else {
    component = getComponentByTitle(definition, blockHeaderProperties.name);
    mode = component.keyValue ? 'keyValue' : 'simple';
  }

  // Assign the template properties to the block properties
  const properties = {
    'sling:resourceType': 'core/franklin/components/link/v1/block',
    'jcr:primaryType': 'nt:unstructured',
    ...component.defaultFields,
    ...blockHeaderProperties,
  };

  const modelHelper = new ModelHelper(
    blockHeaderProperties.name,
    models,
    definition,
    filters,
  );

  const fieldGroup = modelHelper.getFieldGroup(model.id);
  extractProperties(mdast, model, mode, component, fieldGroup.fields, properties);

  // sort all the properties so that they are in a consistent order
  // helpful for debugging and xml readability
  const sorted = Object.entries(properties).sort(sortJcrProperties);
  const attributesStr = sorted.map(([k, v]) => `${k}="${v}"`).join(' ');

  const allowedComponents = filters.find((f) => f.id === component.filterId)?.components || [];
  const blockItems = getBlockItems(mdast, modelHelper, definition, allowedComponents) || [];

  return `<block${uniqueName} ${attributesStr}>${blockItems.length > 0 ? blockItems.join('\n') : ''}</block${uniqueName}>`;
}

export default gridTablePartial;
