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

async function testBlock(spec) {
  const { models, definition, filters } = await loadBlockResources(spec);
  await test(`blocks/${spec}/${spec}`, { models, definition, filters });
}

describe('md2jcr Tests', () => {
  it('block', async () => {
    await testBlock('block');
  });

  it('container-block', async () => {
    await testBlock('container-block');
  });

  it('grouping', async () => {
    await testBlock('grouping');
  });

  it('grouping-with-defaults', async () => {
    await testBlock('grouping-with-defaults');
  });

  it('hero', async () => {
    await testBlock('hero');
  });

  it('hero-richtext', async () => {
    await testBlock('hero-richtext');
  });

  it('key-value', async () => {
    await testBlock('key-value');
  });

  it('metadata', async () => {
    await testBlock('metadata');
  });

  it('metadata-expanded', async () => {
    await testBlock('metadata-expanded');
  });

  it('multi-cell', async () => {
    await testBlock('multi-cell');
  });

  it('paragraph', async () => {
    await testBlock('paragraph');
  });

  it('richtext', async () => {
    await testBlock('richtext');
  });

  it('richtext-greedy', async () => {
    await testBlock('richtext-greedy');
  });

  it('section-metadata', async () => {
    await testBlock('section-metadata');
  });

  it('ups-feature-list', async () => {
    await testBlock('ups-feature-list');
  });
});
