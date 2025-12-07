// Reexport the native module. On web, it will be resolved to LibsignalDezireModule.web.ts
// and on native platforms to LibsignalDezireModule.ts
export { default } from './src/LibsignalDezireModule';

export * from './src/LibsignalDezire.types';
