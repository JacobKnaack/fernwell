// A native-ESM consumer (node16/nodenext). Every line is an assertion: the
// suite fails on any diagnostic, and `@ts-expect-error` fails if its line
// stops being an error.
import Fernwell, { theme, tokens, version, type SetTokensOptions, type TokenKey, type TokenName, type TokenOverrides, type TokenThemeOverrides } from 'fernwell';
import 'fernwell/css';
import 'fernwell/css/min';
import 'fernwell/tokens.css';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const assert = <_T extends true>(): void => {};

assert<Equal<typeof version, string>>();
assert<Equal<ReturnType<typeof tokens.setTokens>, () => void>>();
assert<Equal<typeof Fernwell.tokens, typeof tokens>>();
assert<Equal<typeof theme.setTokens, typeof tokens.setTokens>>();
assert<Equal<Parameters<typeof tokens.setTokens>[1], SetTokensOptions | undefined>>();

const known: TokenName = 'primary';
const flat: TokenOverrides = { primary: '#2266ff', '--brand-accent': 'hotpink' };
const split: TokenThemeOverrides = { light: { primary: '#000' }, dark: { primary: '#fff' } };
const undo = tokens.setTokens(flat, { persist: true, scope: '.tenant' });
tokens.setTokens(split);
undo();
tokens.resetTokens('.tenant');
tokens.restoreTokens();
const resolved: string = tokens.getToken(known);
const custom: TokenKey = '--brand-accent'; // TokenKey: a known name (autocompletes) or any custom property
void [resolved, tokens.getToken(custom), tokens.getToken('--fw-primary')];
assert<Equal<Parameters<typeof tokens.getToken>[0], TokenKey>>();

// @ts-expect-error — not a token name
const unknown: TokenName = 'not-a-token';
void unknown;
// @ts-expect-error — token values are CSS strings
tokens.setTokens({ primary: 42 });
// @ts-expect-error — persist is a boolean
tokens.setTokens({ primary: '#fff' }, { persist: 'yes' });
