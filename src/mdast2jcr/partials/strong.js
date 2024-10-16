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
import Handlebars from 'handlebars';

function strong(context) {
  const uniqueName = Handlebars.helpers.nameHelper.call(context, 'button');
  const { children: [child] } = context;
  const { title, url, children: [{ value }] } = child;
  const attributes = {
    'sling:resourceType': 'core/franklin/components/button/v1/button',
    'jcr:primaryType': 'nt:unstructured',
    link: url,
    linkText: value,
    linkType: 'primary',
  };
  if (title != null) {
    attributes.linkTitle = title;
  }

  const attributesStr = Object.entries(attributes).map(([k, v]) => `${k}="${v}"`).join(' ');
  return `<button${uniqueName} ${attributesStr}  />`;
}

export default strong;
