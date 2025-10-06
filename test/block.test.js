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
     * Container block test to verify that container blocks are generated correctly.
     * Container blocks are blocks that contain other blocks, and therefore require
     * special handling, validation of classes, and the correct structure.
     */
    it('container-block', async () => {
      await testBlock('container-block', `${folder}/container-block`);
    });

    /**
     * Container block test to verify that container blocks with multiple models are
     * generated correctly. No classes should be added to the block item.
     */
    it('container-block-multi-model', async () => {
      await testBlock('container-block-multi-model', `${folder}/container-block-multi-model`);
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
        expect(e.message).to.contain('The content isn’t mapping to the model correctly');
      }
    });
  });
});
