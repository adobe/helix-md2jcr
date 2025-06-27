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
import { splitColumns } from '../src/mdast2jcr/mdast-columns-block.js';

describe('Split Columns Tests', () => {
  describe('Table type conversion', () => {
    it('should convert gridTable to columns when header starts with "columns"', () => {
      const mdast = {
        type: 'root',
        children: [{
          type: 'gridTable',
          children: [
            {
              type: 'gtHeader',
              children: [{ type: 'text', value: 'Columns' }],
            },
            {
              type: 'gtBody',
              children: [],
            },
          ],
        }],
      };

      const result = splitColumns(mdast);
      assert.strictEqual(result.children[0].type, 'columns');
    });

    it('should convert gridTable to columns when header starts with "columns" (case insensitive)', () => {
      const mdast = {
        type: 'root',
        children: [{
          type: 'gridTable',
          children: [
            {
              type: 'gtHeader',
              children: [{ type: 'text', value: 'COLUMNS' }],
            },
            {
              type: 'gtBody',
              children: [],
            },
          ],
        }],
      };

      const result = splitColumns(mdast);
      assert.strictEqual(result.children[0].type, 'columns');
    });

    it('should not convert gridTable when header does not start with "columns"', () => {
      const mdast = {
        type: 'root',
        children: [{
          type: 'gridTable',
          children: [
            {
              type: 'gtHeader',
              children: [{ type: 'text', value: 'Regular Table' }],
            },
            {
              type: 'gtBody',
              children: [],
            },
          ],
        }],
      };

      const result = splitColumns(mdast);
      assert.strictEqual(result.children[0].type, 'gridTable');
    });

    it('should handle multiple tables correctly', () => {
      const mdast = {
        type: 'root',
        children: [
          {
            type: 'gridTable',
            children: [
              {
                type: 'gtHeader',
                children: [{ type: 'text', value: 'Columns' }],
              },
              {
                type: 'gtBody',
                children: [],
              },
            ],
          },
          {
            type: 'gridTable',
            children: [
              {
                type: 'gtHeader',
                children: [{ type: 'text', value: 'Regular Table' }],
              },
              {
                type: 'gtBody',
                children: [],
              },
            ],
          },
        ],
      };

      const result = splitColumns(mdast);
      assert.strictEqual(result.children[0].type, 'columns');
      assert.strictEqual(result.children[1].type, 'gridTable');
    });
  });

  describe('Cell content grouping', () => {
    it('should group text nodes into paragraphWrapper', () => {
      const mdast = {
        type: 'root',
        children: [{
          type: 'gridTable',
          children: [
            {
              type: 'gtHeader',
              children: [{ type: 'text', value: 'Columns' }],
            },
            {
              type: 'gtBody',
              children: [{
                type: 'gtRow',
                children: [{
                  type: 'gtCell',
                  children: [
                    { type: 'text', value: 'First text' },
                    { type: 'text', value: 'Second text' },
                  ],
                }],
              }],
            },
          ],
        }],
      };

      const result = splitColumns(mdast);
      const cell = result.children[0].children[1].children[0].children[0];

      assert.strictEqual(cell.children.length, 1);
      assert.strictEqual(cell.children[0].type, 'paragraphWrapper');
      assert.strictEqual(cell.children[0].children.length, 2);
    });

    it('should handle links as standalone elements', () => {
      const mdast = {
        type: 'root',
        children: [{
          type: 'gridTable',
          children: [
            {
              type: 'gtHeader',
              children: [{ type: 'text', value: 'Columns' }],
            },
            {
              type: 'gtBody',
              children: [{
                type: 'gtRow',
                children: [{
                  type: 'gtCell',
                  children: [
                    { type: 'text', value: 'Before link' },
                    {
                      type: 'paragraph',
                      children: [{
                        type: 'link',
                        url: 'https://example.com',
                        children: [{ type: 'text', value: 'Link text' }],
                      }],
                    },
                    { type: 'text', value: 'After link' },
                  ],
                }],
              }],
            },
          ],
        }],
      };

      const result = splitColumns(mdast);
      const cell = result.children[0].children[1].children[0].children[0];

      assert.strictEqual(cell.children.length, 3);
      assert.strictEqual(cell.children[0].type, 'paragraphWrapper');
      assert.strictEqual(cell.children[1].type, 'link');
      assert.strictEqual(cell.children[2].type, 'paragraphWrapper');
    });

    it('should handle images as standalone elements', () => {
      const mdast = {
        type: 'root',
        children: [{
          type: 'gridTable',
          children: [
            {
              type: 'gtHeader',
              children: [{ type: 'text', value: 'Columns' }],
            },
            {
              type: 'gtBody',
              children: [{
                type: 'gtRow',
                children: [{
                  type: 'gtCell',
                  children: [
                    { type: 'text', value: 'Before image' },
                    {
                      type: 'paragraph',
                      children: [{
                        type: 'image',
                        url: 'image.jpg',
                        alt: 'Alt text',
                      }],
                    },
                    { type: 'text', value: 'After image' },
                  ],
                }],
              }],
            },
          ],
        }],
      };

      const result = splitColumns(mdast);
      const cell = result.children[0].children[1].children[0].children[0];

      assert.strictEqual(cell.children.length, 3);
      assert.strictEqual(cell.children[0].type, 'paragraphWrapper');
      assert.strictEqual(cell.children[1].type, 'image');
      assert.strictEqual(cell.children[2].type, 'paragraphWrapper');
    });

    it('should handle headings as standalone elements', () => {
      const mdast = {
        type: 'root',
        children: [{
          type: 'gridTable',
          children: [
            {
              type: 'gtHeader',
              children: [{ type: 'text', value: 'Columns' }],
            },
            {
              type: 'gtBody',
              children: [{
                type: 'gtRow',
                children: [{
                  type: 'gtCell',
                  children: [
                    { type: 'text', value: 'Before heading' },
                    {
                      type: 'heading',
                      depth: 2,
                      children: [{ type: 'text', value: 'Heading text' }],
                    },
                    { type: 'text', value: 'After heading' },
                  ],
                }],
              }],
            },
          ],
        }],
      };

      const result = splitColumns(mdast);
      const cell = result.children[0].children[1].children[0].children[0];

      assert.strictEqual(cell.children.length, 3);
      assert.strictEqual(cell.children[0].type, 'paragraphWrapper');
      assert.strictEqual(cell.children[1].type, 'heading');
      assert.strictEqual(cell.children[2].type, 'paragraphWrapper');
    });

    it('should handle mixed content correctly', () => {
      const mdast = {
        type: 'root',
        children: [{
          type: 'gridTable',
          children: [
            {
              type: 'gtHeader',
              children: [{ type: 'text', value: 'Columns' }],
            },
            {
              type: 'gtBody',
              children: [{
                type: 'gtRow',
                children: [{
                  type: 'gtCell',
                  children: [
                    { type: 'text', value: 'First text' },
                    { type: 'text', value: 'Second text' },
                    {
                      type: 'paragraph',
                      children: [{
                        type: 'link',
                        url: 'https://example.com',
                        children: [{ type: 'text', value: 'Link' }],
                      }],
                    },
                    { type: 'text', value: 'Third text' },
                    {
                      type: 'paragraph',
                      children: [{
                        type: 'image',
                        url: 'image.jpg',
                        alt: 'Alt text',
                      }],
                    },
                    { type: 'text', value: 'Fourth text' },
                  ],
                }],
              }],
            },
          ],
        }],
      };

      const result = splitColumns(mdast);
      const cell = result.children[0].children[1].children[0].children[0];

      assert.strictEqual(cell.children.length, 5);
      assert.strictEqual(cell.children[0].type, 'paragraphWrapper');
      assert.strictEqual(cell.children[1].type, 'link');
      assert.strictEqual(cell.children[2].type, 'paragraphWrapper');
      assert.strictEqual(cell.children[3].type, 'image');
      assert.strictEqual(cell.children[4].type, 'paragraphWrapper');
    });

    it('should handle empty cells', () => {
      const mdast = {
        type: 'root',
        children: [{
          type: 'gridTable',
          children: [
            {
              type: 'gtHeader',
              children: [{ type: 'text', value: 'Columns' }],
            },
            {
              type: 'gtBody',
              children: [{
                type: 'gtRow',
                children: [{
                  type: 'gtCell',
                  children: [],
                }],
              }],
            },
          ],
        }],
      };

      const result = splitColumns(mdast);
      const cell = result.children[0].children[1].children[0].children[0];

      assert.strictEqual(cell.children.length, 0);
    });

    it('should handle cells with only standalone elements', () => {
      const mdast = {
        type: 'root',
        children: [{
          type: 'gridTable',
          children: [
            {
              type: 'gtHeader',
              children: [{ type: 'text', value: 'Columns' }],
            },
            {
              type: 'gtBody',
              children: [{
                type: 'gtRow',
                children: [{
                  type: 'gtCell',
                  children: [
                    {
                      type: 'paragraph',
                      children: [{
                        type: 'link',
                        url: 'https://example.com',
                        children: [{ type: 'text', value: 'Link' }],
                      }],
                    },
                    {
                      type: 'paragraph',
                      children: [{
                        type: 'image',
                        url: 'image.jpg',
                        alt: 'Alt text',
                      }],
                    },
                  ],
                }],
              }],
            },
          ],
        }],
      };

      const result = splitColumns(mdast);
      const cell = result.children[0].children[1].children[0].children[0];

      assert.strictEqual(cell.children.length, 2);
      assert.strictEqual(cell.children[0].type, 'link');
      assert.strictEqual(cell.children[1].type, 'image');
    });
  });

  describe('Edge cases', () => {
    it('should handle nodes without children property', () => {
      const mdast = {
        type: 'root',
        children: [{
          type: 'gridTable',
          children: [
            {
              type: 'gtHeader',
              children: [{ type: 'text', value: 'Columns' }],
            },
            {
              type: 'gtBody',
              children: [{
                type: 'gtRow',
                children: [{
                  type: 'gtCell',
                  children: [
                    { type: 'text', value: 'Text node' },
                    { type: 'text', value: 'Another text' },
                  ],
                }],
              }],
            },
          ],
        }],
      };

      const result = splitColumns(mdast);
      const cell = result.children[0].children[1].children[0].children[0];

      assert.strictEqual(cell.children.length, 1);
      assert.strictEqual(cell.children[0].type, 'paragraphWrapper');
    });

    it('should handle nodes with empty children array', () => {
      const mdast = {
        type: 'root',
        children: [{
          type: 'gridTable',
          children: [
            {
              type: 'gtHeader',
              children: [{ type: 'text', value: 'Columns' }],
            },
            {
              type: 'gtBody',
              children: [{
                type: 'gtRow',
                children: [{
                  type: 'gtCell',
                  children: [
                    { type: 'text', value: 'Text node' },
                    { type: 'paragraph', children: [] },
                    { type: 'text', value: 'Another text' },
                  ],
                }],
              }],
            },
          ],
        }],
      };

      const result = splitColumns(mdast);
      const cell = result.children[0].children[1].children[0].children[0];

      assert.strictEqual(cell.children.length, 1);
      assert.strictEqual(cell.children[0].type, 'paragraphWrapper');
      assert.strictEqual(cell.children[0].children.length, 3);
    });

    it('should handle complex nested structures', () => {
      const mdast = {
        type: 'root',
        children: [{
          type: 'gridTable',
          children: [
            {
              type: 'gtHeader',
              children: [{ type: 'text', value: 'Columns' }],
            },
            {
              type: 'gtBody',
              children: [{
                type: 'gtRow',
                children: [{
                  type: 'gtCell',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        { type: 'text', value: 'Nested text' },
                        { type: 'strong', children: [{ type: 'text', value: 'Bold text' }] },
                      ],
                    },
                    {
                      type: 'paragraph',
                      children: [{
                        type: 'link',
                        url: 'https://example.com',
                        children: [{ type: 'text', value: 'Link' }],
                      }],
                    },
                    {
                      type: 'list',
                      children: [
                        { type: 'listItem', children: [{ type: 'text', value: 'List item' }] },
                      ],
                    },
                  ],
                }],
              }],
            },
          ],
        }],
      };

      const result = splitColumns(mdast);
      const cell = result.children[0].children[1].children[0].children[0];

      assert.strictEqual(cell.children.length, 3);
      assert.strictEqual(cell.children[0].type, 'paragraphWrapper');
      assert.strictEqual(cell.children[1].type, 'link');
      assert.strictEqual(cell.children[2].type, 'paragraphWrapper');
    });
  });

  describe('Multiple rows and cells', () => {
    it('should handle multiple rows correctly', () => {
      const mdast = {
        type: 'root',
        children: [{
          type: 'gridTable',
          children: [
            {
              type: 'gtHeader',
              children: [{ type: 'text', value: 'Columns' }],
            },
            {
              type: 'gtBody',
              children: [
                {
                  type: 'gtRow',
                  children: [{
                    type: 'gtCell',
                    children: [{ type: 'text', value: 'Row 1 Cell 1' }],
                  }],
                },
                {
                  type: 'gtRow',
                  children: [{
                    type: 'gtCell',
                    children: [{ type: 'text', value: 'Row 2 Cell 1' }],
                  }],
                },
              ],
            },
          ],
        }],
      };

      const result = splitColumns(mdast);
      const rows = result.children[0].children[1].children;

      assert.strictEqual(rows.length, 2);
      assert.strictEqual(rows[0].children[0].children[0].type, 'paragraphWrapper');
      assert.strictEqual(rows[1].children[0].children[0].type, 'paragraphWrapper');
    });

    it('should handle multiple cells per row correctly', () => {
      const mdast = {
        type: 'root',
        children: [{
          type: 'gridTable',
          children: [
            {
              type: 'gtHeader',
              children: [{ type: 'text', value: 'Columns' }],
            },
            {
              type: 'gtBody',
              children: [{
                type: 'gtRow',
                children: [
                  {
                    type: 'gtCell',
                    children: [{ type: 'text', value: 'Cell 1' }],
                  },
                  {
                    type: 'gtCell',
                    children: [{ type: 'text', value: 'Cell 2' }],
                  },
                ],
              }],
            },
          ],
        }],
      };

      const result = splitColumns(mdast);
      const cells = result.children[0].children[1].children[0].children;

      assert.strictEqual(cells.length, 2);
      assert.strictEqual(cells[0].children[0].type, 'paragraphWrapper');
      assert.strictEqual(cells[1].children[0].type, 'paragraphWrapper');
    });
  });

  describe('Return value', () => {
    it('should return the modified mdast', () => {
      const mdast = {
        type: 'root',
        children: [{
          type: 'gridTable',
          children: [
            {
              type: 'gtHeader',
              children: [{ type: 'text', value: 'Columns' }],
            },
            {
              type: 'gtBody',
              children: [],
            },
          ],
        }],
      };

      const result = splitColumns(mdast);
      assert.strictEqual(result, mdast);
      assert.strictEqual(result.children[0].type, 'columns');
    });

    it('should handle mdast without any gridTable nodes', () => {
      const mdast = {
        type: 'root',
        children: [
          { type: 'text', value: 'Some text' },
          { type: 'paragraph', children: [{ type: 'text', value: 'Another text' }] },
        ],
      };

      const result = splitColumns(mdast);
      assert.strictEqual(result, mdast);
      assert.strictEqual(result.children.length, 2);
    });
  });
});
