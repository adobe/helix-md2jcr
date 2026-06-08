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
import { expect } from 'chai';
import { loadBlockResources } from './test.utils.js';
import { test } from './test-base.js';
import md2jcr from '../src/md2jcr/index.js';

async function testBlock(spec, folder) {
  // split the spec by a / to find the name and the folder
  const { models, definition, filters } = await loadBlockResources(spec, `fixtures/${folder}`);
  await test(`${folder}/${spec}`, { models, definition, filters });
}

describe('block tests', () => {
  /**
   * The suite of core block unit tests.
   */
  describe('core', () => {
    const folder = 'blocks/core';

    /**
     * General Block with random content.
     */
    it('block', async () => {
      await testBlock('block', `${folder}/block`);
    });

    /**
     * Verify that all the properties defined in component block template are correctly
     * copied into the block.
     */
    it('block properties', async () => {
      await testBlock('block-properties', `${folder}/block-properties`);
    });

    it('cards', async () => {
      await testBlock('cards', `${folder}/cards`);
    });

    /**
     * General Block with random content.
     */
    it('columns', async () => {
      await testBlock('columns', `${folder}/columns`);
    });

    /**
     * General Block with random content.
     */
    it('columns-boilerplate', async () => {
      await testBlock('columns-boilerplate', `${folder}/columns-boilerplate`);
    });

    /**
     * Container blocks create a parent block node and one or more child block item
     * nodes. They require special handling for parent vs. child rows, class
     * validation, and structure. All container-block fixtures live together under
     * blocks/core/container-block.
     */
    describe('container-block', () => {
      const containerFolder = `${folder}/container-block`;

      /**
       * Baseline container block: parent property rows plus child item rows,
       * including class handling on the parent and child items.
       */
      it('container-block-core', async () => {
        await testBlock('container-block-core', `${containerFolder}/container-block-core`);
      });

      /**
       * Container block with multiple child models. No classes should be added to
       * the block item.
       */
      it('container-block-multi-model', async () => {
        await testBlock('container-block-multi-model', `${containerFolder}/container-block-multi-model`);
      });

      /**
       * When parent property rows are omitted, child items are still generated. Per
       * the spec, parent rows are single-column and child rows are multi-column, so
       * a multi-column first body row signals that parent rows were skipped.
       */
      it('container-block-no-parent-rows', async () => {
        await testBlock('container-block-no-parent-rows', `${containerFolder}/container-block-no-parent-rows`);
      });

      /**
       * Parent has no model, with a single-field child. With no parent model there
       * are no parent property rows, so each single-cell body row becomes a child
       * item — the opposite of a block with a parent model, where a single cell is
       * parent data.
       */
      it('container-block-no-parent-model', async () => {
        await testBlock('container-block-no-parent-model', `${containerFolder}/container-block-no-parent-model`);
      });

      /**
       * Parent model and an allowed child, but only a parent property row and no
       * child rows. An empty container is valid (e.g. a Cards block with block-level
       * properties and no cards yet), so the single-cell row is parent data and no
       * child items are produced — without any warning.
       */
      it('container-block-parent-only', async () => {
        await testBlock('container-block-parent-only', `${containerFolder}/container-block-parent-only`);
      });

      /**
       * Parent (multiple fields) has only field-hint comments and no values,
       * followed by multi-column child rows. The hint-only rows are consumed as
       * parent rows but set no properties, and the child rows become items.
       */
      it('container-block-parent-hints', async () => {
        await testBlock('container-block-parent-hints', `${containerFolder}/container-block-parent-hints`);
      });

      /**
       * Single-field parent property left blank with an empty row (the EDS
       * convention for an unset parent property), followed by a single-column child
       * value. The empty row is consumed as the parent property (left empty), and
       * the next single-column row becomes a child item.
       */
      it('container-block-empty-parent-single-child', async () => {
        await testBlock('container-block-empty-parent-single-child', `${containerFolder}/container-block-empty-parent-single-child`);
      });

      /**
       * Parent fields share a prefix (one field group), where a single parent row
       * uses a field hint to target a later field. The hint skips the earlier field
       * in the group (left unset) and assigns the value to the hinted field.
       */
      it('container-block-parent-hint-skip', async () => {
        await testBlock('container-block-parent-hint-skip', `${containerFolder}/container-block-parent-hint-skip`);
      });
    });

    /**
     * The grouping test verifies that blocks with models that have grouped fields
     * are correctly generated.
     */
    it('embed', async () => {
      await testBlock('embed', `${folder}/embed`);
    });

    /**
     * The grouping test verifies that blocks with models that have grouped fields
     * are correctly generated.
     */
    it('grouping', async () => {
      await testBlock('grouping', `${folder}/grouping`);
    });

    /**
     * The grouping-with-defaults test verifies that blocks that have component definition
     * template properties are respected and are used when generating the block.
     */
    it('grouping-with-defaults', async () => {
      await testBlock('grouping-with-defaults', `${folder}/grouping-with-defaults`);
    });

    /**
     * The grouping-with-names test verifies that blocks that have use field name comments
     * in groups are properly handled.
     */
    it('grouping-with-names', async () => {
      await testBlock('grouping-with-names', `${folder}/grouping-with-names`);
    });

    /**
     * The good old classic hero block used for a simple test (probably redundant).
     */
    it('hero', async () => {
      await testBlock('hero', `${folder}/hero`);
    });

    /**
     * The hero-richtext block is a hero block with a richtext field.
     */
    it('hero-richtext', async () => {
      await testBlock('hero-richtext', `${folder}/hero-richtext`);
    });

    /**
     * The key-value block verifies that key-value pairs are handled correctly.
     * Verify that rows with no content is handle correctly.
     */
    it('key-value', async () => {
      await testBlock('key-value', `${folder}/key-value`);
    });

    /**
     * The metadata block test verifies that metadata fields are correctly
     * added to the page properties.
     */
    it('metadata', async () => {
      await testBlock('metadata', `${folder}/metadata`);
    });

    /**
     * The metadata-expanded block test verifies that metadata fields are correctly
     * added to the page properties, and include more complex handling of images.
     */
    it('metadata-expanded', async () => {
      await testBlock('metadata-expanded', `${folder}/metadata-expanded`);
    });

    /**
     * The metadata-aem-mapping block test verifies that metadata fields are correctly
     * mapped to their aem properties.
     */
    it('metadata-aem-mapping', async () => {
      await testBlock('metadata-aem-mapping', `${folder}/metadata-aem-mapping`);
    });

    /**
     * The metadata-aem-mapping-case block test verifies that metadata fields are correctly
     * mapped to their aem properties if the case of the metadata field is uppercase.
     */
    it('metadata-aem-mapping', async () => {
      await testBlock('metadata-aem-mapping-case', `${folder}/metadata-aem-mapping-case`);
    });

    /**
     * The metadata-quotes block test verifies that metadata fields are correctly
     * handled when the text contains quotes.
     */
    it('metadata-quotes', async () => {
      await testBlock('metadata-quotes', `${folder}/metadata-quotes`);
    });

    /**
     * The multi-cell block test verifies that model grouping is correctly handled.
     * Where each model field that is grouped is in its own cell.
     */
    it('multi-cell', async () => {
      await testBlock('multi-cell', `${folder}/multi-cell`);
    });

    /**
     * A mix bag of different fields in a block.
     */
    it('paragraph', async () => {
      await testBlock('paragraph', `${folder}/paragraph`);
    });

    /**
     * A number of different blocks with different paragraph structures to test.
     */
    it('richtext', async () => {
      await testBlock('richtext', `${folder}/richtext`);
    });

    it('richtext-html', async () => {
      await testBlock('richtext-html', `${folder}/richtext-html`);
    });

    /**
     * Verify that richtext consumes content up to the next image.
     */
    it('richtext-greedy', async () => {
      await testBlock('richtext-greedy', `${folder}/richtext-greedy`);
    });

    /**
     * Verify that sections are correctly generated by assigning the metadata to
     * each section element.
     */
    it('section-metadata', async () => {
      await testBlock('section-metadata', `${folder}/section-metadata`);
    });

    it('section-metadata-custom', async () => {
      await testBlock('section-metadata-custom', `${folder}/section-metadata-custom`);
    });

    it('missing-cell-data', async () => {
      await testBlock('missing-cell-data', `${folder}/missing-cell-data`);
    });

    it('suffixes', async () => {
      await testBlock('suffixes', `${folder}/suffixes`);
    });

    /**
     * This test is to verify that model fields that have a component type of 'tab'
     * are not included in the model fields, as this is a special case for UE UI.
     */
    it('tabs', async () => {
      await testBlock('tabs', `${folder}/tabs`);
    });

    /**
     * The data-uri-image block test verifies that image URLs starting with 'data:'
     * are handled correctly by returning an empty string for the image URL.
     */
    it('data-uri-image', async () => {
      await testBlock('data-uri-image', `${folder}/data-uri-image`);
    });

    it('tables', async () => {
      await testBlock('tables', `${folder}/tables`);
    });
  });

  /**
   * Customer X block unit tests.
   */
  describe('cust-x', () => {
    const folder = 'blocks/cust-x';

    it('cust-x-accordion', async () => {
      await testBlock('cust-x-accordion', folder);
    });

    it('cust-x-cards', async () => {
      await testBlock('cards', folder);
    });

    it('cust-x-feature-list', async () => {
      await testBlock('cust-x-feature-list', folder);
    });

    it('cust-x-feature-list-v2', async () => {
      await testBlock('cust-x-feature-list-v2', folder);
    });

    it('cust-x-hero', async () => {
      await testBlock('cust-x-hero', folder);
    });

    it('cust-x-teaser', async () => {
      await testBlock('cust-x-teaser', folder);
    });

    it('cust-x-title', async () => {
      await testBlock('cust-x-title', folder);
    });
  });

  describe('mystique', () => {
    const folder = 'blocks/mystique';
    it('hero', async () => {
      await testBlock('hero/hero', folder);
    });

    it('teaser', async () => {
      await testBlock('teaser/teaser', folder);
    });

    it('cards', async () => {
      await testBlock('cards/cards', folder);
    });
  });

  /**
   * The suite of non grid table markdown block unit tests.
   */
  describe('plain-md', () => {
    /**
     * This test verifies that non grid table markdown blocks are correctly
     * converted to JCR XML.
     */
    const folder = 'blocks/plain-md';
    it('cards', async () => {
      await testBlock('cards', `${folder}/cards`);
    });
  });

  /**
   * The suite of error handling block unit tests.
   */
  describe('error handling', () => {
    const folder = 'blocks/error-handling';

    /**
     * Identify errors in blocks that are not correctly mapping to the model.
     * A classic case is that the cards model wants a image and text fields, but the
     * import script only generates a text field. This should throw an error
     * indicating that the markdown is invalid for the model.
     */
    it('missing-content', async () => {
      // expect an error and test that the error contains the correct block name
      try {
        await testBlock('missing-content', `${folder}/missing-content`);
      } catch (e) {
        expect(e.message).to.contain('cardsNoImages');
        expect(e.message).to.contain('mapping to the model correctly');
      }
    });

    /**
     * A single-cell body row that contains only a child component id (with no
     * property cells) is a malformed child item row. A valid child row is
     * multi-column — the component id followed by its property cells — so md2jcr
     * throws rather than silently consuming the lone component id as parent data.
     */
    it('container-block-child-missing-properties', async () => {
      let err;
      try {
        await testBlock(
          'container-block-child-missing-properties',
          `${folder}/container-block-child-missing-properties`,
        );
      } catch (e) {
        err = e;
      }
      expect(err).to.be.an('Error');
      expect(err.message).to.contain('Container block row in "Container"');
      expect(err.message).to.contain('has no property cells');
    });

    it('throws when models is not an array', async () => {
      const md = '+-------+\n| Block |\n+=======+\n| value |\n+-------+';
      let err;
      try {
        await md2jcr(md, { models: null, definition: { groups: [] }, filters: [] });
      } catch (e) {
        err = e;
      }
      expect(err).to.be.an('Error');
      expect(err.message).to.contain('*-models.json');
    });

    it('throws when block component is not found in definitions', async () => {
      const md = '+---------------+\n| UnknownBlock  |\n+===============+\n| value         |\n+---------------+';
      const options = {
        models: [{ id: 'other', fields: [] }],
        definition: { groups: [{ title: 'Blocks', id: 'blocks', components: [{ title: 'Other', id: 'other', plugins: { xwalk: { page: { resourceType: 'rt', template: {} } } } }] }] },
        filters: [],
      };
      let err;
      try {
        await md2jcr(md, options);
      } catch (e) {
        err = e;
      }
      expect(err).to.be.an('Error');
      expect(err.message).to.contain('UnknownBlock');
      expect(err.message).to.contain('does not exist');
    });
  });
});
