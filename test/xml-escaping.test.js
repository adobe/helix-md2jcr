/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import assert from 'assert';
import {
  escapeXmlAttribute,
  preEncodedAttribute,
  serializeXmlAttributes,
} from '../src/mdast2jcr/utils.js';

describe('XML Attribute Escaping Tests', () => {
  describe('escapeXmlAttribute', () => {
    it('escapes XML special characters &, <, >, and "', () => {
      assert.strictEqual(
        escapeXmlAttribute('< Click & "view" >'),
        '&lt; Click &amp; &quot;view&quot; &gt;',
      );
    });

    it('escapes literal entity-like sequences without skipping them', () => {
      assert.strictEqual(
        escapeXmlAttribute('a=1&amp;b=2 &lt;tag&gt;'),
        'a=1&amp;amp;b=2 &amp;lt;tag&amp;gt;',
      );
    });

    it('returns empty string for null and undefined', () => {
      assert.strictEqual(escapeXmlAttribute(null), '');
      assert.strictEqual(escapeXmlAttribute(undefined), '');
    });

    it('stringifies non-string primitives', () => {
      assert.strictEqual(escapeXmlAttribute(42), '42');
      assert.strictEqual(escapeXmlAttribute(true), 'true');
    });

    it('preserves pre-encoded attribute values without double-escaping', () => {
      const encoded = '&lt;p&gt;It&#x27;s &lt;a href&#x3D;&quot;https://example.com&quot;&gt;ok&lt;/a&gt;&lt;/p&gt;';
      assert.strictEqual(escapeXmlAttribute(preEncodedAttribute(encoded)), encoded);
      assert.strictEqual(escapeXmlAttribute(preEncodedAttribute(null)), '');
      assert.strictEqual(escapeXmlAttribute(preEncodedAttribute(undefined)), '');
    });
  });

  describe('serializeXmlAttributes', () => {
    it('serializes plain attribute objects with escaped values', () => {
      assert.strictEqual(
        serializeXmlAttributes({
          link: 'https://example.com/?a=1&b=2',
          linkText: '< Click >',
          rows: 2,
        }),
        'link="https://example.com/?a=1&amp;b=2" linkText="&lt; Click &gt;" rows="2"',
      );
    });

    it('serializes entry arrays and respects pre-encoded values', () => {
      const entries = [
        ['link', 'https://example.com/?x=1&y=2'],
        ['text', preEncodedAttribute('&lt;p&gt;Hello&lt;/p&gt;')],
      ];
      assert.strictEqual(
        serializeXmlAttributes(entries),
        'link="https://example.com/?x=1&amp;y=2" text="&lt;p&gt;Hello&lt;/p&gt;"',
      );
    });
  });
});
