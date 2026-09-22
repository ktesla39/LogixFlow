# LogicFlow Roadmap

This roadmap follows the existing product instead of replacing it. Each phase must leave the current editor usable and must include type checking, build verification, focused tests, and a save/reload regression check.

## Phase 1: Durable Core

- Define a versioned design document envelope.
- Separate durable design data from runtime simulation and UI state.
- Add validated project migration at load boundaries.
- Introduce typed application commands for the highest-risk mutations.
- Preserve existing JSON import/export through an adapter.
- Add a real test runner and tests for serialization, migration, connectivity, and representative circuit evaluation.

## Phase 2: Schematic Foundations

- Promote nets, junctions, labels, ports, and no-connect markers to first-class model objects.
- Add deterministic connectivity analysis independent of visual proximity.
- Improve orthogonal routing, junction detection, net highlighting, and hierarchy navigation.
- Add component library metadata and user component storage.

## Phase 3: Verification and Simulation

- Extend digital simulation with unknown/high-impedance values and event scheduling.
- Add a worker boundary for simulation and large truth tables.
- Add ERC issues with severity, source object IDs, and navigation.
- Add testbench documents and regression execution.
- Expand waveform cross-probing and export.

## Phase 4: Interoperability

- Add deterministic Verilog/SystemVerilog export for a documented synthesizable subset.
- Add round-trip and golden-design tests.
- Evaluate KiCad/SPICE adapters only after format and license review.

## Phase 5: PCB

- Introduce a PCB model sharing stable component and net IDs with schematic data.
- Add footprints, pads, layers, board outline, placement, tracks, vias, zones, constraints, and DRC.
- Keep PCB synchronization explicit and non-destructive.

## Phase 6: Manufacturing and Collaboration

- Add validated Gerber, drill, BOM, and pick-and-place outputs.
- Add CAM inspection.
- Design optional self-hosted collaboration and revision APIs without making cloud services mandatory.

## Phase 7: AI Assistance

- Expose validated command tools only after the command layer and diagnostics are stable.
- Give AI structured, scoped context rather than arbitrary state access.
- Require simulation/ERC/DRC evidence before AI reports a design as working.
