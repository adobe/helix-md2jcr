# Modeling Guide

This document provides guidance on modeling content in the Helix MD2JCR system, with a focus on field hinting and its applications.

## Field Hinting

Field hinting lets you skip ahead to a specific field **within a field group**
when the automatic field resolution would otherwise assign content to an earlier
field in that group. It is a tool for navigating *grouped* (collapsed) fields —
the related fields a model collapses together, such as `teaserText_title`,
`teaserText_subtitle`, and `teaserText_description`.

### Purpose of Field Hinting

The feature exists to skip over grouped fields you don't want to fill:

1. **Skip ahead within a field group**: When a group contains several related
   fields and you only want to populate a later one, a hint jumps directly to it
   and leaves the skipped fields unset.

2. **Precise mapping among similar grouped fields**: When a group has multiple
   fields of the same type (e.g. several text fields), a hint ensures the content
   lands on the intended one instead of the next one in sequence.

### Scope and Direction

Two constraints follow from how this works, and they define what the feature is
*not* for:

- **Within a single field group only.** A hint splices the current group's
  remaining fields. It cannot reach across separate, ungrouped top-level fields
  (fields that do not share a group prefix) — those are resolved positionally,
  not by hint.
- **Forward only.** You can skip *ahead* to a later field in the group. A hint
  that names a field already consumed is ignored, and the content flows into the
  next available field. There is no way to hint backward.

### How Field Hinting Works

Field hints are implemented as HTML comments in your markdown content with the following syntax:

```html
<!-- field: fieldName -->
```

The system recognizes these comments and uses them to direct the following content to the specified field. The field hint affects the next content node that would normally be processed.


## Examples

### Basic Blocks

Basic blocks typically have a simple field structure where each row corresponds to a single model field. Field hints are generally not useful for basic blocks since the automatic field resolution works well with this straightforward one-to-one mapping.

#### Example: Custom Block

Consider a custom block with the following model:

```json
{
  "id": "custom",
  "fields": [
    {
      "component": "text",
      "name": "classes"
    },
    {
      "component": "richtext",
      "name": "p_1"
    },
    {
      "component": "reference", 
      "name": "p_2"
    },
    {
      "component": "text",
      "name": "p_2Alt"
    },
    {
      "component": "text",
      "name": "p_3"
    }
  ]
}
```

**Without field hints** (automatic resolution):
```markdown
+-------------------------------------------------------+
| Custom (greedy)                                       |
+=======================================================+
| All text up to image is included:                     |        
| ```                                                   |
| console.log("hello")                                  |
| ```                                                   |
| <a href="www.google.com">Google</a>                   |
|                                                       |
| ![Image][image0]                                      |
|                                                       |
| After image there's more text                         |
+-------------------------------------------------------+
```

**With field hints** (explicit control skipping optional fields):
```markdown
+-------------------------------------------------------+
| Custom (greedy)                                       |
+=======================================================+
| <!-- field: p_3 -->                                   |
| After image there's more text                         |
+-------------------------------------------------------+
```

### Container Blocks

Container blocks are more complex and often benefit significantly from field hinting, especially when they have multiple fields of similar types.

#### Example: Teaser Component

Consider a teaser component with the following model:

```json
{
  "id": "teaser",
  "fields": [
    {
      "component": "reference",
      "name": "image",
      "label": "Image"
    },
    {
      "component": "text",
      "name": "teaserText_subtitle",
      "label": "Sub title"
    },
    {
      "component": "text",
      "name": "teaserText_title",
      "label": "Title"
    },
    {
      "component": "text",
      "name": "teaserText_titleType",
      "label": "Heading Type"
    },
    {
      "component": "richtext",
      "name": "teaserText_description",
      "label": "Description"
    },
    {
      "component": "text",
      "name": "teaserText_cta",
      "label": "CTA"
    },
    {
      "component": "text",
      "name": "teaserText_ctaText",
      "label": "CTA Text"
    }
  ]
}
```

**Without field hints** (automatic resolution):
```markdown
+-------------------------------------------------+
| Teaser                                          |
+=================================================+
| ![A group of people sitting on a stage][image0] |
+-------------------------------------------------+
| Adobe Experience Cloud                          |
| ## Welcome to AEM                               |
| Join us in this ask me everything session ...   |
+-------------------------------------------------+
```

**With field hints** (explicit control):
```markdown
+-------------------------------------------------+
| Teaser                                          |
+=================================================+
| ![A group of people sitting on a stage][image0] |
+-------------------------------------------------+
| <!-- field:teaserText_title -->                 |
| ## Welcome to AEM                               |
| Join us in this ask me everything session ...   |
| <!-- field:teaserText_cta -->                   |
| **[Adobe](www.adobe.com)**                      |
+-------------------------------------------------+
```

### Best Practices

1. **Use field hints sparingly**: Only use field hints when automatic resolution doesn't work as expected or when you need precise control.

2. **Be explicit with field names**: Use the exact field names as defined in your model to avoid mapping errors.

3. **Consider content flow**: Must place field hints immediately before the content you want to map to that field.

4. **Test your mappings**: Verify that your field hints correctly map content to the intended fields by checking the generated JCR output.

### Common Use Cases

1. **Multiple text fields**: When a component has multiple text fields and you want to ensure content goes to the correct one.

2. **Rich text with mixed content**: When you have a rich text field that should contain specific content, followed by other field types.

Field hinting provides the flexibility and control needed to create complex, well-structured content while maintaining the simplicity of markdown authoring.
