/**
 * Copyright 2013-2026 the original author or authors from the JHipster project.
 *
 * This file is part of the JHipster project, see https://www.jhipster.tech/
 * for more information.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { passthrough } from '@yeoman/transform';
import type { MemFsEditorFile } from 'mem-fs-editor';
import { Minimatch } from 'minimatch';

import type { GetWebappTranslationCallback } from '../../client/translation.js';

const TRANSLATE_FUNCTION_ARGS = /\(\s*'(?<key>[^']+)'(?:,\s*(?<interpolate>\{(?:(?!\}\))[\s\S])*\}))?\)/gs.source;

const replaceTranslationKeysWithText = (
  getWebappTranslation: GetWebappTranslationCallback,
  body: string,
  regexp: string,
  { stringify, escape }: { stringify?: boolean; escape?: (str: string) => string } = {},
) => {
  const matches = [...body.matchAll(new RegExp(regexp, 'g'))].reverse();

  for (const match of matches) {
    const target = match[0];

    const key = match.groups?.key;

    if (!key) {
      throw new Error(`Translation key not found for ${target}`);
    }

    let translation = getWebappTranslation(key);

    if (escape) {
      translation = escape(translation);
    }
    if (stringify) {
      translation = JSON.stringify(translation);
    }
    body = `${body.slice(0, match.index)}${translation}${body.slice(match.index + target.length)}`;
  }
  return body;
};

/**
 * Replace and cleanup translations.
 *
 * @type {import('../generator-base.js').EditFileCallback}
 * @this {import('../generator-base.js')}
 */
export const createTranslationReplacer = (getWebappTranslation: GetWebappTranslationCallback) =>
  function replacePlaywrightTranslations(body: string, filePath: string) {
    if (filePath.endsWith('.ts') || filePath.endsWith('.spec.ts')) {
      body = replaceTranslationKeysWithText(getWebappTranslation, body, `__jhiTransformTranslateRemoveHtml__${TRANSLATE_FUNCTION_ARGS}`, {
        stringify: true,
        escape: translation => translation.replaceAll(/<\/?[^>]+(>|$)/g, ''),
      });
    }
    return body;
  };

const minimatch = new Minimatch('**/*{.spec.ts,.ts}');
export const isTranslatedPlaywrightFile = (file: MemFsEditorFile) => minimatch.match(file.path);

export const translatePlaywrightFilesTransform = (getWebappTranslation: GetWebappTranslationCallback) => {
  const translate = createTranslationReplacer(getWebappTranslation);
  return passthrough(file => {
    file.contents = Buffer.from(translate(file.contents.toString(), file.path));
  });
};
