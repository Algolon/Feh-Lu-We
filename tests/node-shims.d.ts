// Minimal typings for the few Node built-ins the data tests read the repository with (the project ships no @types/node).
declare module 'node:fs' {
  export function readFileSync(path: string): Uint8Array;
  export function readFileSync(path: string, encoding: 'utf8'): string;
  export function statSync(path: string): { size: number };
}
declare module 'node:crypto' {
  export function createHash(algorithm: string): { update(data: Uint8Array | string): { digest(encoding: 'hex'): string } };
}
