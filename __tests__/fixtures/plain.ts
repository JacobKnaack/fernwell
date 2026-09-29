// A consumer on moduleResolution `bundler` or `node10` (which ignores `exports`
// and needs `typesVersions` for the CSS subpaths).
import Fernwell, { tokens, type TokenName, type TokenOverrides } from 'fernwell';
import 'fernwell/css';
import 'fernwell/css/min';
import 'fernwell/tokens.css';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const assert = <_T extends true>(): void => {};

assert<Equal<typeof Fernwell.tokens, typeof tokens>>();
assert<Equal<ReturnType<typeof tokens.setTokens>, () => void>>();

const known: TokenName = 'primary';
const flat: TokenOverrides = { [known]: '#2266ff' };
tokens.setTokens(flat, { scope: '.tenant' });

// @ts-expect-error — token values are CSS strings
tokens.setTokens({ primary: 42 });
