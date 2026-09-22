# Known Issues

## Architecture

- `App.tsx` remains the central state and mutation owner. This is manageable at the current scale but is the primary barrier to scalable commands, workers, collaboration, and AI tooling.
- The current `CircuitNode` and `Wire` types mix durable design values with evaluated signal values, flowchart execution state, and layout information.
- Undo/redo snapshots complete project arrays instead of storing typed reversible commands.
- Persistence is still localStorage-only. A schema envelope and legacy-array migration now exist, but there is not yet a multi-version migration registry.

## Verification

- The repository now has a Node test runner through `tsx` with focused design-document migration tests; broad subsystem coverage is still missing.
- Truth-table generation and simulation run on the main thread.
- ERC/DRC, netlist analysis, buses, hierarchical ports, and manufacturing outputs are not implemented.

## Product

- The current editor supports digital circuits and flowcharts, not general schematic/PCB EDA.
- External HDL, KiCad, SPICE, Gerber, STEP, and collaboration formats are not yet supported.
- Vite reports a bundle-size advisory during production builds; code splitting should be addressed after a stable feature boundary exists.

## Operational Rule

These are explicit limitations, not promised features. New UI controls must not claim functionality until the corresponding model, service, validation, and tests exist.
