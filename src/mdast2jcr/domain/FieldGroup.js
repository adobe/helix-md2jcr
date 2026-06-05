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
 * Recursively checks whether a field's options tree contains an entry matching
 * the given value by either its `value` or `name` property.
 * @param {Array<object>} options - The options array from a model field.
 * @param {string} value - The value to search for.
 * @return {boolean}
 */
export function optionsIncludeValue(options, value) {
  return options.some((option) => {
    if (option.value === value || option.name === value) {
      return true;
    }
    return option.children ? optionsIncludeValue(option.children, value) : false;
  });
}

class FieldGroup {
  /**
   * Constructor.
   * @param {Model} model the model to use for the field group.
   */
  constructor(model) {
    this.model = model;

    // protect against missing fields
    if (!this.model.fields) {
      this.model.fields = [];
    }

    this.fields = [];
    this._groupFields();
  }

  /**
   * Group the fields in the model by their group name.
   * @return {*[]}
   */
  _groupFields() {
    const suffixes = ['Alt', 'MimeType', 'Type', 'Text', 'Title'];

    this.model.fields
      .filter((field) => field.component !== 'tab')
      .filter((field) => field.name !== 'classes')
      .forEach((field) => {
        if (field.name.includes('_')) {
          const groupName = field.name.split('_')[0];
          const groupObj = this.fields.find((item) => item.name === groupName) || {
            name: groupName,
            fields: [],
          };

          if (!this.fields.includes(groupObj)) {
            this.fields.push(groupObj);
          }

          const suffix = suffixes.find((s) => field.name.endsWith(s));
          const collapsedName = field.name.substring(0, field.name.lastIndexOf(suffix));
          const collapsedField = groupObj.fields.find((item) => item.name === collapsedName);

          if (collapsedField) {
            collapsedField.collapsed = collapsedField.collapsed || [];
            collapsedField.collapsed.push(field);
          } else {
            groupObj.fields.push(field);
          }
        } else {
          const suffix = suffixes.find((s) => field.name.endsWith(s));
          const groupName = field.name.substring(0, field.name.indexOf(suffix));
          let groupObj = this.fields.find((item) => item.name === groupName);

          if (!groupObj) {
            groupObj = {
              name: field.name,
              fields: [field],
            };
            this.fields.push(groupObj);
          } else {
            // find the field in the group that has a name that starts with the field.name
            const collapsedField = groupObj.fields.find((item) => field.name.startsWith(item.name));
            if (!collapsedField) {
              throw new Error(`Unable to find the collapsed field for field: ${field.name}`);
            }
            collapsedField.collapsed = collapsedField.collapsed || [];
            collapsedField.collapsed.push(field);
          }
        }
      });
  }

  /**
   * Returns true if the first field in this group has an options list that includes
   * the given value. Used to distinguish a valid parent-property value from a
   * child component id when a single-cell row is encountered.
   * @param {string} value - The cell text to test against the field's options.
   * @return {boolean}
   */
  fieldHasMatchingOption(value) {
    const firstField = this.fields[0]?.fields[0];
    return firstField?.options ? optionsIncludeValue(firstField.options, value) : false;
  }
}

export default FieldGroup;
