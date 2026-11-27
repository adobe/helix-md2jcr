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

const APPROVED_ESCAPER_IDENTIFIERS = new Set([
  'escapeXmlAttribute',
  'encodeHtml',
]);

/**
 * Resolve a non-computed member-expression chain (e.g. `Handlebars.Utils.escapeExpression`)
 * into a dot-separated string, or null if it isn't a simple identifier chain.
 * @param {object} node - ESTree node.
 * @return {string|null}
 */
function getCalleePath(node) {
  if (node.type === 'Identifier') {
    return node.name;
  }
  if (node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier') {
    const objPath = getCalleePath(node.object);
    return objPath ? `${objPath}.${node.property.name}` : null;
  }
  return null;
}

const APPROVED_ESCAPER_PATHS = new Set([
  'Handlebars.escapeExpression',
  'Handlebars.Utils.escapeExpression',
]);

/**
 * Returns true when an AST expression is a direct call to an approved XML/HTML
 * attribute escaper.
 * @param {object} expr - ESTree expression node.
 * @return {boolean}
 */
function isEscapedExpression(expr) {
  if (expr.type !== 'CallExpression') {
    return false;
  }
  if (expr.callee.type === 'Identifier') {
    return APPROVED_ESCAPER_IDENTIFIERS.has(expr.callee.name);
  }
  const path = getCalleePath(expr.callee);
  return path !== null && APPROVED_ESCAPER_PATHS.has(path);
}

/**
 * Advance the XML attribute quote state across a template quasi string.
 * Enters attribute state on `=` followed by optional whitespace and `"` or `'`,
 * and exits when the matching closing quote is encountered.
 * @param {string} raw - Template quasi text.
 * @param {string|null} quoteChar - Active quote character (`"` or `'`), or null.
 * @return {string|null} Updated active quote character.
 */
function advanceAttributeState(raw, quoteChar) {
  let activeQuote = quoteChar;
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (activeQuote !== null) {
      if (ch === activeQuote) {
        activeQuote = null;
      }
    } else if (ch === '=') {
      let next = i + 1;
      while (next < raw.length && /\s/.test(raw[next])) {
        next += 1;
      }
      if (raw[next] === '"' || raw[next] === '\'') {
        activeQuote = raw[next];
        i = next;
      }
    }
  }
  return activeQuote;
}

const noUnescapedXmlAttr = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unescaped template interpolations inside XML attribute values',
    },
    schema: [],
    messages: {
      unescapedXmlAttr: 'XML attribute values must not use raw template interpolation; use serializeXmlAttributes() or escapeXmlAttribute().',
    },
  },
  create(context) {
    return {
      TemplateLiteral(node) {
        let activeQuote = null;
        for (let i = 0; i < node.expressions.length; i += 1) {
          activeQuote = advanceAttributeState(node.quasis[i].value.raw, activeQuote);
          if (activeQuote !== null && !isEscapedExpression(node.expressions[i])) {
            context.report({
              node: node.expressions[i],
              messageId: 'unescapedXmlAttr',
            });
          }
        }
      },
    };
  },
};

export default noUnescapedXmlAttr;
