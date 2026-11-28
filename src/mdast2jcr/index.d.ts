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

/**
 * The Field object that represents a field in the model.
 *
 * https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/field-types#component-types
 */
export interface FieldDef {
  component: 'group' | 'aem-tag' | 'aem-content' | 'boolean' | 'checkbox-group' | 'container' |
      'aem-content-fragment' | 'date-time' | 'aem-experience-fragment' | 'multiselect' |
      'number' | 'radio-group' | 'reference' | 'richtext' | 'select' | 'tab' | 'text' |
      (string & {});
  valueType: string;
  name: string;
  label: string;
  value?: string;
  multi?: boolean;
  configUrl?: string;
  fields?: FieldDef[]; // for nested fields that have a component value type "group"
}

/**
 * The Model object that represents a block's model mapping that should be used to generate
 * the jcr xml.
 */
export interface ModelDef {
  /**
   * The id of the model.
   */
  id: string;

  /**
   * A list of fields that are to be used to map the mdast to the jcr xml.
   */
  fields: FieldDef[];
}

export type ResourceType = 'core/franklin/components/text/v1/text'
    | 'core/franklin/components/text/v1/block'
    | 'core/franklin/components/block/v1/block/item'
    | 'core/franklin/components/title/v1/title'
    | 'core/franklin/components/image/v1/image'
    | 'core/franklin/components/button/v1/button'
    | 'core/franklin/components/section/v1/section'
    | 'core/franklin/components/columns/v1/columns'
    | 'core/franklin/components/page/v1/page';

export interface ComponentDef {
  title: string;
  id: string;
  plugins: {
    xwalk: {
      page: {
        resourceType: ResourceType;
        template: {
          [key: string]: string;
        }
      };
    };
  };
}

export interface GroupDef {
  title: string;
  id: string;
  components: Array<ComponentDef>;
}

export interface DefinitionDef {
  groups: Array<GroupDef>;
}

export interface Filter {
  id: string,
  components: Array<string>;
}

/**
 * Options object for the mdast to jcr conversion.
 */
export interface Mdast2JCROptions {
  /**
   * An array of models that should be used to generate the jcr xml.
   */
  models: Array<ModelDef>;

  /**
   * A definition object containing groups and components.
   */
  definition: DefinitionDef;

  /**
   * Defines the filters.
   */
  filters: Array<Filter>;
}

/**
 * The keys are the base names of the properties, and the values are objects with the full
 * property names as keys and the field objects as values.
 */
export interface CollapsedFields {
  [key: string]: {
    [key: string]: FieldDef;
  };
}

/**
 * Converts the mdast to a jcr xml markup.
 * @param {Node} mdast The mdast
 * @param {Mdast2JCROptions} [opts] options
 * @returns {Promise<string>} the xml markup
 */
export default function mdast2jcr(mdast: object, opts?: Mdast2JCROptions): Promise<string>;
