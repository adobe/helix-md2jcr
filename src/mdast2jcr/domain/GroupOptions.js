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
import { isGroupField } from './Models.js';

/**
 * @typedef {import('../index.d.ts').ModelDef} Model
 */

/**
 * Recursively collect every option `value` from a field's options tree
 * (options may be nested under `children`).
 * @param {Array<object>} options - The field's options array.
 * @return {Array<string>} The flat list of option values.
 */
function collectOptionValues(options) {
  return (options || []).flatMap((option) => {
    if (option.children) {
      return collectOptionValues(option.children);
    }
    return option.value !== undefined ? [option.value] : [];
  });
}

/**
 * Distribute element-grouping tokens (a block header's classes, a container
 * child's leading cell, or a section's `style` cell) across the model's group
 * fields, per the AEM "element grouping for block options" rules:
 *
 * - a boolean field receives "true" when its name suffix (after `${group}_`)
 *   appears as a token (e.g. token "fullwidth" -> `${group}_fullwidth`="true");
 * - a text/select field with options claims the tokens that match its option
 *   values (e.g. token "light" -> `${group}_background`="light");
 * - any remaining tokens fall back to the base `${group}` field, which also
 *   covers the common single-field case (a free-form `${group}` field).
 *
 * Multi fields are written as `[a, b]`; single fields as a comma-separated list.
 * The result is emitted in model-field order so callers that do not sort
 * (e.g. sections) get deterministic, readable output.
 * @param {Model} model - The block, item, or section model.
 * @param {Array<string>} tokens - The option tokens.
 * @param {string} [group] - The group name (defaults to `classes`).
 * @return {Object<string, string>} A map of group field name to property value.
 */
function distributeGroupOptions(model, tokens, group = 'classes') {
  const groupFields = (model?.fields || []).filter((f) => isGroupField(f.name, group));
  if (groupFields.length === 0 || tokens.length === 0) {
    return {};
  }

  const suffixRegExp = new RegExp(`^${group}_`);
  const remaining = [...tokens];
  const assigned = new Map();

  // boolean fields: the suffix after `${group}_` becomes the option when present
  groupFields
    .filter((field) => field.component === 'boolean')
    .forEach((field) => {
      const suffix = field.name.replace(suffixRegExp, '');
      const idx = remaining.indexOf(suffix);
      if (idx !== -1) {
        assigned.set(field.name, true);
        remaining.splice(idx, 1);
      }
    });

  // text/select fields with options: claim the tokens that match their values
  groupFields
    .filter((field) => field.component !== 'boolean' && field.options)
    .forEach((field) => {
      const values = collectOptionValues(field.options);
      const matched = remaining.filter((t) => values.includes(t));
      if (matched.length > 0) {
        assigned.set(field.name, matched);
        matched.forEach((m) => remaining.splice(remaining.indexOf(m), 1));
      }
    });

  // leftover tokens fall back to the base `${group}` field (and the single-field case)
  const base = groupFields.find((f) => f.name === group && f.component !== 'boolean');
  if (remaining.length > 0 && base) {
    assigned.set(group, [...(assigned.get(group) || []), ...remaining]);
  }

  // emit in model-field order for deterministic, readable output
  const result = {};
  groupFields.forEach((field) => {
    if (!assigned.has(field.name)) {
      return;
    }
    const value = assigned.get(field.name);
    if (value === true) {
      result[field.name] = 'true';
    } else {
      result[field.name] = field.multi === true ? `[${value.join(', ')}]` : value.join(', ');
    }
  });
  return result;
}

export {
  collectOptionValues,
  distributeGroupOptions,
};
