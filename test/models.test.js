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
import {
  findModelById,
  getField,
  getModelFieldNames,
} from '../src/mdast2jcr/domain/Models.js';

describe('Models Utility Test', () => {
  describe('findModelById', () => {
    it('should return the model with the given id', () => {
      const models = [
        { id: '1', name: 'model1' },
        { id: '2', name: 'model2' },
        { id: '3', name: 'model3' },
      ];
      const modelId = '2';
      const expectedModel = { id: '2', name: 'model2' };

      const result = findModelById(models, modelId);
      assert.deepStrictEqual(result, expectedModel);
    });

    it('should return undefined if the model is not found', () => {
      const models = [
        { id: '1', name: 'model1' },
        { id: '2', name: 'model2' },
        { id: '3', name: 'model3' },
      ];
      const modelId = '4';

      const result = findModelById(models, modelId);
      assert.strictEqual(result, undefined);
    });
  });

  describe('getField', () => {
    it('should return the field with the given name', () => {
      const model = {
        fields: [
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
        ],
      };
      const fieldName = 'title';
      const expectedField = { name: 'title', type: 'string' };

      const result = getField(model, fieldName);
      assert.deepStrictEqual(result, expectedField);
    });

    it('should return undefined if the field is not found', () => {
      const model = {
        fields: [
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
        ],
      };
      const fieldName = 'nonexistent';

      const result = getField(model, fieldName);
      assert.strictEqual(result, undefined);
    });

    it('should return undefined if the model is falsy', () => {
      const fieldName = 'title';

      const result = getField(null, fieldName);
      assert.strictEqual(result, undefined);
    });
  });

  describe('getModelFieldNames', () => {
    it('should return an array of field names excluding "classes"', () => {
      const model = {
        fields: [
          { name: 'title', type: 'string' },
          { name: 'classes', type: 'string' },
          { name: 'content', type: 'string' },
        ],
      };
      const expectedFields = ['title', 'content'];

      const result = getModelFieldNames(model, true);
      assert.deepStrictEqual(result, expectedFields);
    });

    it('should exclude the "classes" field from the list', () => {
      const model = {
        fields: [
          { name: 'title', type: 'string' },
          { name: 'classes', type: 'string' },
          { name: 'content', type: 'string' },
        ],
      };
      const expectedFields = ['title', 'content'];

      const result = getModelFieldNames(model);
      assert.deepEqual(result, expectedFields);
    });

    it('should return an empty array if there are no fields', () => {
      const model = {
        fields: [],
      };
      const expectedFields = [];

      const result = getModelFieldNames(model);
      assert.deepEqual(result, expectedFields);
    });

    it('should return an empty array if model is falsy', () => {
      const expectedFields = [];

      const result = getModelFieldNames(null);
      assert.deepEqual(result, expectedFields);
    });
  });
});
