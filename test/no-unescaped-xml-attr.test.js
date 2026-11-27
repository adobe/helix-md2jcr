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
/* eslint-disable no-template-curly-in-string */
import { RuleTester } from 'eslint';
import noUnescapedXmlAttr from '../eslint-rules/no-unescaped-xml-attr.js';

describe('ESLint rule: local/no-unescaped-xml-attr', () => {
  it('allows escaped XML attributes and non-attribute interpolations, and rejects raw attribute interpolations', () => {
    const ruleTester = new RuleTester({
      languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    });

    ruleTester.run('no-unescaped-xml-attr', noUnescapedXmlAttr, {
      valid: [
        // Central attribute serializer and tag-name / body interpolations
        '`<button${uniqueName} ${serializeXmlAttributes(attributes)} />`',
        '`<block${uniqueName} ${blockProperties}>${items.join("")}</block${uniqueName}>`',
        // Approved direct escapers inside XML attributes
        '`<image fileReference="${escapeXmlAttribute(url)}" />`',
        '`<image image="${encodeHtml(url)}" imageAlt="${encodeHtml(alt)}" />`',
        '`<text text="${Handlebars.Utils.escapeExpression(html)}" />`',
        '`<text text="${Handlebars.escapeExpression(html)}" />`',
        // Non-XML strings with quotes (e.g. error messages)
        '`Container block row in "${name}": first body row has "${componentId}"`',
        // Closed static attributes followed by element body interpolation
        '`<col${i} jcr:primaryType="nt:unstructured">${children}</col${i}>`',
        // Single quote inside double-quoted static attribute does not confuse state
        '`<p title="it\'s ok">${body}</p>`',
      ],
      invalid: [
        {
          code: '`${k}="${v}"`',
          errors: [{ messageId: 'unescapedXmlAttr' }],
        },
        {
          code: '`<button link="${url}" linkText="${text}" />`',
          errors: [
            { messageId: 'unescapedXmlAttr' },
            { messageId: 'unescapedXmlAttr' },
          ],
        },
        {
          code: '`<a href = \'${url}\'>ok</a>`',
          errors: [{ messageId: 'unescapedXmlAttr' }],
        },
        {
          code: '`<a href="https://example.com/?a=${a}&b=${b}">ok</a>`',
          errors: [
            { messageId: 'unescapedXmlAttr' },
            { messageId: 'unescapedXmlAttr' },
          ],
        },
        {
          code: '`<title title="${otherHelper(val)}" />`',
          errors: [{ messageId: 'unescapedXmlAttr' }],
        },
        {
          code: '`<title title="${foo().bar(val)}" />`',
          errors: [{ messageId: 'unescapedXmlAttr' }],
        },
      ],
    });
  });
});
