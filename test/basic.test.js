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
import { test } from './test-base.js';

describe('basic Tests', () => {
  it('convert a simple md', async () => {
    await test('simple');
  });

  it('convert text paragraphs', async () => {
    await test('paragraphs');
  });

  it('converts headings', async () => {
    await test('headings');
  });

  it('converts buttons & links', async () => {
    await test('buttons');
  });

  it('converts multiple sections', async () => {
    await test('sections');
  });

  it('converts images', async () => {
    await test('images');
  });

  it('converts a document with default-content', async () => {
    await test('default-content-only');
  });

  it('tables are not supported', async () => {
    await assert.rejects(
      test('table'),
      {
        name: 'UnsupportedElementError',
        message: 'Element \'table\' is currently not supported. Please open an issue for us and describe your use case.',
      },
    );
  });
});
