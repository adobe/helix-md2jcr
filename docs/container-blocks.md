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

## Ambiguous Single-Cell Rows

A single-cell row immediately after the header is ambiguous when the parent
block has a model and the default child component can also be represented by one
cell. The row could be either:

- the first parent property row
- a child item row that omitted the child component id

md2jcr keeps the existing parent-row behavior in this case. It treats the row as
parent block data and logs a warning:

```text
Ambiguous container block row in "Container": first body row has one cell ("Maybe child title") and was treated as parent block data. If this is a child item for "child", add the child component id as the first cell.
```

To make a one-property child item unambiguous, include the child component id:

```markdown
+-------------------------+
| Container               |
+============+============+
| child      | Title      |
+------------+------------+
```

The first cell selects the child component. The second cell is mapped to the
child model's single property.

## Child Component Id Without Properties

A valid child item row is multi-column: the child component id followed by its
property cells. A single-cell row that contains only a child component id is
therefore a malformed child row — it names a component but provides none of its
properties. md2jcr treats this as an error and fails the conversion rather than
silently consuming the lone cell as parent block data:

```text
Container block row in "Container": first body row has one cell ("child") which matches the child component "child" but has no property cells. Add the child item's properties as additional cells, or remove the component id if this is parent block data.
```

To fix it, add the child's property cells:

```markdown
+-------------------------+
| Container               |
+============+============+
| child      | Title      |
+------------+------------+
```

Or, if the lone value really is parent data, remove the component id so it no
longer collides with a child component name.

## Best Practices

- Include parent property rows only when the parent model should receive values.
- Start child rows with the child component id whenever more than one child
  component is allowed.
- Always start one-property child item rows with the child component id.
- Check conversion warnings before using generated XML in an import.
