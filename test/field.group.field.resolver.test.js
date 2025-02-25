/*
 * Copyright 2024 Adobe. All rights reserved.
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
import FieldGroup from '../src/mdast2jcr/domain/FieldGroup.js';
import FieldGroupFieldResolver
  from '../src/mdast2jcr/domain/FieldGroupFieldResolver.js';
import Component from '../src/mdast2jcr/domain/Component.js';

describe('Field Group Field Resolver Tests', () => {
  /**
   * The following test is responsible to locate the best possible heading match
   * for a header based on what the template has defined, IF there is a field
   * defined in the template.  The result is that other fields that do not match
   * in the field group are thrown out up to the best possible match.
   *
   * For example, fields h_3, h_2, and h_1 are defined in the model and the
   * template defines h_2Type as h2. When the node being processed is a h2,
   * the h_3 field is thrown out because there was no match.  The h_2 field is
   * kept because it matches the node type.  The h_1 field is still kept because
   * it could still be used.  For example, the following md:
   *
   * -----------------------------------
   * Sample
   * ===================================
   * <!-- H1 is missing -->
   * ## Heading 2
   * ### Heading 3
   * -----------------------------------
   *
   * And the node being processed is an h2, the h_1 field is discarded because
   * we matched at the h2 level, and model ordering is important.
   */
  it('Locate best possible heading match using template', () => {
    const model = {
      id: 'sample',
      fields: [
        { name: 'h_1' },
        { name: 'h_1Type' },
        { name: 'h_2' },
        { name: 'h_2Type' },
        { name: 'h_3' },
        { name: 'h_3Type' },
      ],
    };

    const fieldGrouping = new FieldGroup(model);
    const fgr = new FieldGroupFieldResolver(new Component('Sample', 'sample', {
      name: 'Sample',
      model: 'sample',
      h_2Type: 'h2',
    }));
    fgr.resolve({ type: 'heading', depth: 2 }, fieldGrouping.fields[0]);
    assert(fieldGrouping.fields[0].fields.length === 1);
    assert(fieldGrouping.fields[0].fields[0].name === 'h_3');
  });

  it('Locate best possible heading match no template', () => {
    const model = {
      id: 'sample',
      fields: [
        { name: 'h_1' },
        { name: 'h_1Type' },
        { name: 'h_2' },
        { name: 'h_2Type' },
        { name: 'h_3' },
        { name: 'h_3Type' },
      ],
    };

    const fieldGrouping = new FieldGroup(model);
    const fgr = new FieldGroupFieldResolver(new Component('Sample', 'sample', {}));

    // because we didn't have a template to match against, the logic falls back to the first field
    // this is typically a developer mistake and should indicate the Type in the template
    const field = fgr.resolve({ type: 'heading', depth: 2 }, fieldGrouping.fields[0]);
    assert(field.name === 'h_1');
    assert(fieldGrouping.fields[0].fields.length === 2);
    assert(fieldGrouping.fields[0].fields[0].name === 'h_2');
    assert(fieldGrouping.fields[0].fields[1].name === 'h_3');
  });

  /**
   * This test is to very that when a paragraph contains an image as the first
   * child node, and the field component is a reference, that the field is
   * that the expected field is returned and the field is removed from the
   * field group.
   */
  it('paragraph with image child node and reference component', () => {
    const model = {
      id: 'sample',
      fields: [
        { name: 'image', component: 'reference' },
        { name: 'text', component: 'text' },
      ],
    };
    const fieldGrouping = new FieldGroup(model);
    const fgr = new FieldGroupFieldResolver(new Component('Sample', 'sample', {}));

    const field = fgr.resolve({ type: 'paragraph', children: [{ type: 'image' }] }, fieldGrouping.fields[0]);
    assert(field.name === 'image' && field.component === 'reference');
    assert(fieldGrouping.fields[0].fields.length === 0);
  });

  it('paragraph with link child node and text component', () => {
    const model = {
      id: 'sample',
      fields: [
        { name: 'link', component: 'text' },
        { name: 'linkAlt', component: 'text' },
      ],
    };
    const fieldGrouping = new FieldGroup(model);
    const fgr = new FieldGroupFieldResolver(new Component('Sample', 'sample', {}));

    const field = fgr.resolve({ type: 'paragraph', children: [{ type: 'link' }] }, fieldGrouping.fields[0]);
    assert(field.name === 'link' && field.component === 'text');
    assert(field.collapsed.length === 1);
    assert(fieldGrouping.fields[0].fields.length === 0);
  });
});
