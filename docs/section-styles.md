# Section Styles (Element Grouping for `style`)

A section's appearance is controlled by the **Style** property of its Section
Metadata, which AEM turns into CSS classes on the containing section element.
`style` is the section counterpart of a block's [`classes`](./block-options.md)
property.

When a section model exposes several style options — especially mutually
exclusive ones — it can use the
[element grouping](https://www.aem.live/developer/component-model-definitions#element-grouping-for-block-options)
naming convention: a **style group** is the base `style` field plus any
`style_<name>` field.

```jsonc
{ "component": "select",      "name": "style",            "options": [ "variant-a", "variant-b" ] }
{ "component": "multiselect", "name": "style_background", "options": [ "light", "dark" ] }
{ "component": "boolean",     "name": "style_fullwidth" }
```

AEM collapses the whole style group into the single, well-known `style` cell of
the Section Metadata table (a flat, comma-separated list). Going from markdown to
JCR, md2jcr routes each token back to its field — exactly as it does for block
`classes`:

- **boolean field** — matched by its name suffix (after `style_`); token
  `fullwidth` sets `style_fullwidth="true"`, absent leaves it unset;
- **select / multiselect field** — matched by its declared option values; a
  multiselect claims all of its matching tokens (`style_background="[light, dark]"`);
- **base `style` field** — receives any leftover tokens (also the common single,
  free-form `style` field case).

### Example

```markdown
+-------------------------------------------------------+
| Section Metadata                                      |
+================+======================================+
| style          | variant-a, light, fullwidth          |
+----------------+--------------------------------------+
```

becomes:

```text
style="variant-a"  style_background="light"  style_fullwidth="true"
```

### Notes

- The routing rules and the underlying implementation are shared with block
  options — see [Block Options](./block-options.md).
- Distribution only kicks in when the section model declares at least one
  `style_<name>` field. A model with only a base `style` field keeps the simple
  one-to-one mapping.
- The `style` group is listed in `modelFields` so the Universal Editor can
  render those fields — the same as a block's `classes` group.

### Worked fixtures

See [`test/fixtures/blocks/core/section-style-options`](../test/fixtures/blocks/core/section-style-options):

- `section-style-grouping` — single selects + a boolean that is on
- `section-style-grouping-multi` — a multiselect claiming several values, boolean off
- `section-style-grouping-fallback` — free-form base `style` catch-all + a boolean
- `section-style-grouping-booleans` — several independent boolean options, mixed on/off
