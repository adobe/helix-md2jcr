# Container Block Fixtures

These fixtures exercise how md2jcr converts **container blocks** — blocks that
produce a parent block node plus one or more child block item nodes.

The governing rule (per the AEM Live spec) is simple:

- **one column = parent property row**
- **two or more columns = child item row**

Each subfolder is a single fixture: `<name>.md` (input), `<name>.xml` (expected
output), and either a merged `_<name>.json` or separate `<name>-models.json` /
`<name>-definitions.json` / `<name>-filters.json` describing the models,
component definitions, and filter.

## Scenarios

| Fixture | What it covers | Result |
|---|---|---|
| `container-block-core` | Baseline: parent property rows + child item rows, including class handling on the parent and child items | ✅ parent props + child items |
| `container-block-multi-model` | Multiple child models allowed by the filter; no classes added to items | ✅ child items across models |
| `container-block-no-parent-rows` | Parent property rows omitted — the first body row is multi-column, so every row is a child item | ✅ all rows → child items |
| `container-block-no-parent-model` | Parent has **no model**; single-field child. Each single-column row becomes a child item (no parent properties) | ✅ single cell → child item |
| `container-block-parent-only` | Parent model + allowed child, but only a parent row and **no children**. An empty container is valid (e.g. a Cards block with block properties and no cards yet) | ✅ parent prop, empty container |
| `container-block-parent-hints` | Multi-field parent whose rows are field-hint comments with no values, followed by multi-column child rows | ✅ parent props empty, children created |
| `container-block-empty-parent-single-child` | Single-field parent left blank with an **empty row** (the EDS way to leave a parent property unset), then a single-column child value | ✅ parent empty, single-col row → child |
| `container-block-parent-hint-skip` | Parent fields share a prefix (one field group); a single parent row uses a field hint to skip to a later field, leaving the earlier one unset | ✅ hinted field set, earlier skipped |

## Field hints vs. empty rows

- To leave a parent property **unset**, emit an **empty row** — not a field hint
  (see `container-block-empty-parent-single-child`).
- **Field hints** (`<!-- field: name -->`) are for skipping ahead **within a
  field group** of related (collapsed) fields — see
  `container-block-parent-hint-skip`. They cannot skip across separate top-level
  parent fields. See `docs/field-hinting.md` for the full rules.

## Error scenario (lives elsewhere)

One container-block scenario is an error fixture and therefore lives under
`test/fixtures/blocks/error-handling/` (so the baseline conversion run skips it):

| Fixture | What it covers | Result |
|---|---|---|
| `container-block-child-missing-properties` | A single-column row whose only cell is an allowed child component id, with no property cells — a malformed child row | ❌ error: `…matches the child component "…" but has no property cells…` |

## Note

There are **no warnings** in container-block processing — every situation
resolves to either valid output or a hard error.
