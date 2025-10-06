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
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { stat, readFile, unlink } from 'fs/promises';
import { run } from '../bin/md2jcr.js';

describe('bin/md2jcr', () => {
  const xmlPath = 'test/fixtures/bin/block.xml';

  const cleanup = async () => {
    try {
      await unlink(xmlPath);
    } catch {
      // ignore
    }
  };

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup(xmlPath);
  });

  it('should convert a markdown file to JCR XML', async () => {
    const mdPath = 'test/fixtures/bin/block.md';

    // Run the conversion
    await run(mdPath, false, false, 'test/fixtures/bin');

    // Verify the XML file was created
    const statResult = await stat(xmlPath);
    expect(statResult.isFile()).to.equal(true);

    // Verify the XML content is valid
    const xmlContent = await readFile(xmlPath, 'utf-8');
    expect(xmlContent).to.include('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xmlContent).to.include('jcr:root');
  });
});
