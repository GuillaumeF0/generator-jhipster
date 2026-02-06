import type { Application as JavascriptApplication, Entity as JavascriptEntity } from '../client/types.ts';

export type { Field, Relationship } from '../client/types.ts';
// import type command from './command.ts';

// type Command = HandleCommandTypes<typeof command>;

// export type Config = JavascriptConfig & Command['Config'];

// export type Options = JavascriptOptions & Command['Options'];

export interface Entity extends JavascriptEntity {
  workaroundEntityCannotBeEmpty?: boolean;
  workaroundInstantReactiveMariaDB?: boolean;
}

export type Application<E extends Entity = Entity> = JavascriptApplication<E> & {
  // Command['Application'] & {
  playwrightDir: string;
  playwrightTemporaryDir: string;
  playwrightBootstrapEntities: boolean;
  playwrightCoverageWebpack: boolean;
};
