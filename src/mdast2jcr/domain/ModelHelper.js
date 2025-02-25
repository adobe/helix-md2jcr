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

import { getComponentById, getComponentByTitle } from './Definitions.js';
import FieldGroup from './FieldGroup.js';

/**
 * @typedef {import('../index.d.ts').Filter} Filter
 */

class ModelHelper {
  /**
   * Constructor.
   * @param {string} blockName The block name.
   * @param {Array<Model>} models The models.
   * @param {Definition} definition The definition object.
   * @param {Array<Filter>} filters The filters to apply to the fields.
   */
  constructor(blockName, models, definition, filters) {
    this.blockName = blockName;
    this._fixFieldOrder(models);
    this.models = models;
    this.definition = definition;
    this.filters = filters;
    this.groups = [];
    this._groupModelFields();
  }

  /**
   * The field order in the models is not guaranteed to be correct.  This method will fix the order
   * of the fields in the models so that the base field is followed by the suffix fields.
   * @param {Array<Model>} models The models to fix the field order.
   * @private {void}
   */
  // eslint-disable-next-line class-methods-use-this
  _fixFieldOrder(models) {
    const suffixes = ['Alt', 'MimeType', 'Type', 'Text', 'Title'];

    models.forEach((model) => {
      // collect the name of all the model fields that do not have a suffix
      const baseFields = model.fields
        .filter((field) => !suffixes.some((suffix) => field.name.endsWith(suffix)))
        .map((field) => field.name);

      // for each base field, find the associated fields with suffixes and update the model
      // fixing the order so that we can later group things together
      // eslint-disable-next-line no-param-reassign
      model.fields = baseFields.flatMap((baseField) => [
        // will return array with [field, fieldText, fieldType, etc]
        model.fields.find((field) => field.name === baseField),
        ...suffixes
          .map((suffix) => model.fields.find((field) => field.name === `${baseField}${suffix}`))
          .filter(Boolean)]);
    });
  }

  /**
   * Group the fields in the models.
   *
   * Given the name of the block, get the component and then locate the model.  If the component
   * has a filter, then get the filter and locate the associated component and its model.
   *
   * Each model will have a FieldGroup associated with it.
   * Each FieldGroup will contain the fields that belong to the model and any fields that
   * are part of a collapsed field will be grouped together.
   */
  _groupModelFields() {
    const component = getComponentByTitle(this.definition, this.blockName);
    const model = this.models.find((m) => m.id === component.modelId);

    // this FieldGroup is for the main model
    if (model) {
      this.groups.push({ modelId: model?.id || undefined, fieldGroup: new FieldGroup(model) });
    }

    // if the component has a filter, then get the associated model and create a FieldGroup for it
    if (component.filterId) {
      const filter = this.filters.find((f) => f.id === component.filterId);

      // now for each filter, get the model and create a FieldGroup for it
      filter.components.forEach((componentName) => {
        const c = getComponentById(this.definition, componentName);
        const filtersModel = this.models.find((m) => m.id === c.modelId);

        // could not locate the model for the filter throw
        if (!filtersModel) {
          throw new Error(`Unable to locate model for filter ${componentName}`);
        }

        this.groups.push({ modelId: filtersModel.id, fieldGroup: new FieldGroup(filtersModel) });
      });
    }
  }

  /**
   * Return the field group associated with the model id.
   * @param modelId
   * @return {FieldGroup|*|null}
   */
  getModelFieldGroup(modelId) {
    const result = this.groups.find((group) => group.modelId === modelId);

    // no need to pass the fieldGroup just return the fields in the group
    return (result) ? result.fieldGroup : null;
  }
}

export default ModelHelper;
