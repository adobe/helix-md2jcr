# Phrasing Content (Inline HTML)

Phrasing content refers to inline elements that flow within a line of text — as
opposed to block-level elements like paragraphs, headings, and lists.

When raw HTML inline tags appear in markdown source, remark parses them as `html`
nodes. The `mdast-sanitize-html` step converts them into typed mdast nodes, and
the serializer then maps those nodes back to their HTML equivalents when writing
the `text` attribute of a JCR text component.

## Supported Tags

| HTML tag | mdast node type | Serializes to |
|---|---|---|
| `<sup>` | `superscript` | `<sup>` |
| `<sub>` | `subscript` | `<sub>` |
| `<u>` | `underline` | `<u>` |
| `<del>` | `delete` | `<del>` |
| `<strong>` | `strong` | `<strong>` |
| `<em>` | `emphasis` | `<em>` |

`superscript`, `subscript`, and `underline` are custom node types introduced by
`mdast-sanitize-html`. They require explicit handlers in `hast-handlers.js` so
that `mdast-util-to-hast` knows to emit the correct tag rather than falling back
to `<div>`. The remaining three (`delete`, `strong`, `emphasis`) are standard
mdast types with built-in hast handlers.

## Example

Markdown source:

```markdown
E = mc<sup>2</sup> and H<sub>2</sub>O with <u>underline</u>, <del>strike</del>, <strong>bold</strong>, <em>italic</em>.
```

Resulting `text` attribute value:

```html
<p>E = mc<sup>2</sup> and H<sub>2</sub>O with <u>underline</u>, <del>strike</del>, <strong>bold</strong>, <em>italic</em>.</p>
```

## Pipeline

```
markdown source
  → remark parse → html nodes (raw inline HTML)
  → mdast-sanitize-html → typed mdast nodes (superscript, subscript, etc.)
  → toHast (with customHastHandlers) → hast element nodes
  → toHtml → HTML string stored in JCR text attribute
```

The custom handlers live in
`src/mdast2jcr/hb/partials/supports/hast-handlers.js` and are applied wherever
`toHast` is called — currently `paragraph.js` and `grid-table.js`.
