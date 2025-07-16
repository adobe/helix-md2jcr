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
 * The Component class represents a single component located in the
 * component-definitions.json file.
 */
class Component {
  /**
   * Create a new Component.
   * @param {string} name
   * @param {string} id
   * @param {Object} template
   */
  constructor(name, id, template) {
    this._template = template;
    this._filterId = template?.filter;
    // if the model is not part of the template, then use the component id
    // the component id will be used more often in v2 of the component definitions
    // as the template concept will be used less
    this._modelId = template?.model || id;
    this._keyValue = template?.['key-value'];
    this._name = name;
    this._id = id;
  }

  /**
   * Get the ID for the component.
   * @return {string}
   */
  get id() {
    return this._id;
  }

  /**
   * Get the filter ID for the component.
   * @return {string}
   */
  get filterId() {
    return this._filterId;
  }

  /**
   * Get the model ID for the component.
   * @return {string}
   */
  get modelId() {
    return this._modelId;
  }

  /**
   * Return true or false if the component is a key-value component.
   * @return {boolean}
   */
  get keyValue() {
    return this._keyValue;
  }

  /**
   * Get the name of the component.
   * @return {string}
   */
  get name() {
    return this._name;
  }

  /**
   * Return the component's default fields specified in the template section.
   * @return {Object}
   */
  get defaultFields() {
    return this._template;
  }
}

export default Component;
