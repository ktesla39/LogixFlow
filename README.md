# LogixFlow ⚡
> Comprehensive Interactive Electronic Design Automation (EDA) Studio — Digital Logic Simulation, Analog Electric Circuits, and Algorithm Flowchart Visualizer.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub Repository](https://img.shields.io/badge/GitHub-ktesla39%2FLogixFlow-181717?logo=github)](https://github.com/ktesla39/LogixFlow)

LogixFlow is an intuitive, browser-native Electronic Design Automation (EDA) suite and visual computing workspace. It enables students, educators, hobbyists, and electrical engineers to design combinational/sequential logic circuits, simulate analog electric networks (RLC, diodes, transistors, op-amps, transformers), construct step-by-step algorithm flowcharts, and analyze dynamic waveforms and Boolean expressions in real time.

Official Repository: [https://github.com/ktesla39/LogixFlow](https://github.com/ktesla39/LogixFlow)

---

## ✨ Core Simulation Capabilities

### 1. ⚡ Digital Logic Simulation
- **Instant Propagation Solver**: Real-time signal evaluation supporting feedback loops, ring oscillators, flip-flop latches, and clock-driven circuits.
- **ANSI/IEEE Standard Gate Symbols**: Clean schematic representations for AND, OR, NOT, NAND, NOR, XOR, XNOR, Buffer, and Tri-State Buffer.
- **Configurable Input Counts**: Gates support 2 to 8 dynamically configured inputs with automatic vertical terminal distribution.
- **Sequential Logic**: D Flip-Flops, T Flip-Flops, JK Flip-Flops, and SR Flip-Flops with edge detection and complementary `Q` / `Q̄` outputs.
- **Combinational Blocks**: 1-bit Half Adders, Full Adders, 2:1 Multiplexers (MUX), and 1:2 Demultiplexers (DEMUX).
- **I/O Controls**: Toggle Switches, Momentary Push Buttons, Variable Frequency Clock Oscillators (0.5Hz to 8Hz), Fixed HIGH/LOW Constants, Colored LED Lamps, Logic Probes, 4-bit Hex/Dec 7-Segment Displays, and Audible Piezo Buzzers.

### 2. 🔌 Electric & Analog Circuit Networks
- **Passive Components**: Resistors (selectable resistance from 100Ω to 100kΩ), Potentiometers (interactive 0–100% wiper position slider), Capacitors (10µF), and Inductors (1mH).
- **Semiconductors**:
  - **PN Junction Diodes** (1N4007 forward conduction with 0.7V drop).
  - **Zener Diodes** (5.1V reverse breakdown regulation).
  - **BJT NPN & PNP Transistors** (Base current control and collector-emitter saturation switching).
- **Amplification & Coupling**:
  - **Operational Amplifiers (Op-Amps)**: Inverting ($V_-$) and non-inverting ($V_+$) comparator / saturation output ($V_{out}$).
  - **AC Transformers**: Primary and secondary coupled inductors with configurable turns ratio ($N_p : N_s$).
- **Protection & Routing**:
  - **Safety Fuses**: Overcurrent protection with configurable ratings (0.25A to 10A), blown visual state, and one-click reset/replacement.
  - **SPST Knife Switches & SPDT Selector Switches**: Single-pole double-throw routing between terminal paths A and B.
- **Virtual Bench Instruments**:
  - **Digital Voltmeter**: High-impedance voltage measurement probe with polarity display.
  - **Digital Ammeter**: In-line current flow monitoring (mA).
  - **Digital Ohmmeter**: Resistance measurement probe with open-circuit (O.L.) detection.
  - **Earth Ground (0V Reference)**.
- **Pre-Built Analog Presets**: Voltage Divider & Potentiometer, RC Low-Pass Filter, BJT Transistor Switch, Full-Wave Bridge Rectifier, and Zener Voltage Regulator.

### 3. 🌿 Algorithm Flowchart Studio
- **Flowchart Blocks**: Start / End Terminators, Process / Action Statements, Decision (Diamond IF/ELSE), Input (Read Variable), Output (Print Statement), Junction Connectors, and Subroutine Calls.
- **Step-by-Step Execution Engine**: Interactive debugger highlighting active execution paths, variable watch tables, and branch evaluation (YES / NO).
- **Built-in Algorithm Templates**: Factorial calculation, Fibonacci series generator, Linear Search, and Bubble Sort logic.

### 4. 🧮 Symbolic Boolean Algebra & Analysis
- **Automatic Equation Derivation**: Mathematically deduces symbolic Boolean expressions (e.g., `(A · B) + ¬C`) across pins, wires, and logic probes.
- **Automated Truth Table Generator**: Generates full $2^N$ input truth tables for any combinational circuit, highlighting minterm states and output mappings.
- **Waveform Timing Diagrams**: Multi-channel digital oscilloscope capturing transition edges and clock synchronizations over time.
- **Hierarchical Sub-Circuits**: Group selected components into reusable custom Integrated Circuit (IC) chips with configurable input and output pins.

---

## 📸 Screenshots

| Circuit Showcase | Home Dashboard | Multi-Sheet EDA Workspace |
|---|---|---|
| ![Circuit Showcase](public/scc_1.png) | ![Home Dashboard](public/scc_2.png) | ![Circuit Showcase](public/scc_3.png) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ktesla39/LogixFlow.git
   cd LogixFlow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch development server:
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:3000` to start building circuits.

---

## 🛠️ Project Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite development server at `http://localhost:3000` |
| `npm run build` | Compiles production assets into `dist/` |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs TypeScript compiler checks (`tsc --noEmit`) |
| `npm test` | Runs the automated test suite with `tsx --test` |
| `npm run clean` | Cleans up build artifacts |

---

## 🎮 Controls & Shortcuts

| Action | Control / Shortcut |
|---|---|
| **Add Component** | Drag from sidebar palette or click component card |
| **Quick Add Context Menu** | Right-click anywhere on empty canvas |
| **Connect Wire** | Click or drag from any terminal pin to a target pin (magnetic snapping) |
| **Cancel Wire Creation** | Press `Escape`, right-click, or click empty canvas |
| **Inspect / Edit Component** | Right-click component, double-click, or select and view Inspector |
| **Pan Canvas** | Click and drag canvas background or hold spacebar / middle mouse button |
| **Zoom In / Out** | Mouse wheel, trackpad pinch, or toolbar zoom controls |
| **Delete Selected** | `Delete` or `Backspace` key |
| **Toggle Switch** | Click directly on switch blade or use Inspector toggle |
| **Toggle SPDT Throw** | Click switch on canvas or select Route A/B in Inspector |
| **Replace Blown Fuse** | Click blown fuse on canvas or click "Replace Blown Fuse" in Inspector |
| **Adjust Potentiometer** | Select potentiometer and drag wiper slider in Inspector |
| **Press Button** | Click and hold momentary push button |
| **Step Clock / Simulation** | Click "Step" in top toolbar while paused |
| **Undo / Redo** | `Ctrl+Z` / `Ctrl+Y` (or `Cmd+Z` / `Cmd+Shift+Z`) |
| **Copy / Cut / Paste** | `Ctrl+C` / `Ctrl+X` / `Ctrl+V` |
| **Duplicate Selection** | `Ctrl+D` |
| **Select All** | `Ctrl+A` |
| **Export Circuit** | Export high-resolution SVG or `.json` project file |

---

## 📐 Architecture Overview

LogixFlow is structured with a modular, browser-native client architecture:
- **`src/utils/circuitSolver.ts`**: Standalone, framework-agnostic propagation and nodal simulation solver for digital gates, sequential latches, and electric/analog components.
- **`src/utils/booleanAlgebra.ts`**: Symbolic expression derivation, algebraic simplification, and truth table matrix computation.
- **`src/utils/flowchartEngine.ts`**: Flowchart node interpreter and variable execution runtime.
- **`src/core/designDocument.ts`**: Versioned design document envelope with schema validation and legacy migration support.
- **`src/components/Canvas.tsx`**: Interactive vector canvas supporting infinite pan/zoom, orthogonal and curved wire rendering, magnetic terminal snapping, and component inspection.
- **`src/components/GateSymbols.tsx`**: High-performance SVG schematic symbols supporting ANSI/IEEE digital gates, analog electronics, and flowchart geometry in light and dark themes.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

Developed with care by [ktesla39](https://github.com/ktesla39/LogixFlow). Contributions, issues, and feature requests are warmly welcomed!
