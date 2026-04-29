> **AGENT DIRECTIVE (CRITICAL):** Before writing any code, you MUST read the `skills.md` manifest and load the required tools into your workspace. You must then execute the "One-Shot Evaluation Protocol" defined in Section 8 below.

# Skēnē: Ultra-Premium Design Constitution

## 1. Aesthetic Direction (The Spade/Tesla Standard)
- **Vibe:** "Cinematic Spatial Minimalism." The UI should feel like driving a luxury electric vehicle or using high-end fintech.
- **Execution:** Ruthless minimalism. Rely on massive negative space rather than borders to separate content. Use bento-box layouts for data dashboards.
- **Agent Directive:** You are a Staff-Level Design Engineer. REFUSE to write generic, flat, "tech-bro" UI. Every component must look expensive, intentional, and perfectly aligned.

## 2. Core Stack & Libraries
- React 18 + Vite + Tailwind CSS
- **Framer Motion** (MANDATORY for all interactive elements, page transitions, and scroll reveals)
- **Shadcn UI** (MANDATORY, but you must strip out the generic default styling and make it look custom)
- **Lucide React** (Icons must maintain consistent stroke-width, usually 1.5)

## 3. Typography (Spatial & Fluid)
- **Display/Headings:** `Geist`, `SF Pro Display`, or `Clash Display`. Extremely tight tracking (`tracking-tighter`), heavy weights for heroes, pure geometric precision.
- **Body:** `Geist`, `Inter`, or `DM Sans`. High legibility, generous line-height (`leading-relaxed`), loose tracking for all caps (`tracking-widest` for subheadings).
- **Sizing:** Use CSS `clamp()` for all typography so it scales fluidly from mobile to 4K desktop without media query breakpoints.

## 4. Color System (High-Contrast Dark/Light)
- **Backgrounds:** Deep, pure tones. In dark mode, use pure black (`#000000`) or deep zinc (`#09090B`). Do not use purple/blue muddy dark modes.
- **Surface/Cards:** Use extremely subtle elevated surfaces (`bg-white/5` in dark mode) with 1px borders (`border-white/10`).
- **Glassmorphism:** Use `backdrop-blur-xl` and `bg-white/10` heavily for sticky navbars, floating action buttons, and modal overlays.
- **Accent:** A single, high-voltage accent color (e.g., Electric Silver or Spotlight Amber). Use it sparingly to draw the eye only to the primary CTA.

## 5. Motion & Micro-Interactions (Framer Motion)
- **No static state changes.** Do not use raw CSS `:hover` for complex UI. Use `<motion.div>` for spring-based physics.
- **Hover States:** Buttons should have subtle scale down (`whileHover={{ scale: 0.98 }}`) and spring physics.
- **Page Load:** Elements must stagger in smoothly. Fade up from `y: 20` and `opacity: 0` using a custom spring transition (`type: "spring", stiffness: 100, damping: 20`).
- **Scroll Reveals:** Heavy use of `whileInView` for sections scrolling into the viewport.

## 6. Layout & Grid Strictness
- **Bento Grids:** Dashboard elements must use CSS Grid (`grid-cols-12`) to create interlocking, beautifully spaced bento-box layouts.
- **Padding:** Double your default padding instinct. If you think a card needs `p-4`, give it `p-8`.
- **Shadows:** Avoid heavy drop shadows. Use layered, diffused, colored glows under active elements, or stick to stark flat design.

## 7. Code Quality Gates
- Component names in PascalCase.
- NO inline styles. Tailwind utility classes only.
- Semantic HTML.
- Zero "Lorem Ipsum". Use hyper-realistic mock data if data is not provided.