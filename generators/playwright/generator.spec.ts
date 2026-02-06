/**
 * Copyright 2013-2025 the original author or authors from the JHipster project.
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
import { before, describe, expect, it } from 'esmocha';
import { basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { snakeCase } from 'lodash-es';

import { clientFrameworkTypes, testFrameworkTypes } from '../../lib/jhipster/index.ts';
import {
  AuthenticationTypeMatrix,
  type Matrix,
  defaultHelpers as helpers,
  extendMatrix,
  fromMatrix,
  runResult,
} from '../../lib/testing/index.ts';
import { checkEnforcements, shouldSupportFeatures, testBlueprintSupport } from '../../test/support/index.ts';
import { GENERATOR_PLAYWRIGHT } from '../generator-list.ts';

import Generator from './generator.ts';

const { PLAYWRIGHT } = testFrameworkTypes;
const { ANGULAR, REACT, VUE } = clientFrameworkTypes;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generator = basename(__dirname);

const e2eMatrix = extendMatrix(
  fromMatrix({
    ...AuthenticationTypeMatrix,
  }),
  {
    clientFramework: [ANGULAR, REACT, VUE],
    withAdminUi: [false, true],
    clientRootDir: [undefined, { value: 'clientRoot/' }, { value: '' }],
  },
);

const e2eSamples: Matrix = Object.fromEntries(
  Object.entries(e2eMatrix).map(([name, sample]) => [
    name,
    {
      ...sample,
      testFrameworks: [PLAYWRIGHT],
    },
  ]),
);

const entities = [
  {
    name: 'EntityA',
    changelogDate: '20220129025419',
  },
];

describe(`generator - ${generator}`, () => {
  it('generator-list constant matches folder name', async () => {
    await expect((await import('../generator-list.ts'))[`GENERATOR_${snakeCase(generator).toUpperCase()}`]).toBe(generator);
  });
  shouldSupportFeatures(Generator);
  describe('blueprint support', () => testBlueprintSupport(generator));
  checkEnforcements({ client: true }, GENERATOR_PLAYWRIGHT);

  it('samples matrix should match snapshot', () => {
    expect(e2eSamples).toMatchSnapshot();
  });

  Object.entries(e2eSamples).forEach(([name, sampleConfig]) => {
    describe(name, () => {
      before(async () => {
        await helpers.runJHipster(generator).withJHipsterConfig(sampleConfig, entities);
      });

      it('should match generated files snapshot', () => {
        expect(runResult.getStateSnapshot()).toMatchSnapshot();
      });

      it('contains playwright testFramework', () => {
        runResult.assertJsonFileContent('.yo-rc.json', { 'generator-jhipster': { testFrameworks: [PLAYWRIGHT] } });
      });

      describe('withAdminUi', () => {
        const { applicationType, withAdminUi, clientRootDir = '' } = sampleConfig;
        const generateAdminUi = applicationType !== 'microservice' && withAdminUi;

        if (applicationType !== 'microservice') {
          const adminUiRoutingTitle = generateAdminUi ? 'should generate admin routing' : 'should not generate admin routing';
          const playwrightAdminRoot = clientRootDir ? `${clientRootDir}test/` : 'src/test/javascript/';
          it(adminUiRoutingTitle, () => {
            const assertion = (...args) =>
              generateAdminUi ? (runResult.assertFileContent as any)(...args) : (runResult.assertNoFileContent as any)(...args);

            assertion(
              `${playwrightAdminRoot}playwright/e2e/account/login-page.spec.ts`,
              'it.beforeEach(async ({ page, navbarPage }) => {\n'+
              "  await page.goto('');\n"+
              '  await navbarPage.getAccountMenuLocator().click();\n'+
              '  await navbarPage.getLoginItemLocator().click();\n'+
              '});\n'
            );

            assertion(
              `${playwrightAdminRoot}playwright/e2e/administration/administration.spec.ts`,
              "  it.describe('/metrics', () => {\n"+
              "    it('should load the page', async ({ administrationPage, navbarPage }) => {\n"+
              '      await navbarPage.getAdminMenuLocator().click();\n'+
              "      await navbarPage.getAdminMenuItemLocator('metrics').click();\n"+
              '      await expect(administrationPage.getMetricsPageHeadingLocator()).toBeVisible();\n'+
              '    });\n'+
              '  });\n'+
              '\n'+
              "  it.describe('/health', () => {\n"+
              "    it('should load the page', async ({ administrationPage, navbarPage }) => {\n"+
              '      await navbarPage.getAdminMenuLocator().click();\n'+
              "      await navbarPage.getAdminMenuItemLocator('health').click();\n"+
              '      await expect(administrationPage.getHealthPageHeadingLocator()).toBeVisible();\n'+
              '    });\n'+
              '  });\n'+
              '\n'+
              "  it.describe('/logs', () => {\n"+
              "    it('should load the page', async ({ administrationPage, navbarPage }) => {\n"+
              '      await navbarPage.getAdminMenuLocator().click();\n'+
              "      await navbarPage.getAdminMenuItemLocator('logs').click();\n"+
              '      await expect(administrationPage.getLogsPageHeadingLocator()).toBeVisible();\n'+
              '    });\n'+
              '  });\n'+
              '\n'+
              "  it.describe('/configuration', () => {\n"+
              "    it('should load the page', async ({ administrationPage, navbarPage }) => {\n"+
              '      await navbarPage.getAdminMenuLocator().click();\n'+
              "      await navbarPage.getAdminMenuItemLocator('configuration').click();\n"+
              '      await expect(administrationPage.getConfigurationPageHeadingLocator()).toBeVisible();\n'+
              '    });\n'+
              '  });\n'
            );

            assertion(
              `${playwrightAdminRoot}playwright/support/entity.ts`,
              `export const entityTableSelector = '[data-cy="entityTable"]';\n`+
              `export const entityCreateButtonSelector = '[data-cy="entityCreateButton"]';\n`+
              `export const entityCreateSaveButtonSelector = '[data-cy="entityCreateSaveButton"]';\n`+
              `export const entityCreateCancelButtonSelector = '[data-cy="entityCreateCancelButton"]';\n`+
            );
          });
        }
      });
    });
  });
});
