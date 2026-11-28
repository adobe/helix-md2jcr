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
import link from '../src/mdast2jcr/hb/partials/supports/link.js';

describe('Link Helper Tests', () => {
  let node;

  before(() => {
    node = { type: 'link' };
  });

  it('verify supports', () => {
    assert(link.supports(node) === true);

    node = { type: 'paragraph' };
    assert(link.supports(node) === false);
  });

  it('verify link type', () => {
    let parentNode = { type: 'emphasis' };
    assert(link.getType(parentNode) === 'secondary');

    parentNode = { type: 'strong' };
    assert(link.getType(parentNode) === 'primary');

    parentNode = { type: 'paragraph' };
    assert(link.getType(parentNode) === '');
  });

  it('verify link properties', () => {
    const child = {
      type: 'paragraph',
      children: [
        {
          type: 'link',
          url: 'https://adobe.com',
          children: [
            {
              type: 'text',
              value: 'Adobe',
            },
          ],
        },
      ],
    };
    const properties = link.getProperties(child);
    assert(properties.href === 'https://adobe.com');
    assert(properties.text === 'Adobe');
    assert.strictEqual(properties.title, '');
  });

  it('verify link properties with title', () => {
    const url = 'https://delivery-p12345-e67890.adobeaemcloud.com/adobe/assets/urn:aaid:aem:12345/as/hero.avif';
    const child = {
      type: 'paragraph',
      children: [
        {
          type: 'link',
          url,
          title: 'Hero banner alt text',
          children: [
            {
              type: 'text',
              value: url,
            },
          ],
        },
      ],
    };
    const properties = link.getProperties(child);
    assert.strictEqual(properties.href, url);
    assert.strictEqual(properties.text, url);
    assert.strictEqual(properties.title, 'Hero banner alt text');
  });

  it('verify link properties with no text', () => {
    const child = {
      type: 'paragraph',
      children: [
        {
          type: 'link',
          url: 'https://adobe.com',
        },
      ],
    };
    const properties = link.getProperties(child);
    assert(properties.href === 'https://adobe.com');
    assert(properties.text === '');
  });

  it('verify link properties with multiple inline children', () => {
    const child = {
      type: 'paragraph',
      children: [
        {
          type: 'link',
          url: 'https://adobe.com/?a=1&b=2',
          children: [
            { type: 'text', value: 'Apply ' },
            { type: 'inlineCode', value: '<now>' },
            { type: 'text', value: ' & save' },
          ],
        },
      ],
    };
    const properties = link.getProperties(child);
    assert.strictEqual(properties.href, 'https://adobe.com/?a=1&b=2');
    assert.strictEqual(properties.text, 'Apply <now> & save');
  });
});
