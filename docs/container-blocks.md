# Container Blocks

Container blocks are grid-table blocks that can create a parent block node and
one or more child block item nodes. They are driven by three Universal Editor
configuration files:

- The parent component definition points to a parent model and a filter.
- The filter lists the child component ids allowed inside the parent block.
- Each child component definition points to the model used for that item row.

## Table Shape

The first row is always the block header. It names the parent block and can also
include block classes:

```markdown
+------------------------------------------------+
| Vehicles (featured)                            |
+================================================+
```

Rows after the header can be parent property rows or child item rows.

Parent property rows are single-cell rows. They map to the parent model fields
in model order:

```markdown
| Planes, Trains, and Automobiles                |
```

Child item rows are normally multi-cell rows. The first cell can name the child
component id, followed by optional classes separated with commas:

```markdown
| planewithclass, fast, wide | Field 1 | Field 2 | Field 3 |
```

When the child component id is present, md2jcr skips that first cell while
mapping child model fields. In the example above, `fast` and `wide` are written
to the child item's `classes` field when that field exists.

## Omitting Parent Rows

Container blocks can omit parent property rows entirely. When the first body row
has more than one cell, md2jcr treats all body rows as child item rows:

```markdown
+--------------------------------------------------------+
| VehiclesWithClass (classy, vroom)                      |
+==========================+=========+=========+=========+
| planewithclass, x, a     | Field 1 | Field 2 | Field 3 |
+--------------------------+---------+---------+---------+
| trainwithclass, large    | Field 1 | Field 2 | Field 3 |
+--------------------------------------------------------+
```

The parent block still gets its default model, filter, name, and any classes
from the header. No parent model properties are extracted from body rows.

## Default Child Component

If a child row does not start with an allowed child component id, md2jcr uses
the first component listed in the parent filter. This allows simple child rows:

```markdown
| Field 1 | Field 2 | Field 3 |
```

That row maps to the first allowed child component as long as the cells match
that child model's field groups.

## One Column vs. Many Columns

The simple rule that decides everything:

- **one column = parent info** (a parent property row)
- **two or more columns = a child item**

```markdown
+----------------------------+
| Cards                      |   <- the block name
+==============+=============+
| My heading   |             |   <- ONE column  = parent info
+--------------+-------------+
| card title 1 | card body 1 |   <- TWO columns = a child card
+--------------+-------------+
| card title 2 | card body 2 |   <- TWO columns = a child card
+--------------+-------------+
```

A one-column row is always parent info. md2jcr does not try to guess whether you
"meant" it to be a child — if you want a child item, give it more than one
column.

### A container can have parent info and no children

This is allowed. A Cards block can carry block-level properties without any card
items yet:

```markdown
+----------------+
| Cards          |
+================+
| My heading     |   <- parent info, and zero cards. This is fine.
+----------------+
```

## Child Component Id Without Properties

There is one one-column row that is **not** allowed: a single cell that contains
only a child component id and nothing else.

```markdown
+----------------+
| Cards          |
+================+
| card           |   <- one column, and the word is a child component id
+----------------+
```

A child item always needs more than one column (its component id followed by its
property cells), so a lone component id is a half-finished child row — the author
named the child but gave it no content. md2jcr stops with an error rather than
quietly storing the component name as a parent property:

```text
Container block row in "Container": first body row has one cell ("card") which matches the child component "card" but has no property cells. Add the child item's properties as additional cells, or remove the component id if this is parent block data.
```

To fix it, add the child's property cells:

```markdown
+----------------+-------------+
| Cards          |             |
+================+=============+
| card           | card body   |
+----------------+-------------+
```

Or, if the lone value really is parent info, change it so it no longer matches a
child component name.

## Best Practices

- Use one column for parent info and two or more columns for child items.
- Start child rows with the child component id whenever more than one child
  component is allowed.
- Never write a child component id on its own line without its property cells.
