# Personal Windows branch

`personal/windows-bars` combines the author's `upstream/main` with the local
Windows and quota-bar changes. Publish and track this branch on the personal
fork (`origin`, `D-sudoasd/TokenTracker`); merge future author updates from
`upstream/main` into it.

## Included changes

- Sixteen bar finishes, configurable height and quota gradients.
- Appearance controls in Settings and Limits, with Windows persistence.
- Manual launches open the dashboard, including a second launch while running.
- Animated sheen on the desktop quota bars, with reduced-motion support.
- Existing fork fixes for Grok billing, proxy handling and limit pace.
- The author's current desktop quota window, lifecycle, localization and recovery
  improvements. These replace the older local quota implementation.

The initial integration contains author commit `daa6c550` (version 1.1.3).
The local snapshot before integration is retained as
`backup/personal-before-upstream-20260930`. The previous
`codex/progress-bar-styles` branch and other worktrees remain available.

## Updating this branch

With a clean working tree, run from the repository root:

```powershell
git switch personal/windows-bars
git fetch upstream
git merge upstream/main
# Resolve any conflicts while preserving the personal appearance features.
git push origin personal/windows-bars
```

Validate the appearance controls, quota display, dashboard build and Windows
build after merging. Do not replace this branch with the author's main branch.

## Personal application builds

This branch does not replace an already installed application. A Windows build
must include the rebuilt dashboard and `TokenTrackerWin/EmbeddedServer`, using
the existing bundling script before packaging.

When using a personal application build, turn off **Automatic updates** in its
settings: the official release installer contains the author's code and will
replace a custom executable. Update personal builds from this branch instead.

No npm publication or official release is required for a personal branch.
