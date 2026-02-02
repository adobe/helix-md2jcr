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
 * @typedef {import('../mdast2jcr/index.d.ts').ComponentDef} ComponentDef
 */

import Component from './Component.js';

/**
 * Get the components from the definitions object, (component-definition.json).
 * @param {DefinitionDef} definitions The Definitions object.
 * @returns {Component[]} An array of Component objects.
 */
function getAllComponents(definitions) {
  return definitions.groups.map((group) => group.components)
    .flat()
    .map((/** @type {ComponentDef} */ component) => new Component(
      component.title,
      component.id,
      component.plugins?.xwalk?.page?.template,
    ));
}

/**
 * Get a component by locating it against the template name.
 * @param {DefinitionDef} definitions The Definitions object.
 * @param {string} title The title of the component.
 * @returns {Component} The component.
 */
function getComponentByTitle(definitions, title) {
  return getAllComponents(definitions).find(
    (component) => component.name === title,
  );
}

/**
 * Get a component by its id.
 * @param {DefinitionDef} definitions The Definitions object.
 * @param {string} id The id of the component.
 * @return {Component}
 */
function getComponentById(definitions, id) {
  return getAllComponents(definitions).find(
    (component) => component.id === id,
  );
}

/**
 * Get the model id given a component name, or null if not found.
 * @param {DefinitionDef} definitions The Definitions object.
 * @param {string} title of the component.
 * @returns {string | null} The model id associated with the component or null
 * if not found.
 */
function getModelId(definitions, title) {
  const component = getComponentByTitle(definitions, title);
  if (component) {
    return component.modelId || null;
  }
  return null;
}

export {
  getAllComponents,
  getComponentByTitle,
  getModelId,
  getComponentById,
};
