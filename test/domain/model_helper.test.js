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
/* eslint-env mocha */
import assert from 'assert';
import ModelHelper from '../../src/mdast2jcr/domain/ModelHelper.js';
import { loadBlockResources } from '../test.utils.js';

describe('Model Helper Tests', () => {
  let models;
  let definition;
  let filters;

  before(async () => {
    ({ models, definition, filters } = await loadBlockResources('container-block', 'fixtures/blocks/core/container-block'));
  });

  it('Verify container block and child models are assembled correctly', () => {
    const modelHelper = new ModelHelper('Vehicles', models, definition, filters);
    assert(modelHelper.groups.length === 5);
    // block model (vehicles)
    assert(modelHelper.groups[0].fieldGroup.fields.length === 1);
    assert(modelHelper.groups[0].fieldGroup.fields[0].fields.length === 1);

    // plane
    assert(modelHelper.groups[1].fieldGroup.fields.length === 3);

    // train
    assert(modelHelper.groups[2].fieldGroup.fields.length === 3);

    // planewithclass
    assert(modelHelper.groups[3].fieldGroup.fields.length === 3);

    // trainwithclass
    assert(modelHelper.groups[4].fieldGroup.fields.length === 3);
  });

  /**
   * Verify that the model helper can handle a model fields that are out of order.
   * This test uses the fixtures/unit/fields-out-of-order.json file to test the
   * model helper. There's no need for markdown for this scenario.
   */
  it('Verify field order is correct', async () => {
    // eslint-disable-next-line no-shadow
    const { models, definitions, filters } = await loadBlockResources('fields-out-of-order', 'fixtures/unit/fields-out-of-order');

    assert.throws(() => {
      // eslint-disable-next-line no-new
      new ModelHelper('hero', models, definitions, filters);
    }, "Error: Warning in model 'hero': Fields with suffixes should follow their base field.\n"
      + "  - Field 'hero_headlineType' appears before its base field 'hero_headline'.");
  });
});
