# Technical Design

## Component Shape

One `RichPostDialog` owns the short-lived API Key, generated body and cover configuration. Reusable service modules own persistence, AI requests, title resolution, cover capture and ZIP creation.

The dialog uses the existing `Modal`, buttons, inputs, toasts and Lucide icon family. Desktop is a settings/results split view; mobile stacks sections. Motion is limited to existing transitions and loading feedback.

## Output

- Compose copy text from the immutable resolved title and editable body.
- Capture the current cover settings on demand.
- Reuse JSZip and existing download helpers to create a single archive.
- Electron uses the same browser ZIP download behavior for this feature; no new native directory flow is needed because the requested artifact is one ZIP.

## State Reset

When the active Markdown or file path changes, discard stale generated results and recompute the source title. Non-secret settings remain persisted; the Web Key remains only in the mounted dialog session.
