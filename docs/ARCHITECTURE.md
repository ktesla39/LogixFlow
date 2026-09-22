# LogicFlow Architecture

## Current Baseline

LogicFlow is a browser-native Vite, React, and TypeScript application. The current product is a digital logic circuit editor with a separate flowchart mode, local simulation, truth tables, timing diagrams, JSON import/export, project persistence, and URL-based project/sheet routing.

### Runtime layers

- `src/App.tsx` is the application composition root and currently owns projects, active sheet selection, settings, selection state, simulation timers, flowchart execution state, persistence, keyboard commands, and undo/redo.
- `src/components/` contains the React editor, dashboard, palette, canvas, dialogs, and visual renderers.
- `src/types.ts` contains the current UI-oriented `Project`, `Sheet`, `CircuitNode`, `Pin`, `Wire`, and settings types.
- `src/utils/circuitSolver.ts` evaluates digital circuits and creates default nodes without depending on React.
- `src/utils/booleanAlgebra.ts` derives and formats circuit expressions.
- `src/utils/flowchartEngine.ts` evaluates flowchart expressions and advances flowchart execution without depending on React.
- `localStorage` is the only persistence layer. Projects are stored through the versioned design-document envelope in `src/core/designDocument.ts`; settings remain a separate JSON record.
- Vite serves the application as a single browser bundle. There is no backend requirement for the current feature set.

## Current Data Model

A project contains sheets. A sheet contains positioned nodes and wires. Nodes contain pins and UI/runtime state. Wires connect node pin IDs and carry the last evaluated boolean value and optional expression/label. The model is sufficient for the existing digital simulator, but it mixes durable design data with runtime values, layout state, and flowchart execution state.

## Current Command and History Behavior

There is no explicit command object system yet. Mutations call React state setters directly. Undo/redo stores complete `{ projects, activeProjectId }` snapshots in `App.tsx`. This works for the current scale, but it is not suitable for large designs, collaboration, deterministic history, or AI tool execution.

## Target Direction

The long-term architecture should separate:

```text
React UI
  -> application commands
  -> versioned design model
  -> simulation / ERC / DRC / import-export services
```

The first safe step is now partly implemented: typed persistence envelopes and legacy migration are in place while the existing `Project`/`Sheet` format remains compatible. The next core step is typed, UI-independent design primitives and command contracts.

## Boundaries To Protect

- Simulation and Boolean evaluation must remain usable without React.
- Imported project data must be validated before entering application state.
- Renderers should consume model data and should not decide connectivity or simulation truth.
- UI-only selection, pan, zoom, and open-dialog state must not become part of the canonical engineering model.
- New EDA features should be added behind adapters rather than requiring a wholesale editor rewrite.
