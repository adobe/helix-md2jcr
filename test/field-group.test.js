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

describe('Field Group Tests', () => {
  it('fields only', () => {
    const model = {
      id: 'sample',
      fields: [
        { name: 'field1' },
        { name: 'field2' },
      ],
    };

    const fieldGrouping = new FieldGroup(model);
    assert.equal(fieldGrouping.fields.length, 2);
  });

  it('single group test', () => {
    const model = {
      id: 'sample',
      fields: [
        { name: 'group1_field1' },
        { name: 'group1_field2' },
      ],
    };

    const fieldGrouping = new FieldGroup(model);
    assert.equal(fieldGrouping.fields.length, 1);
  });

  it('two group test', () => {
    const model = {
      id: 'sample',
      fields: [
        { name: 'group1_field1' },
        { name: 'group2_field1' },
      ],
    };

    const fieldGrouping = new FieldGroup(model);
    assert.equal(fieldGrouping.fields.length, 2);
  });

  it('verify expected fields in group', () => {
    const model = {
      id: 'sample',
      fields: [
        { name: 'group1_field1' },
        { name: 'group1_field2' },
      ],
    };

    const fieldGrouping = new FieldGroup(model);
    assert.equal(fieldGrouping.fields.length, 1);
    assert.equal(fieldGrouping.fields[0].fields.length, 2);
  });

  it('verify multiple groups contain expected fields', () => {
    const model = {
      id: 'sample',
      fields: [
        { name: 'group1_field1' },
        { name: 'group1_field2' },
        { name: 'group2_field1' },
      ],
    };

    const fieldGrouping = new FieldGroup(model);
    assert.equal(fieldGrouping.fields.length, 2);
    assert.equal(fieldGrouping.fields[0].fields.length, 2);
    assert.equal(fieldGrouping.fields[1].fields.length, 1);
  });

  it('verify multiple groups with and without group fields', () => {
    const model = {
      id: 'sample',
      fields: [
        { name: 'field1' },
        { name: 'group2_field1' },
        { name: 'group3_field1' },
        { name: 'group3_field2' },
      ],
    };

    const fieldGrouping = new FieldGroup(model);
    assert.equal(fieldGrouping.fields.length, 3);
    assert.equal(fieldGrouping.fields[0].fields.length, 1);
    assert.equal(fieldGrouping.fields[1].fields.length, 1);
    assert.equal(fieldGrouping.fields[2].fields.length, 2);
  });

  it('verify field object structure', () => {
    const model = {
      id: 'sample',
      fields: [
        { name: 'field1' },
        { name: 'group2_field1' },
      ],
    };

    const fieldGrouping = new FieldGroup(model);
    assert.equal(fieldGrouping.fields[0].name, 'field1');
    assert.equal(fieldGrouping.fields[0].fields[0].name, 'field1');
    assert.equal(fieldGrouping.fields[0].fields.length, 1);
    assert.equal(fieldGrouping.fields[1].name, 'group2');
    assert.equal(fieldGrouping.fields[1].fields[0].name, 'group2_field1');
    assert.equal(fieldGrouping.fields[1].fields.length, 1);
  });

  it('verify that class field is not part of the group', () => {
    const model = {
      id: 'sample',
      fields: [
        { name: 'field1' },
        { name: 'classes' },
      ],
    };

    const fieldGrouping = new FieldGroup(model);
    assert.equal(fieldGrouping.fields.length, 1);
  });

  it('verify model with empty fields does not crash', () => {
    const model = {
      id: 'sample',
    };

    const fieldGrouping = new FieldGroup(model);
    assert.equal(fieldGrouping.fields.length, 0);
  });

  it('one field with collapsing', () => {
    const model = {
      id: 'sample',
      fields: [
        { name: 'link' },
        { name: 'linkText' },
      ],
    };

    const fieldGrouping = new FieldGroup(model);
    assert.equal(fieldGrouping.fields.length, 1);
    assert.equal(fieldGrouping.fields[0].fields[0].collapsed.length, 1);
  });

  it('real example', () => {
    const model = {
      id: 'teaser',
      fields: [
        {
          component: 'text',
          name: 'teaserText_subtitle',
        },
        {
          component: 'text',
          name: 'teaserText_title',
        },
        {
          component: 'text',
          name: 'teaserText_titleType',
        },
        {
          component: 'text',
          name: 'teaserText_description',
        },
        {
          component: 'text',
          name: 'teaserText_cta1',
        },
        {
          component: 'text',
          name: 'teaserText_cta1Text',
        },
        {
          component: 'text',
          name: 'teaserText_cta2',
        },
        {
          component: 'text',
          name: 'teaserText_cta2Text',
        },
        {
          component: 'text',
          name: 'teaserText_cta2Type',
        },
        {
          component: 'reference',
          name: 'image',
        },
        {
          component: 'text',
          name: 'imageAlt',
        },
        {
          component: 'text',
          name: 'imageText',
        },
      ],
    };

    const fieldGrouping = new FieldGroup(model);
    assert.equal(fieldGrouping.fields.length, 2);
    assert.equal(fieldGrouping.fields[0].fields.length, 5);
    assert.equal(fieldGrouping.fields[0].fields[0].collapsed, undefined);
    assert.equal(fieldGrouping.fields[0].fields[1].collapsed.length, 1);
    assert.equal(fieldGrouping.fields[0].fields[2].collapsed, undefined);
    assert.equal(fieldGrouping.fields[0].fields[3].collapsed.length, 1);
    assert.equal(fieldGrouping.fields[0].fields[4].collapsed.length, 2);
    assert.equal(fieldGrouping.fields[1].fields.length, 1);
    assert.equal(fieldGrouping.fields[1].fields[0].collapsed.length, 2);
  });

  it('real example 2', () => {
    const model = {
      id: 'teaser',
      fields: [
        {
          component: 'text',
          valueType: 'string',
          name: 'quote_eyebrow',
          label: 'Eyebrow',
        },
        {
          component: 'text',
          valueType: 'string',
          name: 'quote_eyebrowType',
          hidden: true,
        },
        {
          component: 'text',
          valueType: 'string',
          name: 'quote_title',
          label: 'Title',
        },
        {
          component: 'text',
          valueType: 'string',
          name: 'quote_titleType',
          hidden: true,
        },
        {
          component: 'text',
          valueType: 'string',
          name: 'quote_text',
          label: 'Quote Text',
          required: true,
        },
        {
          component: 'aem-content',
          valueType: 'string',
          name: 'link',
          label: 'Link',
        },
        {
          component: 'text',
          valueType: 'string',
          name: 'linkText',
          label: 'Link Text',
        },
      ],
    };

    const fieldGrouping = new FieldGroup(model);
    assert.equal(fieldGrouping.fields.length, 2);
  });

  it('verify a mix bag of grouping and collapsing', () => {
    const model = {
      id: 'key-values',
      fields: [
        // Group 1
        {
          component: 'text',
          name: 'callout',
          label: 'Call Out',
        },
        // below there are two fields associated with the above field
        // collapsed field
        {
          component: 'text',
          name: 'calloutType',
          label: 'Callout Type',
        },
        // grouped field
        {
          component: 'text',
          name: 'callout_text',
          label: 'Callout Text',
        },
      ],
    };

    const fieldGrouping = new FieldGroup(model);
    assert.equal(fieldGrouping.fields.length, 1);
    assert.equal(fieldGrouping.fields[0].fields.length, 2);
    assert.equal(fieldGrouping.fields[0].fields[0].collapsed.length, 1);
  });
});
