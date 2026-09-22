# Dependency Policy and Inventory

## Policy

- Prefer browser-compatible open-source packages with permissive licenses.
- Do not add proprietary SaaS or cloud requirements to the core editor.
- Review license, bundle impact, browser support, maintenance, and security before adding a dependency.
- Record transitive license obligations before shipping a new external subsystem.

## Current Runtime Dependencies

- React and React DOM: UI runtime.
- Vite and the React/Tailwind Vite plugins: development server and production bundling.
- TypeScript: static type checking.
- Tailwind CSS: utility styling.
- Lucide React, Font Awesome, and Bootstrap-compatible local button styles: icons and UI primitives.
- `html-to-image`: PNG/SVG diagram export.
- `motion`: UI animation support.
- `@google/genai`: present in the dependency manifest; it is not part of the current core editor path and should not become a required runtime dependency for local editing.
- Express, dotenv, and Node type packages: present for possible tooling/server work; the current browser editor does not require a backend.

## Planned Evaluation Areas

Before adding geometry, PCB, HDL, SPICE, WebAssembly, or collaboration libraries, document the exact package, version, license, browser/runtime constraints, worker compatibility, bundle cost, and fallback behavior.
