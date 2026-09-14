---
name: update-changelog
description: Update CHANGELOG.md's [Unreleased] section with the changes made since the last tagged release. Trigger on "update the changelog", "what's changed since the last release", "prepare the changelog for release", or before cutting a new npm release.
---

# Update the changelog

Populate the `## [Unreleased]` section of `CHANGELOG.md` with everything that has landed on `main` since the last release, in this project's existing style. This does **not** cut a release — it does not bump `package.json`'s version or rename `[Unreleased]` to a dated heading. That's a separate manual step described in [README.md § Releasing to npm](../../../README.md#releasing-to-npm).

## 1. Find the last release point

- Look for the most recent dated heading in `CHANGELOG.md`, e.g. `## [0.1.0] — 2026-09-14`.
- Cross-check against git tags: `git tag --list 'v*' --sort=-creatordate | head -1`.
- If a matching tag exists, diff from there: `git log <tag>..HEAD --oneline` and `git diff <tag>..HEAD --stat`.
- If no tag exists yet (e.g. only `0.1.0` was ever published manually, no `v0.1.0` tag), fall back to everything already listed under `## [Unreleased]` in the file plus any commits not yet reflected there — read the existing `[Unreleased]` content first so you extend it rather than duplicate it.

## 2. Gather the actual changes

- `git log <last-release>..HEAD --stat` and `git diff <last-release>..HEAD` for full detail — read enough of the diff to describe changes accurately, not just commit subject lines.
- Pay special attention to: `src/tokens/tokens.json` (token additions/renames/removals), `src/css/components/*` (new components, class changes), `src/js/*` (new exports, API changes, new `data-fw-*` hooks), `package.json` (dependency or export map changes), and anything breaking a documented public API (see `README.md` for what's currently documented as public surface).
- Skip noise: formatting-only diffs, CI/workflow-only changes, `.claude/` config, dev-only tooling changes, and commits already summarized in an existing `[Unreleased]` entry.

## 3. Categorize using this project's Keep a Changelog sections

Use only the sections that have content, in this order (matches existing entries in `CHANGELOG.md`):

1. `### Changed (breaking)` — renames, removals, or behavior changes to any token, class, data attribute, or JS export (per the Versioning policy in README.md, these force a minor bump pre-1.0, and will force a major bump once Fernwell reaches 1.0.0).
2. `### Added`
3. `### Changed`
4. `### Deprecated`
5. `### Removed`
6. `### Fixed`
7. `### Security`

## 4. Match the existing writing style

Look at the current `[Unreleased]` and `[0.1.0]` entries in `CHANGELOG.md` before writing new ones:

- Each bullet leads with a **bold phrase** naming the thing that changed, then a plain-sentence explanation of what and why.
- Name exact token/class/export names (e.g. `` `--fw-ink` → `--fw-text` ``), not vague descriptions like "renamed some tokens."
- For a breaking rename, show the mapping (old → new) as a nested list if there are several.
- Explain *why* when it's not obvious from the name alone (see how existing entries justify e.g. splitting `--fw-marigold-dk` into two roles).
- Keep entries user-facing: describe the effect for a consumer of the package, not internal implementation detail, unless the internal detail is what a consumer needs to know (e.g. a schema change to `tokens.json` that affects anyone authoring custom tokens).

## 5. Write the result

- Insert new bullets under the correct `###` subheading inside the existing `## [Unreleased]` section (create the section at the top of the file, right after the intro paragraph, if it doesn't exist yet).
- Merge with what's already there — don't duplicate an entry that already covers a change, and don't remove existing hand-written entries.
- Leave every dated `## [x.y.z] — YYYY-MM-DD` section untouched.

## 6. Hand back for review

Changelog entries encode judgment about what's user-facing and how to explain it — show the user the diff to `CHANGELOG.md` and call out anything you were unsure whether to include (e.g. an ambiguous internal refactor) rather than silently deciding either way.
