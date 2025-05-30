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
import { encodeHtml } from '../../utils.js';

function image(context) {
  const uniqueName = Handlebars.helpers.nameHelper.call(context, 'image');
  const { alt, url } = context;

  const encoded = encodeHtml(url);
  return `<image${uniqueName} sling:resourceType="core/franklin/components/image/v1/image" 
    jcr:primaryType="nt:unstructured" image="${encoded}" imageAlt="${encodeHtml(alt)}"/>\n`;
}

export default image;
