# Block Options (Classes)

Block options let an author pick variants of a block without creating a whole new
block. They are expressed as CSS classes on the block and appear in the block
header parentheses in markdown:

```markdown
+--------------------------------------+
| Teaser (variant-a, light, fullwidth) |
+======================================+
| My title                             |
+--------------------------------------+
```

A model exposes block options through its `classes` fields. In the simplest case
there is a single `classes` field that holds a free-form list of class names.

## Element Grouping for Block Options

When there are several options — especially mutually exclusive ones — it is
easier for authors to use multiple fields. Following the
[element grouping](https://www.aem.live/developer/component-model-definitions#element-grouping-for-block-options)
naming convention, the **classes group** is the base `classes` field plus any
`classes_<name>` field (the group name `classes` separated from the option name
by an underscore):

```jsonc
{ "component": "select",      "name": "classes",            "options": [ "variant-a", "variant-b" ] }
{ "component": "multiselect", "name": "classes_background", "options": [ "light", "dark" ] }
{ "component": "boolean",     "name": "classes_fullwidth" }
```

When AEM renders the block, every field in the group collapses into one flat
class list — `class="teaser variant-a light fullwidth"` — and that is what lands
in the block header parentheses.

## How md2jcr maps header options back to fields

Going from markdown to JCR, md2jcr must route each option in the header back to
the field it came from. Because the rendered class list is **flat** (it does not
record which field produced each class), routing is driven by the field
definition — **not by the order of the options**:

- **Boolean field** — matched by its **name suffix** (the part after `classes_`).
  The token `fullwidth` sets `classes_fullwidth="true"`. If the token is absent,
  the field is left unset. This suits on/off toggles.
- **Select / multiselect field** — matched by its **declared option values**. The
  token `light` is routed to `classes_background` because `light` is one of that
  field's options. A multiselect claims **all** of its matching tokens.
- **Base `classes` field** — receives any leftover tokens that no more specific
  field claimed. This also covers the common case of a single, free-form
  `classes` field.

Multi fields are written as `[a, b]`; single fields as a comma-separated value.

### Example

Given the model above and the header `Teaser (variant-a, light, fullwidth)`, the
block node gets these properties:

```text
classes="variant-a"  classes_background="light"  classes_fullwidth="true"
```

A multiselect background claims every matching token:

```text
Teaser (variant-a, light, dark)
  -> classes="variant-a"  classes_background="[light, dark]"
```

And an unmatched token falls back to the base `classes` field:

```text
Promo (highlight, featured, sticky)   // classes is free-form, classes_sticky is boolean
  -> classes="[highlight, featured]"  classes_sticky="true"
```

The classes group fields are block options, not content, so they are excluded
from `modelFields` and never consume content rows.

## Requirements

- Name grouped option fields `classes_<name>`.
- A `classes_<name>` **select/multiselect must declare `options`** — that is how
  its tokens are recognized.
- A `classes_<name>` **boolean** needs no options; its name suffix is the class.
- A **free-form text** `classes_<name>` field (no options) cannot be
  reverse-mapped to its field — its token has no matching signal — so it falls
  back to the base `classes` field. As the spec notes, block options are usually
  select or multiselect, which avoids this.

## Why options, not position?

Mapping the first option to the first field, the second to the second, and so on
seems simpler, but it breaks whenever the number of tokens does not equal the
number of fields — which is common:

- a boolean that is **off** contributes no token,
- an empty select contributes no token,
- a multiselect contributes **several** tokens.

Any of these slides every following option into the wrong field. Matching by a
field's declared options (and a boolean's name suffix) is order-independent and
survives missing, optional, and multi-value fields.

## Examples in the test suite

Worked fixtures live under
[`test/fixtures/blocks/core/block-options`](../test/fixtures/blocks/core/block-options):

- `block-options-grouping` — single selects + a boolean that is on
- `block-options-grouping-multi` — a multiselect claiming several values, boolean off
- `block-options-grouping-fallback` — free-form base `classes` catch-all + a boolean
- `block-options-grouping-booleans` — several independent boolean options, mixed on/off
