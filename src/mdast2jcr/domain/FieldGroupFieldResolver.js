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
 * The FieldResolver class attempts to resolve a node to a model's field.
 */
class FieldGroupFieldResolver {
  /**
   * Constructor.
   * @param {Component} component - the component associated with the model.
   */
  constructor(component) {
    this.component = component;
  }

  /**
   * Return the collapsed field name, that can support the node's heading depth.
   * If the field does not have a collapsed field that matches the heading
   * depth, then return undefined.
   * @param node - the node
   * @param field - the field
   * @return {Field} a field that matches the node or undefined
   */
  getFieldSupportingHeading(node, field) {
    const fieldsFromTemplate = Object.entries(this.component.defaultFields)
      .filter(([name]) => name.endsWith('Type'))
      .filter(([, value]) => value === `h${node.depth}`);

    // go through all the collapsed fields of the field and see if we can find
    // a field that matches the name of our best match from the template
    return field.collapsed
      .find((cf) => fieldsFromTemplate.find(([name]) => cf.name === name));
  }

  /**
   * Resolve the field.
   * @param {Node} node - the node
   * @param {{isGrouped: boolean, name: string, fields: [],
   * collapsed: [{isGrouped: boolean, name: string, fields: []}]}} fieldGroup - the field group
   */
  resolve(node, fieldGroup, hint) {
    const { fields } = fieldGroup;
    if (fields === undefined) {
      // throw an Error indicating the issue
      throw new Error(`Field group ${fieldGroup.name} does not have any fields defined.`);
    }

    // if a hint is provided, then we need to find the field that matches the hint
    if (hint) {
      const fieldIndex = fields.findIndex((field) => field.name === hint);
      if (fieldIndex !== -1) {
        const field = fields[fieldIndex];
        fields.splice(0, fieldIndex + 1);
        return field;
      }
    }

    let foundField = fields.find((field) => {
      if (node.type === 'heading' && field.collapsed?.find((c) => c.name.endsWith('Type'))) {
        // try to find a field that matches the heading depth, if we have one
        // then the field supports it so we can return true
        if (!this.getFieldSupportingHeading(node, field)) {
          // if the field does not match the heading type then we return false
          return false;
        }
        // if we have a match then we remove all fields up to and including the match
        fields.splice(0, fields.indexOf(field) + 1);
        return true;
      } else if (node.type === 'paragraph') {
        // is the first child an image?
        if (node.children[0]?.type === 'image') {
          // remove the field from fields
          fields.splice(fields.indexOf(field), 1);
          return true;
        }

        // do we have a link
        if (node.children[0]?.type === 'link') {
          fields.splice(fields.indexOf(field), 1);
          return true;
        }
        return false;
      }

      return false;
    });

    if (!foundField) {
      [foundField] = fields.splice(0, 1);
    }

    // if foundField is undefined then return the next field from the fields.
    return foundField;
  }
}

export default FieldGroupFieldResolver;
