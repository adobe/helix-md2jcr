/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-env mocha */

import assert from 'assert';
import Component from '../../src/mdast2jcr/domain/Component.js';

/**
 * Unit test for the Component class.
 */
describe('Component', () => {
  let component;
  let template;
  let name;
  let id;

  beforeEach(() => {
    name = 'name';
    id = 'id';
    template = {
      filter: 'filter',
      model: 'model',
      'key-value': 'true',
      'other-field': 'other-field',
    };
    component = new Component(name, id, template);
  });

  it('should create a new Component', () => {
    assert.equal(component instanceof Component, true);
  });

  it('should have an id', () => {
    // assert that the id is equal to the id passed in
    assert.equal(component.id, id);
  });

  it('should have a filterId', () => {
    assert.equal(component.filterId, template.filter);
  });

  it('should have a modelId', () => {
    assert.equal(component.modelId, template.model);
  });

  it('should have a keyValue', () => {
    assert.equal(component.keyValue, template['key-value']);
  });

  it('should have a name', () => {
    assert.equal(component.name, name);
  });

  it('should have defaultFields and filter out key-value', () => {
    assert.equal(
      JSON.stringify(component.defaultFields),
      JSON.stringify({
        filter: 'filter',
        model: 'model',
        'key-value': 'true',
        'other-field': 'other-field',
      }),
    );
  });
});
