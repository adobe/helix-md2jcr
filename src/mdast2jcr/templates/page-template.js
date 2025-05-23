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
export default function pageTemplate() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="cq:Page">
    {{#page}}
        <root jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/root/v1/root">
            {{#each children }}
                {{#section @index children }}
                {{#each children }}
                    {{> (whichPartial this.type) models=../../models definition=../../definition filters=../../filters}}
                {{/each}}
                {{/section}}
            {{/each}}
        </root>
    {{/page}}
</jcr:root>`;
}
