# Technical Design

## Title Resolution

Use the existing Markdown parser token stream to locate the first `h1`, avoiding regex matches inside fenced code. Fall back to a sanitized basename and then `未命名文章`.

## Cover Renderer

- Build one detached 1080×1440 DOM node and capture it with the already-installed `modern-screenshot`.
- Template presets own fixed type family, text color and decoration; settings may override background and accent colors.
- Render title fragments rather than injecting HTML so highlights remain text-safe.
- Fit font size downward within preset bounds. If the node still overflows at minimum size, return an overflow result and do not capture.
- Await `document.fonts.ready` and explicit loads for both bundled font families.

## Assets

Bundle original open-source font files and their OFL texts under Web public assets. No runtime network font fetch is permitted.
