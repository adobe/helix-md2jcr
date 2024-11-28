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
   * @param {object} template
   */
  constructor(name, template) {
    this._template = template;
    this._filterId = template?.filter;
    this._modelId = template?.model;
    this._keyValue = template?.['key-value'];
    this._name = name;
  }

  get filterId() {
    return this._filterId;
  }

  get modelId() {
    return this._modelId;
  }

  get keyValue() {
    return this._keyValue;
  }

  get name() {
    return this._name;
  }

  get defaultFields() {
    // we will always inject the name and model ourselves, so return all other fields
    const {
      name,
      model,
      ...rest
    } = this._template;

    return rest;
  }
}

export default Component;
