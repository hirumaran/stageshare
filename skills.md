# Skēnē: Agent Skills Manifest

When executing any frontend task in this repository, the agent MUST automatically load and cross-reference the following installed skills. Do not generate UI code without consulting these frameworks.

## 1. Primary Design Intelligence
- **`ui-ux-pro-max`**: Use as the core design engine for component patterns.
- **`frontend-design`**: Enforce the bold, high-end creative direction.

## 2. Quality & Performance Gates
- **`web-design-guidelines`**: Ensure perfect contrast, ARIA labels, and focus states.
- **`vercel-react-best-practices`**: Optimize React renders and component structure.

## 3. Granular Design Systems (from `.agents/skills`)
- **`layout-grid`**: Enforce strict interlocking Bento Grids. NO generic div soup.
- **`spacing-system`**: Enforce massive negative space (e.g., `p-8`, `p-10`).
- **`typography-scale`**: Enforce fluid typography using `clamp()`, tight tracking for headings (`tracking-tighter`), and muted subtext.
- **`dark-mode-design`**: Enforce spatial elevation using tonal shifts (`#080A0A` base to `#121212` surface). STRICTLY FORBID the use of 1px solid borders (`border-border`) to separate elements.
- **`micro-interaction-spec`**: Enforce Framer Motion spring physics for all interactions (staggered fade-ups on load, scale-down on hover).
- **`visual-hierarchy`**: Ensure the primary CTA is the only highly saturated element on the screen.