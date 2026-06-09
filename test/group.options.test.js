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
import { distributeGroupOptions } from '../src/mdast2jcr/domain/GroupOptions.js';

describe('GroupOptions Utility Test', () => {
  describe('distributeGroupOptions', () => {
    it('routes select + select + boolean for the style group', () => {
      const model = {
        fields: [
          { component: 'text', name: 'name' },
          { component: 'select', name: 'style', options: [{ value: 'variant-a' }, { value: 'variant-b' }] },
          { component: 'select', name: 'style_background', options: [{ value: 'light' }, { value: 'dark' }] },
          { component: 'boolean', name: 'style_fullwidth' },
        ],
      };
      const result = distributeGroupOptions(model, ['variant-a', 'light', 'fullwidth'], 'style');
      assert.deepStrictEqual(result, {
        style: 'variant-a',
        style_background: 'light',
        style_fullwidth: 'true',
      });
    });

    it('lets a multi field claim every matching token (space after comma)', () => {
      const model = {
        fields: [
          { component: 'select', name: 'style', options: [{ value: 'variant-a' }, { value: 'variant-b' }] },
          {
            component: 'multiselect', name: 'style_background', multi: true, options: [{ value: 'light' }, { value: 'dark' }, { value: 'muted' }],
          },
          { component: 'boolean', name: 'style_fullwidth' },
        ],
      };
      const result = distributeGroupOptions(model, ['variant-b', 'light', 'muted'], 'style');
      assert.deepStrictEqual(result, {
        style: 'variant-b',
        style_background: '[light, muted]',
      });
    });

    it('falls back leftover tokens to the free-form base field', () => {
      const model = {
        fields: [
          { component: 'text', name: 'style', multi: true },
          { component: 'boolean', name: 'style_sticky' },
        ],
      };
      const result = distributeGroupOptions(model, ['highlight', 'featured', 'sticky'], 'style');
      assert.deepStrictEqual(result, {
        style: '[highlight, featured]',
        style_sticky: 'true',
      });
    });

    it('emits only matched booleans, in model-field order', () => {
      const model = {
        fields: [
          { component: 'boolean', name: 'style_dark' },
          { component: 'boolean', name: 'style_fullwidth' },
          { component: 'boolean', name: 'style_narrow' },
        ],
      };
      const result = distributeGroupOptions(model, ['dark', 'narrow'], 'style');
      assert.deepStrictEqual(result, {
        style_dark: 'true',
        style_narrow: 'true',
      });
    });

    it('defaults to the classes group and returns {} when nothing matches', () => {
      const model = { fields: [{ component: 'select', name: 'classes', options: [{ value: 'a' }] }] };
      assert.deepStrictEqual(distributeGroupOptions(model, ['a']), { classes: 'a' });
      assert.deepStrictEqual(distributeGroupOptions(model, []), {});
      assert.deepStrictEqual(distributeGroupOptions({ fields: [] }, ['a'], 'style'), {});
    });
  });
});
