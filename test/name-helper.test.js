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
import nameHelper, { nameReset } from '../src/mdast2jcr/hb/helpers/name-helper.js';

describe('Name Helper Tests', () => {
  beforeEach(() => {
    nameReset();
  });

  describe('Global counter behavior', () => {
    it('should return empty string for first occurrence of any node', () => {
      assert.strictEqual(nameHelper('title'), '');
      assert.strictEqual(nameHelper('text'), '');
      assert.strictEqual(nameHelper('image'), '');
    });

    it('should return numbered suffix for subsequent occurrences', () => {
      nameHelper('title');
      assert.strictEqual(nameHelper('title'), '_1');
      assert.strictEqual(nameHelper('title'), '_2');
    });

    it('should track different node types independently', () => {
      nameHelper('title');
      nameHelper('text');
      nameHelper('image');

      assert.strictEqual(nameHelper('title'), '_1');
      assert.strictEqual(nameHelper('text'), '_1');
      assert.strictEqual(nameHelper('image'), '_1');
    });

    it('should maintain counter state across multiple calls', () => {
      nameHelper('title');
      nameHelper('title');
      nameHelper('text');

      assert.strictEqual(nameHelper('title'), '_2');
      assert.strictEqual(nameHelper('text'), '_1');
    });
  });

  describe('Section handling', () => {
    it('should return empty string for first section', () => {
      assert.strictEqual(nameHelper('section'), '');
    });

    it('should return numbered suffix for subsequent sections', () => {
      nameHelper('section');
      assert.strictEqual(nameHelper('section'), '_1');
      assert.strictEqual(nameHelper('section'), '_2');
    });

    it('should reset counter when section is encountered', () => {
      nameHelper('title');
      nameHelper('title');
      nameHelper('section'); // This should reset the counter

      // After section, title should start fresh
      assert.strictEqual(nameHelper('title'), '');
      assert.strictEqual(nameHelper('title'), '_1');
    });

    it('should maintain section numbering across resets', () => {
      nameHelper('section');
      nameHelper('title');
      nameHelper('section');
      nameHelper('title');
      nameHelper('section');

      assert.strictEqual(nameHelper('section'), '_3');
    });
  });

  describe('Per-context counter behavior', () => {
    it('should use provided nameCounter when available', () => {
      const contextCounter = [{}];
      const context = { nameCounter: contextCounter };

      // Bind the context to the function
      const boundNameHelper = nameHelper.bind(context);

      assert.strictEqual(boundNameHelper('title'), '');
      assert.strictEqual(boundNameHelper('title'), '_1');
    });

    it('should isolate per-context counters from global counter', () => {
      const contextCounter = [{}];
      const context = { nameCounter: contextCounter };
      const boundNameHelper = nameHelper.bind(context);

      // Use global counter
      nameHelper('title');
      nameHelper('title');

      // Use context counter
      boundNameHelper('title');
      boundNameHelper('title');

      // Global counter should be unaffected by context counter
      assert.strictEqual(nameHelper('title'), '_2');

      // Context counter should continue from where it left off
      assert.strictEqual(boundNameHelper('title'), '_2');
    });

    it('should handle section reset in per-context counter', () => {
      const contextCounter = [{}];
      const context = { nameCounter: contextCounter };
      const boundNameHelper = nameHelper.bind(context);

      boundNameHelper('title');
      boundNameHelper('title');
      boundNameHelper('section');

      // After section, title should start fresh in context
      assert.strictEqual(boundNameHelper('title'), '');
      assert.strictEqual(boundNameHelper('title'), '_1');
    });

    it('should handle empty context gracefully', () => {
      const context = {};
      const boundNameHelper = nameHelper.bind(context);

      assert.strictEqual(boundNameHelper('title'), '');
      assert.strictEqual(boundNameHelper('title'), '_1');
    });

    it('should handle null context gracefully', () => {
      const boundNameHelper = nameHelper.bind(null);

      assert.strictEqual(boundNameHelper('title'), '');
      assert.strictEqual(boundNameHelper('title'), '_1');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string input', () => {
      assert.strictEqual(nameHelper(''), '');
      assert.strictEqual(nameHelper(''), '_1');
    });

    it('should handle undefined input', () => {
      assert.strictEqual(nameHelper(undefined), '');
      assert.strictEqual(nameHelper(undefined), '_1');
    });

    it('should handle null input', () => {
      assert.strictEqual(nameHelper(null), '');
      assert.strictEqual(nameHelper(null), '_1');
    });

    it('should handle numeric input', () => {
      assert.strictEqual(nameHelper(123), '');
      assert.strictEqual(nameHelper(123), '_1');
    });

    it('should handle special characters in names', () => {
      assert.strictEqual(nameHelper('title-with-dashes'), '');
      assert.strictEqual(nameHelper('title_with_underscores'), '');
      assert.strictEqual(nameHelper('title.with.dots'), '');
    });

    it('should handle very long names', () => {
      const longName = 'a'.repeat(1000);
      assert.strictEqual(nameHelper(longName), '');
      assert.strictEqual(nameHelper(longName), '_1');
    });
  });

  describe('nameReset function', () => {
    it('should reset global counter', () => {
      nameHelper('title');
      nameHelper('title');
      nameReset();

      // After reset, should start fresh
      assert.strictEqual(nameHelper('title'), '');
      assert.strictEqual(nameHelper('title'), '_1');
    });

    it('should not affect per-context counters', () => {
      const contextCounter = [{}];
      const context = { nameCounter: contextCounter };
      const boundNameHelper = nameHelper.bind(context);

      boundNameHelper('title');
      boundNameHelper('title');

      nameReset(); // Reset global counter

      // Context counter should continue from where it left off
      assert.strictEqual(boundNameHelper('title'), '_2');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle mixed usage of global and context counters', () => {
      const contextCounter = [{}];
      const context = { nameCounter: contextCounter };
      const boundNameHelper = nameHelper.bind(context);

      // Mix global and context usage
      nameHelper('title');
      boundNameHelper('text');
      nameHelper('image');
      boundNameHelper('title');
      nameHelper('text');

      // Check global counter
      assert.strictEqual(nameHelper('title'), '_1');
      assert.strictEqual(nameHelper('text'), '_1');
      assert.strictEqual(nameHelper('image'), '_1');

      // Check context counter
      assert.strictEqual(boundNameHelper('title'), '_1');
      assert.strictEqual(boundNameHelper('text'), '_1');
    });

    it('should handle multiple context counters', () => {
      const context1 = { nameCounter: [{}] };
      const context2 = { nameCounter: [{}] };
      const boundNameHelper1 = nameHelper.bind(context1);
      const boundNameHelper2 = nameHelper.bind(context2);

      boundNameHelper1('title');
      boundNameHelper2('title');
      boundNameHelper1('title');
      boundNameHelper2('title');

      // Each context should have its own counter
      assert.strictEqual(boundNameHelper1('title'), '_2');
      assert.strictEqual(boundNameHelper2('title'), '_2');
    });
  });
});
