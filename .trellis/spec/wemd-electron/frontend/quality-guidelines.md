# Quality Guidelines

> Code quality standards for frontend development.

---

## Overview

<!--
Document your project's quality standards here.

Questions to answer:
- What patterns are forbidden?
- What linting rules do you enforce?
- What are your testing requirements?
- What code review standards apply?
-->

(To be filled by the team)

---

## Forbidden Patterns

<!-- Patterns that should never be used and why -->

(To be filled by the team)

---

## Required Patterns

<!-- Patterns that must always be used -->

### Embedded server packaging

Desktop release builds that promise an embedded Nest service must use the
repository build entry point that builds and deploys
`apps/electron/resources/server`. Calling an Electron-only `build:*` script
does not prepare that ignored resource directory. Verify the packaged output
contains `resources/server/dist/main.js` and its production dependencies.

---

## Testing Requirements

<!-- What level of testing is expected -->

(To be filled by the team)

---

## Code Review Checklist

<!-- What reviewers should check -->

(To be filled by the team)
