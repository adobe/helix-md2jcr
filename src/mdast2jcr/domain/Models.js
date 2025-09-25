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
 * @typedef {import('../mdast2jcr/index.d.ts').ModelDef} Model
 * @typedef {import('../mdast2jcr/index.d.ts').DefinitionDef} Definition
 * @typedef {import('../mdast2jcr/index.d.ts').CollapsedFields} CollapsedFields
 * @typedef {import('../mdast2jcr/index.d.ts').FieldDef} Field
 */

/**
 * Get the model id from the array of models.
 * @param {Array<Model>} models The array of models.
 * @param {string} modelId The model id.
 * @return {Model|null} The model or undefined if not found.
 */
function findModelById(models, modelId) {
  if (models && Object.keys(models)?.length > 0) {
    return models.find((model) => model.id === modelId);
  } else {
    return undefined;
  }
}

/**
 * Given a model, return the field with the given name.
 * @param {Model} model The model.
 * @param {string} fieldName The name of the field to get.
 * @return {Field} field The field or undefined if not found.
 */
function getField(model, fieldName) {
  return model ? model.fields.find((field) => field.name === fieldName) : undefined;
}

/**
 * Return a list of field names in the model, excluding 'classes'.
 * @param {Model} model The model.
 * @return {Array<string>} An array of field names.
 */
function getModelFieldNames(model) {
  return model
    ? model.fields
      .filter((f) => f.component !== 'tab')
      .map((f) => f.name)
      .filter((f) => f !== 'classes')
    : [];
}

export {
  getField,
  findModelById,
  getModelFieldNames,
};
