# No Model Provided

This test should only produce the style metadata, and not the custom fields.

+-------------------------------------------------------+
| Section Metadata                                      |
+================+======================================+
| style          | light                                |
+----------------+--------------------------------------+
| afield         | A Value                              |
+----------------+--------------------------------------+
| bfield         | B Value                              |
+----------------+--------------------------------------+
| cfield         | C Value                              |
+----------------+--------------------------------------+

---

# Custom Section Metadata

This test provides a blockModelId therefore a custom model is used and
all fields are expected to be present (minus the blockModelId).

+-------------------------------------------------------+
| Section Metadata                                      |
+================+======================================+
| style          | dark                                 |
+----------------+--------------------------------------+
| blockModelId   | custom-section                       |
+----------------+--------------------------------------+
| order          | First                                |
+----------------+--------------------------------------+
| location       | North                                |
+----------------+--------------------------------------+

---

# Custom Section Metadata With Extra Fields

This test provides a blockModelId and additional fields,
that do not map to the model, therefore they are expected
not to be in the output.

+-------------------------------------------------------+
| Section Metadata                                      |
+================+======================================+
| style          | dark                                 |
+----------------+--------------------------------------+
| blockModelId   | custom-section                       |
+----------------+--------------------------------------+
| order          | First                                |
+----------------+--------------------------------------+
| location       | North                                |
+----------------+--------------------------------------+
| invalid        | Should not show up                   |
+----------------+--------------------------------------+
