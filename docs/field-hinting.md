# Modeling Guide

This document provides guidance on modeling content in the Helix MD2JCR system, with a focus on field hinting and its applications.

## Field Hinting

Field hinting is a powerful feature in the Helix MD2JCR system that allows you to explicitly specify which field in a component model should receive specific content from your markdown. This is particularly useful when the automatic field resolution doesn't match your intended content structure or when you need precise control over field mapping.

### Purpose of Field Hinting

Field hinting serves several important purposes:

1. **Precise Field Mapping**: When content doesn't naturally flow into the expected fields based on the model's field order, field hints allow you to explicitly direct content to specific fields.

2. **Content Structure Control**: In complex components with multiple fields of the same type (e.g., multiple text fields), field hints ensure content goes to the correct field.

3. **Sequential Field Mapping**: Field hints allow you to skip ahead to a specific field in the model's field sequence, but content must still be processed in the order it appears in the markdown.

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
