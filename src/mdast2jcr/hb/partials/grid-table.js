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
import { remove } from 'unist-util-remove';
import { is } from 'unist-util-is';
import { toString } from 'mdast-util-to-string';
import Handlebars from 'handlebars';
import { toHast } from 'mdast-util-to-hast';
import { toHtml } from 'hast-util-to-html';
import { getComponentById, getComponentByTitle, getModelId } from '../../domain/Definitions.js';
import {
  findModelById,
  getField, getModelFieldNames,
} from '../../domain/Models.js';
import { findAll } from '../../utils/mdast.js';
import link from './supports/link.js';
import {
  encodeHtml, encodeHTMLEntities, sortJcrProperties, stripNewlines,
} from '../../utils.js';
import image from './supports/image.js';
import FieldGroupFieldResolver from '../../domain/FieldGroupFieldResolver.js';
import ModelHelper from '../../domain/ModelHelper.js';

/* eslint-disable no-console */

/**
 * @typedef {import('../../index.d.ts').FieldDef} Field
 * @typedef {import('../../index.d.ts').DefinitionDef} Definition
 * @typedef {import('../../index.d.ts').Filter} Filters
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
      const blockName = match.groups.blockName.trim();
      // try to locate the model name by inspecting the definition file
      const modelId = getModelId(definition, blockName);

      const block = {
        name: match.groups.blockName.trim(),
        classes: match.groups.classes ? match.groups.classes.split(',')
          .map((c) => c.trim()) : [],
      };

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
        if (suffix === 'Text' || suffix === 'Title') {
          const value = link.getProperties(node)[suffix.toLowerCase()];
          properties[field.name] = encodeHTMLEntities(value);
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
    let value;
    if (currentNode.type === 'wrapper') {
      // combine all the children into a single string, but wrap them in a paragraph
      value = currentNode.children.reduce((acc, node) => {
        const hast = toHast(node, {
          allowDangerousHtml: true,
        });

        let str = toHtml(hast, {
          allowDangerousHtml: true,
        });

        // don't wrap nodes that are already paragraphs or code blocks
        if (node.type !== 'paragraph' && node.type !== 'code') {
          str = `<p>${str}</p>`;
        }
        return acc + encodeHtml(str);
      }, '');
    } else {
      value = encodeHtml(toHtml(toHast(currentNode)));
    }

    // if the node is a code block then don't strip out the newlines
    properties[field.name] = find(currentNode, { type: 'code' }) ? value : stripNewlines(value);
  } else if (find(currentNode, { type: 'image' })) {
    const imageNode = find(currentNode, { type: 'image' });
    const { url } = image.getProperties(imageNode);
    properties[field.name] = encodeHTMLEntities(url);
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

function processCell(cell, fieldGroup, fieldResolver, properties) {
  const cellChildren = cell.children;

  if (cellChildren.length !== 0) {
    // while the cell has children we need to process the fields in the fieldGroup
    // if we run out of fields but there are still more nodes, then we need to throw an error
    // because the model does not map correctly to the content
    while (cellChildren.length > 0) {
      const node = cellChildren.shift();

      // have we run out of fields?
      if (fieldGroup.fields.length === 0) {
        let errorMsg = 'The content isn’t mapping to the model correctly, likely due to the import ';
        errorMsg += 'script generating incompatible markdown. Review the model file and ensure the ';
        errorMsg += 'import script meets all column and row requirements, every field must align ';
        errorMsg += 'with a column, even if empty.';
        throw new Error(errorMsg);
      }

      const field = fieldResolver.resolve(node, fieldGroup);

      let pWrapper;
      if (field.component === 'richtext') {
        pWrapper = {
          type: 'wrapper',
          children: [node],
        };

        let searching = true;

        while (searching) {
          const n = cellChildren.shift();
          if (!n) break;

          if (find(n, { type: 'image' })) {
            cellChildren.unshift(n);
            searching = false;
          }
          if (searching) {
            pWrapper.children.push(n);
          }
        }
      } else {
        pWrapper = node;
      }
      extractPropertiesForNode(field, pWrapper, properties);
    }
  }
}

function extractProperties(mdast, model, mode, component, fields, properties) {
  const fieldsCloned = structuredClone(fields);

  // the first cells is the header row, so we skip it
  // const nodes = findAll(mdast, (node) => node.type === 'gtCell', true);
  const rows = findAll(mdast, (node) => node.type === 'gtRow', false);
  let classesField;
  if (mode === 'blockItem') {
    classesField = getField(model, 'classes');
    // if our model defines a classes field then dig out the classes from the first cell
    if (classesField) {
      // if we are a block item we need to look at the first cell to see if it has any class
      // properties by inspecting the text value for any commas
      // if there is a comma that then becomes the classes property for the block item
      const firstCell = rows[0].children[0];
      const textValue = toString(firstCell);
      const classes = textValue.split(',').map((c) => c.trim());

      // discard the component name leaving only the block option names (class names)
      classes.shift();

      // if we are left with any classes to add to the block item, then add them
      if (classes.length > 0) {
        properties.classes = classesField?.multi === true
          ? `[${classes.join(', ')}]` : classes.join(', ');
      }
    }
  } else {
    // get rid of the header row, no need for that
    rows.shift();
  }

  const modelFields = fieldsCloned.map((group) => group.fields).flat();
  const fieldResolver = new FieldGroupFieldResolver(component);

  for (const [index, row] of rows.entries()) {
    if (modelFields.length === index || fieldsCloned.length === index) {
      break;
    }

    let fieldGroup = fieldsCloned[index];

    // gather all the cells from the row
    const cells = findAll(row, (node) => node.type === 'gtCell', false);

    // if we are block-item
    //   and we have a classess field
    //   and we have more cells than model fields...
    // We then want to throw away the first cell as it is the class field
    // EC currently does not add the classes field therefore more cells than model fields
    // See container-block.md for an example of more cells than model fields (second table)
    if (mode === 'blockItem' && classesField && (cells.length > modelFields.length)) {
      cells.shift();
    }

    if (mode === 'keyValue') {
      extractKeyValueProperties(row, model, fieldResolver, fieldGroup, properties);
    } else {
      for (const cell of cells) {
        if (mode === 'blockItem') {
          fieldGroup = fieldsCloned.shift();
        }
        processCell(cell, fieldGroup, fieldResolver, properties);
      }
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
  if (blockDetails.modelId) {
    props.model = blockDetails.modelId;
  }

  const model = findModelById(models, blockDetails.modelId);

  // section metadata may not have a model
  if (model) {
    const classesField = getField(model, 'classes');

    if (blockDetails.classes.length > 0 && classesField) {
      props.classes = (classesField.multi === true)
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
  const rows = findAll(mdast, (node) => node.type === 'gtRow', false);

  rows.forEach((row) => {
    const cellText = toString(row.children[0]);

    // the first cell may be defined as the component id (with optional classes)
    let componentId = cellText.split(',').shift().trim();

    // if we can't find the component id in the allowed components it means
    // the user has not specified what component to use therefore we fall back
    // to the first allowed component.
    if (allowedComponents.indexOf(componentId) === -1) {
      [componentId] = allowedComponents;
    }

    // check to see if we can use this component
    if (allowedComponents.includes(componentId)) {
      const fieldGroup = modelHelper.getModelFieldGroup(componentId);
      if (fieldGroup) {
        const component = getComponentById(definitions, componentId);
        const properties = {
          ...component.defaultFields,
          modelFields: `[${getModelFieldNames(fieldGroup.model).join(',')}]`,
        };

        extractProperties(row, fieldGroup.model, 'blockItem', component, fieldGroup.fields, properties);
        items.push(`<item_${items.length} jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/block/v1/block/item" name="${fieldGroup.model.id}" ${Object.entries(properties).map(([k, v]) => `${k}="${v}"`).join(' ')}></item_${items.length}>`);
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

  // if models is not an array throw an error
  if (!Array.isArray(models)) {
    throw new Error('Do you have a `*-models.json` file?');
  }

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
    if (component === undefined) {
      // we could possibly do a case-insensitive lookup?
      throw new Error(`The component '${blockHeaderProperties.name}' does not exist. Check the spelling of the component name.`);
    }
    mode = component.keyValue ? 'keyValue' : 'simple';
  }

  // Assign the template properties to the block properties
  const properties = {
    'sling:resourceType': 'core/franklin/components/block/v1/block',
    'jcr:primaryType': 'nt:unstructured',
    ...component.defaultFields,
    ...blockHeaderProperties,
  };

  if (model) {
    properties.modelFields = `[${getModelFieldNames(model).join(',')}]`;
  }

  let blockProperties = '';
  let fieldGroup;

  const modelHelper = new ModelHelper(
    blockHeaderProperties.name,
    models,
    definition,
    filters,
  );

  // children of the parent block
  let blockItems;

  // it is possible that a block (Accordion) does not have a model, but the
  // child component will, which will be handled in the Component Block Processing
  // section
  try {
    if (model) {
      fieldGroup = modelHelper.getModelFieldGroup(model.id);
      extractProperties(mdast, model, mode, component, fieldGroup.fields, properties);
    } else {
      // because we have no model we expect the block to have a filter with a component that does
      // so that means we can remove the header row from the mdast tree
      remove(mdast, (n) => is(n, { type: 'gtHeader' }));
    }

    // sort all the properties so that they are in a consistent order
    // helpful for debugging and xml readability
    const sorted = Object.entries(properties).sort(sortJcrProperties);
    blockProperties = sorted.map(([k, v]) => `${k}="${v}"`).join(' ');

    // *****************************************************
    // Component Block Processing
    // *****************************************************
    // 1. In this section attempt to locate the associated model for the block.
    // 2. Trim the mdast nodes to only be relevant for the child block.
    // 3. Then getBlockitems will process the mdast nodes and return the block items.
    const allowedComponents = filters.find((f) => f.id === component.filterId)?.components || [];
    // collect all rows
    const blockRows = findAll(mdast, (node) => node.type === 'gtRow', true);
    // the fieldGroup (parent model) determines the expected number of rows in the table
    // so we can remove the rows that belong to the parent and leave only the
    // relevant rows for the child
    if (model) {
      const removed = blockRows.splice(0, fieldGroup.fields.length + 1);
      // remove the elements from the mdast tree that match the items in the removed array
      removed.forEach((r) => {
        remove(mdast, (n) => is(n, r));
      });
    }
    blockItems = getBlockItems(mdast, modelHelper, definition, allowedComponents) || [];
  } catch (e) {
    const blockname = `${blockHeaderProperties.name} ${blockHeaderProperties.classes ? `(${blockHeaderProperties.classes})` : ''}`;
    const msg = `${blockname} has errors!`;
    throw new Error(`${msg}\n${e?.message || e}`);
  }

  return `<block${uniqueName} ${blockProperties}>${blockItems.length > 0 ? blockItems.join('\n') : ''}</block${uniqueName}>`;
}

export default gridTablePartial;
