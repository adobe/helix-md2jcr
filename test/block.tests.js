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
import { loadBlockResources } from './test.utils.js';
import { test } from './test-base.js';

async function testBlock(spec, folder) {
  // split the spec by a / to find the name and the folder
  const { models, definition, filters } = await loadBlockResources(spec, `fixtures/${folder}`);
  await test(`${folder}/${spec}`, { models, definition, filters });
}

describe('md2jcr Tests', () => {
  /**
   * The suite of core block unit tests.
   */
  describe('core', () => {
    const folder = 'blocks/core';

    it('block', async () => {
      await testBlock('block', `${folder}/block`);
    });

    it('container-block', async () => {
      await testBlock('container-block', `${folder}/container-block`);
    });

    it('grouping', async () => {
      await testBlock('grouping', `${folder}/grouping`);
    });

    it('grouping-with-defaults', async () => {
      await testBlock('grouping-with-defaults', `${folder}/grouping-with-defaults`);
    });

    it('hero', async () => {
      await testBlock('hero', `${folder}/hero`);
    });

    it('hero-richtext', async () => {
      await testBlock('hero-richtext', `${folder}/hero-richtext`);
    });

    it('key-value', async () => {
      await testBlock('key-value', `${folder}/key-value`);
    });

    it('metadata', async () => {
      await testBlock('metadata', `${folder}/metadata`);
    });

    it('metadata-expanded', async () => {
      await testBlock('metadata-expanded', `${folder}/metadata-expanded`);
    });

    it('multi-cell', async () => {
      await testBlock('multi-cell', `${folder}/multi-cell`);
    });

    it('paragraph', async () => {
      await testBlock('paragraph', `${folder}/paragraph`);
    });

    it('richtext', async () => {
      await testBlock('richtext', `${folder}/richtext`);
    });

    it('richtext-greedy', async () => {
      await testBlock('richtext-greedy', `${folder}/richtext-greedy`);
    });

    it('section-metadata', async () => {
      await testBlock('section-metadata', `${folder}/section-metadata`);
    });
  });

  /**
   * Customer X block unit tests.
   */
  describe('cust-x', () => {
    const folder = 'blocks/cust-x';

    it('cust-x-accordion', async () => {
      await testBlock('cust-x-accordion', folder);
    });

    it('cust-x-cards', async () => {
      await testBlock('cards', folder);
    });

    it('cust-x-feature-list', async () => {
      await testBlock('cust-x-feature-list', folder);
    });

    it('cust-x-feature-list-v2', async () => {
      await testBlock('cust-x-feature-list-v2', folder);
    });

    it('cust-x-hero', async () => {
      await testBlock('cust-x-hero', folder);
    });

    it('cust-x-teaser', async () => {
      await testBlock('cust-x-teaser', folder);
    });

    it('cust-x-title', async () => {
      await testBlock('cust-x-title', folder);
    });
  });
});
