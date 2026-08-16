# Quality Guidelines

> Code quality standards for backend development.

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

(To be filled by the team)

### Runtime dependency ownership

Every package imported directly by production server code must be listed in
`apps/server/package.json` under `dependencies`, even when a framework also
installs it transitively. pnpm does not expose transitive packages as direct
imports.

```ts
// apps/server/src/upload/upload.controller.ts
import { memoryStorage } from "multer";
```

```json
{
  "dependencies": {
    "multer": "2.0.2"
  }
}
```

Verify new direct runtime imports with:

```bash
pnpm --filter @wemd/server exec node -e "require('multer')"
```

---

## Testing Requirements

<!-- What level of testing is expected -->

(To be filled by the team)

---

## Code Review Checklist

<!-- What reviewers should check -->

(To be filled by the team)
