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

// import { clientFrameworkTypes } from '../../lib/jhipster/index.ts';
import { mutateData, stringHashCode } from '../../lib/utils/index.ts';
import BaseApplicationGenerator from '../base-application/index.ts';
import { createFaker } from '../base-application/support/index.ts';
import { generateTestEntity } from '../client/support/index.ts';
// import type { Source as ClientSource } from '../client/types.ts';
// import { CLIENT_MAIN_SRC_DIR } from '../generator-constants.js';
import type { Source as JavaSource } from '../java/types.d.ts';

import { playwrightEntityFiles, playwrightFiles } from './files.ts';
import type { Application as PlaywrightApplication, Entity as PlaywrightEntity, Field as PlaywrightField } from './types.ts';

// const { ANGULAR } = clientFrameworkTypes;

const WAIT_TIMEOUT = 3 * 60000;

export default class PlaywrightGenerator extends BaseApplicationGenerator<PlaywrightEntity, PlaywrightApplication> {
  // angularSchematic = false;
  async beforeQueue() {
    if (!this.fromBlueprint) {
      await this.composeWithBlueprints();
    }

    if (!this.delegateToBlueprint) {
      await this.dependsOnBootstrap('client');
    }
  }

  /*
  get prompting() {
    return this.asPromptingTaskGroup({
      async askForCypressOptions({ control }) {
        if (control.existingProject && !this.options.askAnswered) return;
        await this.prompt(
          [
            {
              when: (this.jhipsterConfig as any).clientFramework === ANGULAR,
              type: 'confirm',
              name: 'cypressCoverage',
              message: 'Would you like to generate code coverage for Cypress tests? [Experimental]',
            },
            {
              type: 'confirm',
              name: 'cypressAudit',
              message: 'Would you like to audit Cypress tests?',
            },
          ],
          this.config,
        );
      },
    });
  }
  */

  get [BaseApplicationGenerator.PROMPTING]() {
    return this.delegateTasksToBlueprint(() => this.prompting);
  }

  get loading() {
    return this.asLoadingTaskGroup({
      loadPackageJson({ application }) {
        this.loadNodeDependenciesFromPackageJson(
          application.nodeDependencies,
          this.fetchFromInstalledJHipster('client', 'resources', 'package.json'),
        );
      },

      /*
      prepareForTemplates({ application }) {
        const { cypressAudit = true, cypressCoverage = false } = this.jhipsterConfig as any;
        application.cypressAudit = cypressAudit;
        application.cypressCoverage = cypressCoverage;
      },
      */
    });
  }

  get [BaseApplicationGenerator.LOADING]() {
    return this.delegateTasksToBlueprint(() => this.loading);
  }

  get preparing() {
    return this.asPreparingTaskGroup({
      prepareForTemplates({ applicationDefaults }) {
        applicationDefaults({
          playwrightDir: ({ clientTestDir }) => (clientTestDir ? `${clientTestDir}playwright/` : 'playwright/'),
          playwrightTemporaryDir: ({ temporaryDir }) => (temporaryDir ? `${temporaryDir}playwright/` : '.playwright/'),
          playwrightBootstrapEntities: true,
          // cypressCoverageWebpack: data => Boolean(data.cypressCoverage && data.clientFrameworkAngular && data.clientBundlerWebpack),
        });
      },
      npmScripts({ application }) {
        const { devServerPort, devServerPortProxy: devServerPortE2e = devServerPort } = application;

        Object.assign(application.clientPackageJsonScripts, {
          playwright: 'playwright test --ui',
          'e2e:playwright': 'playwright test',
          'e2e:playwright:debug': 'npm run e2e:playwright -- --debug',
          'e2e:playwright:headed': 'npm run e2e:playwright -- --headed',
          'e2e:playwright:headless': 'npm run e2e:playwright --',
          'e2e:playwright:ui': 'npm run e2e:playwright -- --ui',
          'e2e:playwright:ui:debug': 'npm run e2e:playwright -- --ui --debug',
        });

        // Scripts that handle server and client concurrently should be added to the root package.json
        Object.assign(application.packageJsonScripts, {
          'ci:e2e:run': 'concurrently -k -s first -n application,e2e -c red,blue npm:ci:e2e:server:start npm:e2e:playwright:headless',
          'ci:e2e:dev': `concurrently -k -s first -n application,e2e -c red,blue npm:app:start npm:e2e:playwright:headless`,
          'e2e:dev': `concurrently -k -s first -n application,e2e -c red,blue npm:app:start npm:e2e:playwright:debug`,
          'e2e:devserver': this.angularSchematic
            ? `concurrently -k -s first -n backend,e2e -c red,blue npm:backend:start "npm run ci:server:await && ng e2e --configuration ${application.cypressCoverage ? 'coverage' : 'run'}"`
            : `concurrently -k -s first -n backend,frontend,e2e -c red,yellow,blue npm:backend:start npm:start "wait-on -t ${WAIT_TIMEOUT} http-get://127.0.0.1:${devServerPortE2e} && npm run e2e:headless -- -c baseUrl=http://localhost:${devServerPortE2e}"`,
        });

        if (application.clientRootDir) {
          // Add scripts to map to client package.json
          Object.assign(application.packageJsonScripts, {
            'e2e:headless': `npm run -w ${application.clientRootDir} e2e:headless`,
          });
        } else if (application.backendTypeJavaAny) {
          Object.assign(application.clientPackageJsonScripts, {
            'pree2e:headless': 'npm run ci:server:await',
          });
        }
      },
    });
  }

  get [BaseApplicationGenerator.PREPARING]() {
    return this.delegateTasksToBlueprint(() => this.preparing);
  }

  get postPreparingEachEntity() {
    return this.asPreparingEachEntityTaskGroup({
      prepareForTemplates({ entity }) {
        mutateData(entity, {
          workaroundEntityCannotBeEmpty: false,
          workaroundInstantReactiveMariaDB: false,
        });
      },
    });
  }

  get [BaseApplicationGenerator.POST_PREPARING_EACH_ENTITY]() {
    return this.delegateTasksToBlueprint(() => this.postPreparingEachEntity);
  }

  get writing() {
    return this.asWritingTaskGroup({
      async cleanup({ control, application: { authenticationTypeOauth2, generateUserManagement, playwrightDir } }) {
        if (control.isJhipsterVersionLessThan('7.0.0-beta.1')) {
          this.removeFile(`${playwrightDir}support/keycloak-oauth2.ts`);
          this.removeFile(`${playwrightDir}fixtures/users/user.json`);
        }
        if (control.isJhipsterVersionLessThan('7.8.2')) {
          // this.removeFile('cypress.json');
          // this.removeFile('cypress-audits.json');

          this.removeFile(`${playwrightDir}integration/administration/administration.spec.ts`);
          this.removeFile(`${playwrightDir}integration/lighthouse.audits.ts`);
          if (!authenticationTypeOauth2) {
            this.removeFile(`${playwrightDir}integration/account/login-page.spec.ts`);
          }
          if (generateUserManagement) {
            this.removeFile(`${playwrightDir}integration/account/register-page.spec.ts`);
            this.removeFile(`${playwrightDir}integration/account/settings-page.spec.ts`);
            this.removeFile(`${playwrightDir}integration/account/password-page.spec.ts`);
            this.removeFile(`${playwrightDir}integration/account/reset-password-page.spec.ts`);
          }
        }

        await control.cleanupFiles({ '8.6.1': [`${playwrightDir}.eslintrc.json`] });
      },
      async writeFiles({ application }) {
        const faker = await createFaker();
        faker.seed(stringHashCode(application.baseName));
        const context = { ...application, faker };
        return this.writeFiles({
          sections: playwrightFiles,
          context,
        });
      },
    });
  }

  get [BaseApplicationGenerator.WRITING]() {
    return this.delegateTasksToBlueprint(() => this.writing);
  }

  get writingEntities() {
    return this.asWritingEntitiesTaskGroup({
      cleanupPlaywrightEntityFiles({ application: { playwrightDir }, control, entities }) {
        for (const entity of entities) {
          if (control.isJhipsterVersionLessThan('7.8.2')) {
            this.removeFile(`${playwrightDir}integration/entity/${entity.entityFileName}.spec.ts`);
          }
        }
      },

      async writePlaywrightEntityFiles({ application, entities }) {
        for (const entity of entities.filter(
          entity => !entity.skipClient && !entity.embedded && !entity.builtInUser && !entity.entityClientModelOnly,
        )) {
          const context = { ...application, ...entity };
          await this.writeFiles({
            sections: playwrightEntityFiles,
            context,
          });
        }
      },
    });
  }

  get [BaseApplicationGenerator.WRITING_ENTITIES]() {
    return this.delegateTasksToBlueprint(() => this.writingEntities);
  }

  get postWriting() {
    return this.asPostWritingTaskGroup({
      packageJson({ application }) {
        const clientPackageJson = this.createStorage(this.destinationPath(application.clientRootDir!, 'package.json'));
        clientPackageJson.merge({
          devDependencies: {
            playwright: application.nodeDependencies.playwright,
            'eslint-plugin-playwright': application.nodeDependencies['eslint-plugin-playwright'],
            '@types/node': application.nodeDependencies['@types/node'],
            '@playwright/test': application.nodeDependencies['@playwright/test'],
            '@dotenvx/dotenvx': application.nodeDependencies['@dotenvx/dotenvx'],
          },
        });
      },

      mavenProfile({ source }) {
        (source as JavaSource).addMavenProfile?.({
          id: 'e2e',
          content: `
            <properties>
                <profile.e2e>,e2e</profile.e2e>
            </properties>
            <build>
                <finalName>e2e</finalName>
            </build>
          `,
        });
      },
    });
  }

  get [BaseApplicationGenerator.POST_WRITING]() {
    return this.delegateTasksToBlueprint(() => this.postWriting);
  }

  generateTestEntity(fields: PlaywrightField[]) {
    return generateTestEntity(fields);
  }
}
