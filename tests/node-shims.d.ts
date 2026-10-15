// Minimal typings for the few Node built-ins the data tests read the repository with (the project ships no @types/node).
declare module 'node:fs' {
  export function readFileSync(path: string): Uint8Array;
  export function readFileSync(path: string, encoding: 'utf8'): string;
  export function statSync(path: string): { size: number };
}
declare module 'node:crypto' {
  export function createHash(algorithm: string): { update(data: Uint8Array | string): { digest(encoding: 'hex'): string } };
}
/** Node's Buffer, as far as the data tests read it (tests/grassR04.test.ts: base64 → bytes, the ID3 tag as ASCII). */
interface NodeBufferShim extends Uint8Array {
  subarray(start?: number, end?: number): NodeBufferShim;
  toString(encoding?: 'ascii' | 'utf8' | 'hex' | 'base64'): string;
}
declare const Buffer: { from(data: string, encoding: 'base64' | 'utf8'): NodeBufferShim };
