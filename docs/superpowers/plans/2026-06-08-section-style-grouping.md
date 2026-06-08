# Section Style Options (Element Grouping for `style`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring PR #215's `classes`/`classes_*` element-grouping for block options to sections, so a section model's `style`/`style_*` group is reverse-mapped from the single Section Metadata `style` cell into the correct JCR attributes.

**Architecture:** Generalize the routing helpers from PR #215 (currently hardcoded to the `classes` group and living inside `grid-table.js`) into a shared, group-name-parameterized module. Blocks keep calling them with `'classes'`; the section helper calls them with `'style'`, fed by the tokenized value of the single well-known `style` Section Metadata cell. The block path already alphabetically sorts its output attributes, so generalizing the helper's result ordering is safe for blocks; sections emit attributes in model-field order for deterministic, readable XML.

**Tech Stack:** Node ESM, Handlebars helpers/partials, mdast (remark gridtables), Mocha + Chai/assert golden-file fixtures (`*.md` -> `*.xml`), c8.

---

## Background / Why

Per the AEM spec (markup-sections-blocks): *"the only well-known section metadata property is **Style** which will be turned into additional CSS classes added to the containing section element."* `style` is therefore the section analog of a block's `classes`. PR #215 implemented element grouping for `classes`; this plan implements the identical concept for the `style` group on sections.

**Current gap** (`src/mdast2jcr/hb/helpers/section-helper.js`): `processMetadataRows` maps each metadata row to a model field by exact name (`getField(model, key)`) and silently drops keys with no field. A `style_*` field never matches the single `style` row, so grouped section style options cannot be reverse-mapped. The distribution logic (`collectOptionValues`, `distributeBlockOptions`, `isClassesField`) lives entirely in `grid-table.js`/`Models.js` and is hardcoded to `classes`; the section helper does not use it.

## Design decisions (locked)

1. **Reuse strategy:** Generalize the helpers by group name (one shared implementation) — not a section-local duplicate.
2. **Token source:** The single, well-known `style` Section Metadata cell (comma-separated), routed across `style` + `style_*` fields. Per-field rows are not the canonical authored form (a directly authored `style_x` row would still be set by the normal row path, but fixtures use only the collapsed `style` cell).
3. **`modelFields` asymmetry (intentional):** For blocks, the `classes` group is excluded from `modelFields` (block options, not content). For sections, the `style` group **stays in** `modelFields` — the Universal Editor needs those fields to render the section form, and existing section fixtures already include `style`. `getModelFieldNames` is therefore left unchanged (it excludes only the `classes` group).
4. **Trigger gate:** Section style distribution runs only when the model declares at least one grouped field whose name starts with `style_`. A section model with only a base `style` field keeps the existing per-row behavior (no change to existing fixtures, including the `multiselect` `[a,b]` formatting).
5. **Case sensitivity:** Row keys are matched case-sensitively against lowercase field names (`style`), consistent with all existing fixtures and `getField`. Not changing this here.

## File Structure

- **Create** `src/mdast2jcr/domain/GroupOptions.js` — pure routing helpers `collectOptionValues` and `distributeGroupOptions(model, tokens, group)`. One responsibility: turn a flat token list into a `{ fieldName: value }` map for one element-grouping group. No mdast/Handlebars deps; imports only `isGroupField` from `Models.js`.
- **Modify** `src/mdast2jcr/domain/Models.js` — add `isGroupField(name, group)`; redefine `isClassesField` in terms of it; export `isGroupField`.
- **Modify** `src/mdast2jcr/hb/partials/grid-table.js` — delete the local `collectOptionValues`/`distributeBlockOptions`; import `distributeGroupOptions` from `GroupOptions.js`; update the two call sites to pass `'classes'`.
- **Modify** `src/mdast2jcr/hb/helpers/section-helper.js` — import `distributeGroupOptions`; in `processMetadataRows`, when the model has a `style_*` field, distribute the `style` cell's tokens across the style group.
- **Create** fixtures under `test/fixtures/blocks/core/section-style-options/` — four scenarios mirroring the block-options suite.
- **Modify** `test/block.test.js` — add a `section style options` describe block with four `it`s.
- **Modify** `test/models.test.js` — unit tests for `isGroupField`.
- **Create** `test/group.options.test.js` — unit tests for `distributeGroupOptions`.
- **Create** `docs/section-styles.md` and **modify** `README.md` — document the feature.

## How to run tests

- Full suite (144+ tests): `npm test`
- A single file: `npx mocha test/<file>.test.js` (mocha config auto-loads `test/setup-env.js`)

---

### Task 1: Add `isGroupField` to `Models.js`

**Files:**
- Modify: `src/mdast2jcr/domain/Models.js`
- Test: `test/models.test.js`

- [ ] **Step 1: Write the failing test**

Add to `test/models.test.js` a new `describe` inside the top-level `describe('Models Utility Test', ...)` block, and add `isGroupField` to the import from `../src/mdast2jcr/domain/Models.js`.

Update the import:

```js
import {
  findModelById,
  getField,
  getModelFieldNames,
  isGroupField,
} from '../src/mdast2jcr/domain/Models.js';
```

Add the test:

```js
  describe('isGroupField', () => {
    it('matches the base group name and its underscored options', () => {
      assert.strictEqual(isGroupField('classes', 'classes'), true);
      assert.strictEqual(isGroupField('classes_background', 'classes'), true);
      assert.strictEqual(isGroupField('style', 'style'), true);
      assert.strictEqual(isGroupField('style_fullwidth', 'style'), true);
    });

    it('does not match other fields or a different group', () => {
      assert.strictEqual(isGroupField('title', 'classes'), false);
      assert.strictEqual(isGroupField('style', 'classes'), false);
      assert.strictEqual(isGroupField('stylebox', 'style'), false);
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx mocha test/models.test.js`
Expected: FAIL — `isGroupField is not a function` (import is `undefined`).

- [ ] **Step 3: Implement `isGroupField` and rebase `isClassesField` on it**

In `src/mdast2jcr/domain/Models.js`, replace the existing `isClassesField` definition (currently lines 44-53) with:

```js
/**
 * Returns true if the field name belongs to an element-grouping group — either
 * the base field named exactly `group`, or a grouped option field `group_<name>`
 * (element grouping for block options / section styles).
 * @param {string} name The field name.
 * @param {string} group The group name (e.g. `classes` or `style`).
 * @return {boolean}
 */
function isGroupField(name, group) {
  return name === group || name.startsWith(`${group}_`);
}

/**
 * Returns true if the field name belongs to the `classes` block-options group —
 * either the base `classes` field or a grouped `classes_*` option field
 * (element grouping for block options).
 * @param {string} name The field name.
 * @return {boolean}
 */
function isClassesField(name) {
  return isGroupField(name, 'classes');
}
```

Then add `isGroupField` to the export block at the bottom of the file:

```js
export {
  getField,
  findModelById,
  getModelFieldNames,
  isClassesField,
  isGroupField,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx mocha test/models.test.js`
Expected: PASS (all existing Models tests + the two new `isGroupField` tests).

- [ ] **Step 5: Commit**

```bash
git add src/mdast2jcr/domain/Models.js test/models.test.js
git commit -m "feat(models): add group-name-parameterized isGroupField helper

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Create the shared `GroupOptions.js` module

**Files:**
- Create: `src/mdast2jcr/domain/GroupOptions.js`
- Test: `test/group.options.test.js`

This moves `collectOptionValues` and the generalized `distributeGroupOptions` out of `grid-table.js`. Two behavior notes vs. the original `distributeBlockOptions`: (a) it takes a `group` parameter (default `'classes'`); (b) it emits the result in **model-field order** (the original emitted in match order). Block output is alphabetically sorted downstream by `sortJcrProperties`, so (b) does not change any block fixture; it gives sections clean, deterministic ordering.

- [ ] **Step 1: Write the failing test**

Create `test/group.options.test.js`:

```js
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
          { component: 'multiselect', name: 'style_background', multi: true, options: [{ value: 'light' }, { value: 'dark' }, { value: 'muted' }] },
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx mocha test/group.options.test.js`
Expected: FAIL — cannot find module `../src/mdast2jcr/domain/GroupOptions.js`.

- [ ] **Step 3: Create the module**

Create `src/mdast2jcr/domain/GroupOptions.js`:

```js
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
import { isGroupField } from './Models.js';

/**
 * @typedef {import('../index.d.ts').ModelDef} Model
 */

/**
 * Recursively collect every option `value` from a field's options tree
 * (options may be nested under `children`).
 * @param {Array<object>} options - The field's options array.
 * @return {Array<string>} The flat list of option values.
 */
function collectOptionValues(options) {
  return (options || []).flatMap((option) => {
    if (option.children) {
      return collectOptionValues(option.children);
    }
    return option.value !== undefined ? [option.value] : [];
  });
}

/**
 * Distribute element-grouping tokens (a block header's classes, a container
 * child's leading cell, or a section's `style` cell) across the model's group
 * fields, per the AEM "element grouping for block options" rules:
 *
 * - a boolean field receives "true" when its name suffix (after `${group}_`)
 *   appears as a token (e.g. token "fullwidth" -> `${group}_fullwidth`="true");
 * - a text/select field with options claims the tokens that match its option
 *   values (e.g. token "light" -> `${group}_background`="light");
 * - any remaining tokens fall back to the base `${group}` field, which also
 *   covers the common single-field case (a free-form `${group}` field).
 *
 * Multi fields are written as `[a, b]`; single fields as a comma-separated list.
 * The result is emitted in model-field order so callers that do not sort
 * (e.g. sections) get deterministic, readable output.
 * @param {Model} model - The block, item, or section model.
 * @param {Array<string>} tokens - The option tokens.
 * @param {string} [group] - The group name (defaults to `classes`).
 * @return {Object<string, string>} A map of group field name to property value.
 */
function distributeGroupOptions(model, tokens, group = 'classes') {
  const groupFields = (model?.fields || []).filter((f) => isGroupField(f.name, group));
  if (groupFields.length === 0 || tokens.length === 0) {
    return {};
  }

  const suffixRegExp = new RegExp(`^${group}_`);
  const remaining = [...tokens];
  const assigned = new Map();

  // boolean fields: the suffix after `${group}_` becomes the option when present
  groupFields
    .filter((field) => field.component === 'boolean')
    .forEach((field) => {
      const suffix = field.name.replace(suffixRegExp, '');
      const idx = remaining.indexOf(suffix);
      if (idx !== -1) {
        assigned.set(field.name, true);
        remaining.splice(idx, 1);
      }
    });

  // text/select fields with options: claim the tokens that match their values
  groupFields
    .filter((field) => field.component !== 'boolean' && field.options)
    .forEach((field) => {
      const values = collectOptionValues(field.options);
      const matched = remaining.filter((t) => values.includes(t));
      if (matched.length > 0) {
        assigned.set(field.name, matched);
        matched.forEach((m) => remaining.splice(remaining.indexOf(m), 1));
      }
    });

  // leftover tokens fall back to the base `${group}` field (and the single-field case)
  const base = groupFields.find((f) => f.name === group && f.component !== 'boolean');
  if (remaining.length > 0 && base) {
    assigned.set(group, [...(assigned.get(group) || []), ...remaining]);
  }

  // emit in model-field order for deterministic, readable output
  const result = {};
  groupFields.forEach((field) => {
    if (!assigned.has(field.name)) {
      return;
    }
    const value = assigned.get(field.name);
    if (value === true) {
      result[field.name] = 'true';
    } else {
      result[field.name] = field.multi === true ? `[${value.join(', ')}]` : value.join(', ');
    }
  });
  return result;
}

export {
  collectOptionValues,
  distributeGroupOptions,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx mocha test/group.options.test.js`
Expected: PASS (all five `distributeGroupOptions` tests).

- [ ] **Step 5: Commit**

```bash
git add src/mdast2jcr/domain/GroupOptions.js test/group.options.test.js
git commit -m "feat(group-options): extract group-parameterized distribution helper

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Wire `grid-table.js` to the shared module (no behavior change for blocks)

**Files:**
- Modify: `src/mdast2jcr/hb/partials/grid-table.js`
- Test (regression): `test/block.test.js`

- [ ] **Step 1: Confirm the block-options baseline is green**

Run: `npx mocha test/block.test.js`
Expected: PASS. This is the regression guard for this task — output must be identical after the refactor.

- [ ] **Step 2: Delete the local helpers from `grid-table.js`**

Remove the entire block from line 41 through line 124 inclusive — the `// -- Block Options (classes) ...` comment, the `collectOptionValues` function, and the `distributeBlockOptions` function. Leave the following `// -- Block Header ...` section intact.

- [ ] **Step 3: Import `distributeGroupOptions` from the shared module**

Add the import after the existing `Models.js` import (currently lines 20-23):

```js
import {
  findModelById,
  getModelFieldNames, isClassesField,
} from '../../domain/Models.js';
import { distributeGroupOptions } from '../../domain/GroupOptions.js';
```

(`isClassesField` is still imported — it is used at the container child-item gate.)

- [ ] **Step 4: Update the two call sites to pass `'classes'`**

In `extractBlockHeaderProperties` (was line 196):

```js
  if (model) {
    Object.assign(props, distributeGroupOptions(model, blockDetails.classes, 'classes'));
  }
```

In the `blockItem` branch (was line 449):

```js
      // distribute the options across the model's classes group fields
      Object.assign(properties, distributeGroupOptions(model, classes, 'classes'));
```

- [ ] **Step 5: Run the block tests + lint to verify no regression**

Run: `npx mocha test/block.test.js && npx eslint src/mdast2jcr/hb/partials/grid-table.js src/mdast2jcr/domain/GroupOptions.js`
Expected: PASS, no lint errors. All block-options fixtures (`block-options-grouping`, `-multi`, `-fallback`, `-booleans`) and container-block fixtures unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/mdast2jcr/hb/partials/grid-table.js
git commit -m "refactor(grid-table): use shared distributeGroupOptions for classes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Distribute the section `style` group in `section-helper.js`

**Files:**
- Modify: `src/mdast2jcr/hb/helpers/section-helper.js`
- Test: deferred to Task 5 (golden-file fixtures exercise this end-to-end)

- [ ] **Step 1: Import the shared helper**

In `src/mdast2jcr/hb/helpers/section-helper.js`, add after the existing `Models.js` import (currently lines 16-20):

```js
import {
  findModelById,
  getField,
  getModelFieldNames,
} from '../../domain/Models.js';
import { distributeGroupOptions } from '../../domain/GroupOptions.js';
```

- [ ] **Step 2: Distribute the `style` cell in `processMetadataRows`**

Replace the body of `processMetadataRows` (currently lines 58-97) with:

```js
function processMetadataRows(rows, model) {
  const attributes = {};

  // always push the model fields so UE can use them, even if no attributes are found
  const modelFields = getModelFieldNames(model);

  // a section uses element grouping when it declares a `style_*` field; in that
  // case the single well-known `style` cell collapses the whole style group and
  // must be distributed back across style / style_* fields. A model with only a
  // base `style` field keeps the simple per-row mapping below.
  const hasStyleGroup = (model?.fields || []).some((f) => f.name.startsWith('style_'));

  for (const row of rows) {
    const cells = findAll(row, (n) => n.type === 'gtCell', true);
    if (cells.length < 2) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const key = toString(cells[0])?.trim();
    const value = toString(cells[1])?.trim();

    // Skip empty keys/values and the special blockModelId field
    if (!key || !value || key === 'blockModelId') {
      // eslint-disable-next-line no-continue
      continue;
    }

    // element grouping for section styles: route the flat `style` cell across
    // the model's style group fields (boolean by name suffix, select/multiselect
    // by declared options, leftovers to the base `style` field)
    if (hasStyleGroup && key === 'style') {
      Object.assign(
        attributes,
        distributeGroupOptions(
          model,
          value.split(',').map((s) => s.trim()).filter(Boolean),
          'style',
        ),
      );
      // eslint-disable-next-line no-continue
      continue;
    }

    const field = getField(model, key);
    if (!field) {
      // eslint-disable-next-line no-continue
      continue;
    }

    if (field.component === 'multiselect') {
      const multiValue = value.split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      attributes[key] = `[${multiValue.join(',')}]`;
    } else {
      attributes[key] = value;
    }
  }

  return { attributes, modelFields };
}
```

- [ ] **Step 3: Sanity-check existing section tests still pass**

Run: `npx mocha test/block.test.js --grep "section-metadata"`
Expected: PASS. The existing `section-metadata` and `section-metadata-custom` fixtures use models with no `style_*` field, so `hasStyleGroup` is `false` and their output is unchanged.

- [ ] **Step 4: Lint**

Run: `npx eslint src/mdast2jcr/hb/helpers/section-helper.js`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/mdast2jcr/hb/helpers/section-helper.js
git commit -m "feat(section-metadata): distribute style group via element grouping

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Golden-file fixtures + `section style options` test suite

**Files:**
- Create: `test/fixtures/blocks/core/section-style-options/section-style-grouping/{_section-style-grouping.json,section-style-grouping.md,section-style-grouping.xml}`
- Create: `test/fixtures/blocks/core/section-style-options/section-style-grouping-multi/{_...json,...md,...xml}`
- Create: `test/fixtures/blocks/core/section-style-options/section-style-grouping-fallback/{_...json,...md,...xml}`
- Create: `test/fixtures/blocks/core/section-style-options/section-style-grouping-booleans/{_...json,...md,...xml}`
- Modify: `test/block.test.js`

Each fixture defines the global `section` model (no `blockModelId` needed) plus a single section containing a heading and a Section Metadata table. The `_<spec>.json` consolidated format (`{ definitions, models, filters }`) is loaded by `loadBlockResources`.

- [ ] **Step 1: Write the failing test wiring**

In `test/block.test.js`, add a new top-level describe immediately after the `describe('block options', ...)` block (which ends at line 337, just before `describe('cust-x', ...)`):

```js
  /**
   * Section style options via element grouping. A section model exposes its CSS
   * classes through a `style` group (the base `style` field plus any `style_*`
   * field). The single well-known Section Metadata `style` cell collapses the
   * whole group; md2jcr routes each token back to its field — select/multiselect
   * by declared options, boolean by name suffix — with leftovers falling back to
   * the base `style` field. Unlike a block's `classes` group, the section `style`
   * group stays in modelFields (the UE renders those fields).
   */
  describe('section style options', () => {
    const folder = 'blocks/core/section-style-options';

    // Single selects + a boolean that is on.
    it('section-style-grouping', async () => {
      await testBlock('section-style-grouping', `${folder}/section-style-grouping`);
    });

    // A multiselect claims several values; a boolean that is off contributes nothing.
    it('section-style-grouping-multi', async () => {
      await testBlock('section-style-grouping-multi', `${folder}/section-style-grouping-multi`);
    });

    // Free-form base `style` catches leftover tokens alongside a grouped boolean.
    it('section-style-grouping-fallback', async () => {
      await testBlock('section-style-grouping-fallback', `${folder}/section-style-grouping-fallback`);
    });

    // Several independent booleans: each is "true" only when its suffix appears.
    it('section-style-grouping-booleans', async () => {
      await testBlock('section-style-grouping-booleans', `${folder}/section-style-grouping-booleans`);
    });
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx mocha test/block.test.js --grep "section style options"`
Expected: FAIL — fixtures do not exist (ENOENT reading the `.md`/`.json`).

- [ ] **Step 3: Create fixture 1 — `section-style-grouping` (select + select + boolean)**

`test/fixtures/blocks/core/section-style-options/section-style-grouping/_section-style-grouping.json`:

```json
{
  "definitions": [],
  "models": [
    {
      "id": "section",
      "fields": [
        { "component": "text", "name": "name", "label": "Section Name" },
        { "component": "select", "name": "style", "label": "Variant", "options": [ { "name": "Variant A", "value": "variant-a" }, { "name": "Variant B", "value": "variant-b" } ] },
        { "component": "select", "name": "style_background", "label": "Background", "options": [ { "name": "Light", "value": "light" }, { "name": "Dark", "value": "dark" } ] },
        { "component": "boolean", "name": "style_fullwidth", "label": "Full width" }
      ]
    }
  ],
  "filters": []
}
```

`test/fixtures/blocks/core/section-style-options/section-style-grouping/section-style-grouping.md`:

```markdown
# Section Title

+-------------------------------------------------------+
| Section Metadata                                      |
+================+======================================+
| style          | variant-a, light, fullwidth          |
+----------------+--------------------------------------+
```

`test/fixtures/blocks/core/section-style-options/section-style-grouping/section-style-grouping.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="cq:Page">
  <jcr:content cq:template="/libs/core/franklin/templates/page" sling:resourceType="core/franklin/components/page/v1/page" jcr:primaryType="cq:PageContent">
    <root jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/root/v1/root">
      <section sling:resourceType="core/franklin/components/section/v1/section" jcr:primaryType="nt:unstructured" style="variant-a" style_background="light" style_fullwidth="true" model="section" modelFields="[name,style,style_background,style_fullwidth]">
        <title sling:resourceType="core/franklin/components/title/v1/title" jcr:primaryType="nt:unstructured" title="Section Title" titleType="h1"/>
      </section>
    </root>
  </jcr:content>
</jcr:root>
```

- [ ] **Step 4: Create fixture 2 — `section-style-grouping-multi` (multiselect claims several, boolean off)**

`_section-style-grouping-multi.json`:

```json
{
  "definitions": [],
  "models": [
    {
      "id": "section",
      "fields": [
        { "component": "text", "name": "name" },
        { "component": "select", "name": "style", "options": [ { "value": "variant-a" }, { "value": "variant-b" } ] },
        { "component": "multiselect", "name": "style_background", "multi": true, "options": [ { "value": "light" }, { "value": "dark" }, { "value": "muted" } ] },
        { "component": "boolean", "name": "style_fullwidth" }
      ]
    }
  ],
  "filters": []
}
```

`section-style-grouping-multi.md`:

```markdown
# Section Title

+-------------------------------------------------------+
| Section Metadata                                      |
+================+======================================+
| style          | variant-b, light, muted              |
+----------------+--------------------------------------+
```

`section-style-grouping-multi.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="cq:Page">
  <jcr:content cq:template="/libs/core/franklin/templates/page" sling:resourceType="core/franklin/components/page/v1/page" jcr:primaryType="cq:PageContent">
    <root jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/root/v1/root">
      <section sling:resourceType="core/franklin/components/section/v1/section" jcr:primaryType="nt:unstructured" style="variant-b" style_background="[light, muted]" model="section" modelFields="[name,style,style_background,style_fullwidth]">
        <title sling:resourceType="core/franklin/components/title/v1/title" jcr:primaryType="nt:unstructured" title="Section Title" titleType="h1"/>
      </section>
    </root>
  </jcr:content>
</jcr:root>
```

- [ ] **Step 5: Create fixture 3 — `section-style-grouping-fallback` (free-form base + boolean)**

`_section-style-grouping-fallback.json`:

```json
{
  "definitions": [],
  "models": [
    {
      "id": "section",
      "fields": [
        { "component": "text", "name": "name" },
        { "component": "text", "name": "style", "multi": true },
        { "component": "boolean", "name": "style_sticky" }
      ]
    }
  ],
  "filters": []
}
```

`section-style-grouping-fallback.md`:

```markdown
# Section Title

+-------------------------------------------------------+
| Section Metadata                                      |
+================+======================================+
| style          | highlight, featured, sticky          |
+----------------+--------------------------------------+
```

`section-style-grouping-fallback.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="cq:Page">
  <jcr:content cq:template="/libs/core/franklin/templates/page" sling:resourceType="core/franklin/components/page/v1/page" jcr:primaryType="cq:PageContent">
    <root jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/root/v1/root">
      <section sling:resourceType="core/franklin/components/section/v1/section" jcr:primaryType="nt:unstructured" style="[highlight, featured]" style_sticky="true" model="section" modelFields="[name,style,style_sticky]">
        <title sling:resourceType="core/franklin/components/title/v1/title" jcr:primaryType="nt:unstructured" title="Section Title" titleType="h1"/>
      </section>
    </root>
  </jcr:content>
</jcr:root>
```

- [ ] **Step 6: Create fixture 4 — `section-style-grouping-booleans` (independent booleans, mixed on/off)**

`_section-style-grouping-booleans.json`:

```json
{
  "definitions": [],
  "models": [
    {
      "id": "section",
      "fields": [
        { "component": "text", "name": "name" },
        { "component": "boolean", "name": "style_dark" },
        { "component": "boolean", "name": "style_fullwidth" },
        { "component": "boolean", "name": "style_narrow" }
      ]
    }
  ],
  "filters": []
}
```

`section-style-grouping-booleans.md`:

```markdown
# Section Title

+-------------------------------------------------------+
| Section Metadata                                      |
+================+======================================+
| style          | dark, narrow                         |
+----------------+--------------------------------------+
```

`section-style-grouping-booleans.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="cq:Page">
  <jcr:content cq:template="/libs/core/franklin/templates/page" sling:resourceType="core/franklin/components/page/v1/page" jcr:primaryType="cq:PageContent">
    <root jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/root/v1/root">
      <section sling:resourceType="core/franklin/components/section/v1/section" jcr:primaryType="nt:unstructured" style_dark="true" style_narrow="true" model="section" modelFields="[name,style_dark,style_fullwidth,style_narrow]">
        <title sling:resourceType="core/franklin/components/title/v1/title" jcr:primaryType="nt:unstructured" title="Section Title" titleType="h1"/>
      </section>
    </root>
  </jcr:content>
</jcr:root>
```

- [ ] **Step 7: Run the section style suite**

Run: `npx mocha test/block.test.js --grep "section style options"`
Expected: PASS (4 passing).

> If a test fails on attribute formatting only (e.g. a space difference or attribute order), the implementation in `GroupOptions.js`/`section-helper.js` is the source of truth for serialization — re-read the actual output from the assertion diff and reconcile the `.xml` to it, confirming the *intent* (which token routed to which field) is correct. Do not loosen the assertion.

- [ ] **Step 8: Commit**

```bash
git add test/fixtures/blocks/core/section-style-options test/block.test.js
git commit -m "test(section-metadata): cover style element-grouping scenarios

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Documentation

**Files:**
- Create: `docs/section-styles.md`
- Modify: `README.md`

- [ ] **Step 1: Write the docs page**

Create `docs/section-styles.md`:

```markdown
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
- Unlike a block's `classes` group (which is excluded from `modelFields`), the
  section `style` group remains in `modelFields` so the Universal Editor can
  render those fields.

### Worked fixtures

See [`test/fixtures/blocks/core/section-style-options`](../test/fixtures/blocks/core/section-style-options):

- `section-style-grouping` — single selects + a boolean that is on
- `section-style-grouping-multi` — a multiselect claiming several values, boolean off
- `section-style-grouping-fallback` — free-form base `style` catch-all + a boolean
- `section-style-grouping-booleans` — several independent boolean options, mixed on/off
```

- [ ] **Step 2: Link it from the README**

Find the line in `README.md` that links to `docs/block-options.md` (added by PR #215) and add a sibling link directly after it. Run to locate it:

```bash
grep -n "block-options.md" README.md
```

Then add, immediately after that matched line, a parallel bullet/link in the same style, e.g.:

```markdown
- [Section Styles](docs/section-styles.md) — element grouping for section `style`
```

(Match the exact list/link formatting used on the adjacent `block-options.md` line.)

- [ ] **Step 3: Commit**

```bash
git add docs/section-styles.md README.md
git commit -m "docs(section-styles): document element grouping for section style

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the whole suite**

Run: `npm test`
Expected: PASS — previous count (144) + 4 new section-style fixtures + new `isGroupField` and `distributeGroupOptions` unit tests; zero failures.

- [ ] **Step 2: Lint the repo**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Confirm no unintended changes**

Run: `git status` and `git diff --stat main`
Expected: only the files named in Tasks 1-6 appear.

---

## Self-Review

**1. Spec coverage**
- Generalize PR #215 helpers by group name → Tasks 1 (`isGroupField`), 2 (`distributeGroupOptions`), 3 (block path rewired).
- Section `style`/`style_*` distribution from the single Style cell → Task 4.
- Boolean (suffix), select/multiselect (options), base fallback routing → covered by unit tests (Task 2) and fixtures (Task 5).
- `style` group stays in section `modelFields` (asymmetry vs. blocks) → preserved by leaving `getModelFieldNames` unchanged; asserted by every fixture's `modelFields=[...]`; documented in Task 6.
- No regression to existing block options / section metadata → Task 3 Step 5 and Task 4 Step 3 guards; Task 7 full run.

**2. Placeholder scan** — No TBD/TODO/"handle edge cases"; every code step shows complete code; every fixture shows full `.md`/`.json`/`.xml`.

**3. Type/name consistency** — `isGroupField(name, group)` (Task 1) is consumed by `GroupOptions.js` (Task 2); `distributeGroupOptions(model, tokens, group='classes')` is the single name used in `grid-table.js` (Task 3) and `section-helper.js` (Task 4). The local `distributeBlockOptions`/`collectOptionValues` are fully removed from `grid-table.js` in Task 3 (no dangling references). Fixture spec names match the `_<spec>.json` / `<spec>.md` / `<spec>.xml` triple and the `testBlock(spec, folder)` calls in Task 5.

> **Known fragility:** the four `.xml` files are hand-computed golden files. Their attribute ordering assumes (a) `distributeGroupOptions` emits in model-field order and (b) `section-helper` serializes section attributes in insertion order (resourceType, primaryType, distributed style attrs, `model`, `modelFields`) without sorting — both true in the current code. Task 5 Step 7 has an explicit reconciliation note if serialization differs.
