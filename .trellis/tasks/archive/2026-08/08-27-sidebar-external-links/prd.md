# 侧栏外链使用系统浏览器

## Goal

Open sidebar external links in the operating system's default browser and point GitHub to the current repository.

## Requirements

- The GitHub, official-site, and help-document links in the sidebar footer must use the Electron shell bridge when running in the desktop app.
- The GitHub link must target `https://github.com/Ryderey/WeMD`.
- Browser-only usage must continue to open the same links normally.

## Acceptance Criteria

- [x] Each sidebar external link calls `window.electron.shell.openExternal` in Electron.
- [x] The GitHub link uses the current repository URL.
- [x] A focused test verifies the Electron and browser behaviors.

## Notes

- This is a lightweight PRD-only task; reuse the existing preload IPC bridge instead of adding a new API.
