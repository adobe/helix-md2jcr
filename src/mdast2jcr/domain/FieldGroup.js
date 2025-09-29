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
}

export default FieldGroup;
