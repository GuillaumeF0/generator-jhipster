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
import { beforeEach, describe, esmocha, expect, it } from 'esmocha';
import { inspect } from 'node:util';

import type { GetWebappTranslationCallback } from '../../client/translation';

import { createTranslationReplacer } from './translate-playwright.ts';

describe('generator - playwright - transform', () => {
  describe('replacePlaywightTranslations', () => {
    let replacePlaywrightTranslations: ReturnType<typeof createTranslationReplacer>;

    beforeEach(() => {
      let value = 0;
      const testImpl: GetWebappTranslationCallback = (key, data) => {
        switch (key) {
          case 'blank':
            return '';
          case 'html':
            return '<html> inside html tag! </html> outise html tag';
          default:
            return `translated-value-${key}-${data ? `${inspect(data)}-` : ''}${value++}`;
        }
      };
      replacePlaywrightTranslations = createTranslationReplacer(esmocha.fn<GetWebappTranslationCallback>().mockImplementation(testImpl));
    });

    describe('.ts files', () => {
      const extension = '.ts';

      it('should translate __jhiTransformTranslateRemoveHtml__ function', () => {
        const body = `
title: __jhiTransformTranslateRemoveHtml__('activate.title1'),
title: __jhiTransformTranslateRemoveHtml__('activate.title2'),
`;
        expect(replacePlaywrightTranslations(body, extension)).toMatchInlineSnapshot(`
"
title: 'translated-value-activate.title1-0',
title: 'translated-value-activate.title2-1',
"
`);
      });
    });

    describe('.ts files', () => {
      const extension = '.ts';

      it('should translate __jhiTransformTranslateRemoveHtml__ function', () => {
        const body = `
title: __jhiTransformTranslateRemoveHtml__('html'),
`;
        expect(replacePlaywrightTranslations(body, extension)).toMatchInlineSnapshot(`
"
title:  inside html tag!  outise html tag
"
`);
      });
    });
  });
});
