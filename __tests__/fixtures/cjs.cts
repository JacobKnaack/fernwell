// A CommonJS consumer (node16/nodenext). `require` must resolve the .d.cts
// declarations; the ESM ones fail here with TS1479.
import { tokens, version, type TokenName, type TokenOverrides } from 'fernwell';
import 'fernwell/css';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const assert = <_T extends true>(): void => {};

assert<Equal<typeof version, string>>();
assert<Equal<ReturnType<typeof tokens.setTokens>, () => void>>();

const known: TokenName = 'primary';
const flat: TokenOverrides = { [known]: '#2266ff' };
tokens.setTokens(flat, { persist: true });

// @ts-expect-error — token values are CSS strings
tokens.setTokens({ primary: 42 });
