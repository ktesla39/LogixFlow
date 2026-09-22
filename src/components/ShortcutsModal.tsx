import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  MousePointer,
  Cable,
  Play,
  Layers,
  Keyboard,
  GitFork,
  Copy,
  Scissors,
  ClipboardPaste,
  BookOpen,
  Search,
  Check,
  Lightbulb,
  Tag,
} from 'lucide-react';

interface ShortcutsModalProps {
  theme?: 'dark' | 'light';
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'guide' | 'shortcuts' | 'logic';

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'Clipboard & Editing' | 'History & Project' | 'Simulation & Execution' | 'Canvas & View' | 'Search & Tools';
}

const ALL_SHORTCUTS: ShortcutItem[] = [
  // Clipboard & Editing
  { keys: ['Ctrl', 'C'], description: 'Copy selected components & connected wires', category: 'Clipboard & Editing' },
  { keys: ['Ctrl', 'V'], description: 'Paste copied components with offset', category: 'Clipboard & Editing' },
  { keys: ['Ctrl', 'X'], description: 'Cut selected components', category: 'Clipboard & Editing' },
  { keys: ['Ctrl', 'D'], description: 'Duplicate selected components', category: 'Clipboard & Editing' },
  { keys: ['Ctrl', 'A'], description: 'Select all components on current sheet', category: 'Clipboard & Editing' },
  { keys: ['Double Click Wire'], description: 'Name or rename wire net (e.g. CLK, DATA, SUM)', category: 'Clipboard & Editing' },
  { keys: ['Double Click Node'], description: 'Rename component variable or label', category: 'Clipboard & Editing' },
  { keys: ['Delete', 'Backspace'], description: 'Delete selected components or wire', category: 'Clipboard & Editing' },
  { keys: ['↑', '↓', '←', '→'], description: 'Nudge selected components by grid step', category: 'Clipboard & Editing' },
  { keys: ['Shift', 'Arrows'], description: 'Large nudge (40px step)', category: 'Clipboard & Editing' },

  // History & Project
  { keys: ['Ctrl', 'Z'], description: 'Undo last action', category: 'History & Project' },
  { keys: ['Ctrl', 'Y'], description: 'Redo last action (or Ctrl+Shift+Z)', category: 'History & Project' },
  { keys: ['Ctrl', 'S'], description: 'Export circuit project as JSON', category: 'History & Project' },
  { keys: ['Ctrl', 'Shift', 'S'], description: 'Export circuit as vector SVG', category: 'History & Project' },
  { keys: ['Alt', '← / →'], description: 'Switch to previous / next sheet', category: 'History & Project' },

  // Simulation & Execution
  { keys: ['Space'], description: 'Run / Pause continuous simulation', category: 'Simulation & Execution' },
  { keys: ['Enter'], description: 'Single-step clock pulse forward', category: 'Simulation & Execution' },

  // Canvas & View
  { keys: ['+', '-'], description: 'Zoom in / Zoom out', category: 'Canvas & View' },
  { keys: ['0'], description: 'Reset zoom & center canvas view', category: 'Canvas & View' },
  { keys: ['G'], description: 'Toggle canvas grid visibility', category: 'Canvas & View' },
  { keys: ['S'], description: 'Toggle snap to grid alignment', category: 'Canvas & View' },
  { keys: ['Escape'], description: 'Deselect all or close open dialogs', category: 'Canvas & View' },

  // Search & Tools
  { keys: ['/'], description: 'Focus component palette search bar', category: 'Search & Tools' },
  { keys: ['Ctrl', 'K'], description: 'Quick search palette components', category: 'Search & Tools' },
  { keys: ['?'], description: 'Open this user guide & shortcuts modal', category: 'Search & Tools' },
  { keys: ['H'], description: 'Toggle help guide', category: 'Search & Tools' },
];

const LOGIC_PRIMER = [
  {
    name: 'AND Gate',
    formula: 'Y = A · B',
    desc: 'Output is 1 ONLY if all inputs are 1. True conjunction.',
    table: [
      { a: '0', b: '0', y: '0' },
      { a: '0', b: '1', y: '0' },
      { a: '1', b: '0', y: '0' },
      { a: '1', b: '1', y: '1' },
    ],
  },
  {
    name: 'OR Gate',
    formula: 'Y = A + B',
    desc: 'Output is 1 if AT LEAST ONE input is 1. Disjunction.',
    table: [
      { a: '0', b: '0', y: '0' },
      { a: '0', b: '1', y: '1' },
      { a: '1', b: '0', y: '1' },
      { a: '1', b: '1', y: '1' },
    ],
  },
  {
    name: 'NOT Gate (Inverter)',
    formula: 'Y = Ā',
    desc: 'Inverts the signal. 1 becomes 0, and 0 becomes 1.',
    table: [
      { a: '0', b: '-', y: '1' },
      { a: '1', b: '-', y: '0' },
    ],
  },
  {
    name: 'NAND Gate',
    formula: 'Y = (A · B)̄',
    desc: 'Universal logic gate. Output is 0 ONLY when all inputs are 1.',
    table: [
      { a: '0', b: '0', y: '1' },
      { a: '0', b: '1', y: '1' },
      { a: '1', b: '0', y: '1' },
      { a: '1', b: '1', y: '0' },
    ],
  },
  {
    name: 'NOR Gate',
    formula: 'Y = (A + B)̄',
    desc: 'Universal logic gate. Output is 1 ONLY when all inputs are 0.',
    table: [
      { a: '0', b: '0', y: '1' },
      { a: '0', b: '1', y: '0' },
      { a: '1', b: '0', y: '0' },
      { a: '1', b: '1', y: '0' },
    ],
  },
  {
    name: 'XOR Gate',
    formula: 'Y = A ⊕ B',
    desc: 'Exclusive OR. Output is 1 when inputs differ (odd parity).',
    table: [
      { a: '0', b: '0', y: '0' },
      { a: '0', b: '1', y: '1' },
      { a: '1', b: '0', y: '1' },
      { a: '1', b: '1', y: '0' },
    ],
  },
  {
    name: 'XNOR Gate',
    formula: 'Y = (A ⊕ B)̄',
    desc: 'Equivalence gate. Output is 1 when both inputs match.',
    table: [
      { a: '0', b: '0', y: '1' },
      { a: '0', b: '1', y: '0' },
      { a: '1', b: '0', y: '0' },
      { a: '1', b: '1', y: '1' },
    ],
  },
  {
    name: 'D Flip-Flop',
    formula: 'Q(t+1) = D',
    desc: 'Stores 1 bit of memory upon the clock rising edge (0 → 1).',
    table: [
      { a: '0', b: '↑', y: '0' },
      { a: '1', b: '↑', y: '1' },
    ],
  },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ theme = 'light', isOpen, onClose }) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<TabType>('guide');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredShortcuts = ALL_SHORTCUTS.filter(
    (s) =>
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.keys.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(filteredShortcuts.map((s) => s.category)));

  return (
    <div className={`shortcuts-modal-${theme} fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150`}>
      <div className={`${isDark ? 'bg-slate-900 border-slate-700/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'} shrink-0`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-sky-950/80 text-sky-400 border border-sky-800/60' : 'bg-sky-100 text-sky-600 border border-sky-200'} shadow-xs`}>
              <HelpCircle size={18} />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'} flex items-center gap-2`}>
                <span>LogixFlow Guide & Shortcuts</span>
                <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full ${isDark ? 'bg-sky-950 text-sky-400 border border-sky-800/60' : 'bg-sky-100 text-sky-700 border border-sky-200'}`}>
                  v2.0
                </span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-0.5`}>
                Learn wiring, component interaction, flowchart algorithms & keyboard shortcuts
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-shortcuts-modal"
            onClick={onClose}
            className="btn btn-sm btn-icon btn-outline-secondary"
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex items-center gap-2 px-5 pt-3 pb-2 border-b ${isDark ? 'border-slate-800/80 bg-slate-950/30' : 'border-slate-200 bg-slate-100/60'} shrink-0`}>
          <div className="btn-group" role="group" aria-label="Modal tabs">
            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`btn btn-sm ${
                activeTab === 'guide'
                  ? 'btn-primary'
                  : 'btn-outline-secondary'
              }`}
            >
              <BookOpen size={14} />
              <span>How to Build</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('shortcuts')}
              className={`btn btn-sm ${
                activeTab === 'shortcuts'
                  ? 'btn-primary'
                  : 'btn-outline-secondary'
              }`}
            >
              <Keyboard size={14} />
              <span>Keyboard Shortcuts</span>
              <span className="badge bg-dark text-white text-[10px] font-mono ml-1">
                {ALL_SHORTCUTS.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logic')}
              className={`btn btn-sm ${
                activeTab === 'logic'
                  ? 'btn-primary'
                  : 'btn-outline-secondary'
              }`}
            >
              <img src="/logo.png" alt="" className="w-3.5 h-3.5 object-contain" />
              <span>Logic & Truth Tables</span>
            </button>
          </div>
        </div>

        {/* Tab 1: How to Build Guide */}
        {activeTab === 'guide' && (
          <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Card 1: Adding & Searching */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-sky-950/80 text-sky-400 border border-sky-800/60 shrink-0">
                    <Search size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100 text-xs">1. Add & Search Components</div>
                    <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
                      Click or drag gates, switches, and displays from the left palette. Press <kbd className="px-1 py-0.2 rounded bg-slate-800 text-sky-300 font-mono border border-slate-700 text-[10px]">/</kbd> anytime to instantly search all components.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Wiring Logic */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shrink-0">
                    <Cable size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100 text-xs">2. Connect Logic Wires</div>
                    <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
                      Drag from any output pin (right) to an input pin (left). Wires glow bright cyan/blue with animated flow pulses when HIGH (1), and stay neutral when LOW (0). Click any wire to inspect or delete it.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2b: Wire Net Labels */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-sky-950/80 text-sky-400 border border-sky-800/60 shrink-0">
                    <Tag size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100 text-xs">3. Name & Label Wires (Double-Click)</div>
                    <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
                      Double-click any wire on the canvas or click the wire selection tag to name it (e.g., <span className="text-sky-300 font-mono font-bold">CLK</span>, <span className="text-sky-300 font-mono font-bold">DATA</span>, <span className="text-sky-300 font-mono font-bold">SUM</span>). The name tag stays pinned above the wire with live signal status dots!
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Interactive Inputs & Clocks */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/60 shrink-0">
                    <Play size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100 text-xs">4. Interactive Inputs & Clocks</div>
                    <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
                      Click switches to flip 0/1. Push buttons send momentary pulses. Clocks generate automated square waves (click the gear icon to adjust Hz frequency from 0.5 Hz to 20 Hz).
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 4: Multi-Selection & Marquee */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 shrink-0">
                    <MousePointer size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100 text-xs">4. Multi-Select & Box Marquee</div>
                    <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
                      Drag on an empty canvas area to draw a marquee selection rectangle, or hold <kbd className="px-1 py-0.2 rounded bg-slate-800 text-slate-200 font-mono border border-slate-700 text-[10px]">Shift</kbd> while clicking components. Drag any selected item to move the group.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 5: Copy, Paste & Cut */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 shrink-0">
                    <Copy size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100 text-xs">5. Copy, Cut & Paste (Ctrl+C/V/X)</div>
                    <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
                      Select one or multiple components and press <kbd className="px-1 py-0.2 rounded bg-slate-800 text-sky-300 font-mono border border-slate-700 text-[10px]">Ctrl+C</kbd> to copy, <kbd className="px-1 py-0.2 rounded bg-slate-800 text-sky-300 font-mono border border-slate-700 text-[10px]">Ctrl+V</kbd> to paste, or <kbd className="px-1 py-0.2 rounded bg-slate-800 text-sky-300 font-mono border border-slate-700 text-[10px]">Ctrl+X</kbd> to cut. All internal connecting wires are copied seamlessly!
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 6: Sub-Circuits (Modular ICs) */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-950/80 text-purple-400 border border-purple-800/60 shrink-0">
                    <Layers size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100 text-xs">6. Custom Sub-Circuit ICs</div>
                    <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
                      Select 2 or more components and click &ldquo;Create Sub-Circuit IC&rdquo; in the bottom action bar. Encapsulate complex logic into a reusable modular chip with custom pins!
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 7: Flowchart Algorithm Mode */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 col-span-1 md:col-span-2 flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-teal-950/80 text-teal-400 border border-teal-800/60 shrink-0">
                    <GitFork size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100 text-xs">7. Flowchart Algorithm Execution Mode</div>
                    <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
                      Switch between digital logic gates and visual algorithm flowcharts. Build workflows with Start, Process, Decision Diamonds (IF-THEN-ELSE), Read Input, and Print Output blocks, complete with interactive step-by-step program execution and variable watches.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Keyboard Shortcuts Reference */}
        {activeTab === 'shortcuts' && (
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Search Filter for Shortcuts */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search shortcuts (e.g., copy, paste, zoom, undo)..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Categorized Shortcuts */}
            <div className="space-y-4">
              {categories.map((cat) => {
                const items = filteredShortcuts.filter((s) => s.category === cat);
                if (items.length === 0) return null;

                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider px-1">
                      {cat}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                        >
                          <span className="text-slate-300 text-[11px] truncate mr-2" title={item.description}>
                            {item.description}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {item.keys.map((k, kIdx) => (
                              <kbd
                                key={kIdx}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono border border-slate-700 text-sky-300 shadow-2xs"
                              >
                                {k}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredShortcuts.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No keyboard shortcuts match &ldquo;{searchQuery}&rdquo;.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Logic Gates Primer */}
        {activeTab === 'logic' && (
          <div className="p-5 overflow-y-auto space-y-3 flex-1">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-950/40 border border-sky-900/50 text-sky-300 text-xs">
              <Lightbulb size={16} className="shrink-0 text-amber-400" />
              <span>
                Standard Boolean logic gates reference. Connect switches and LEDs to test their operations live on the canvas!
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {LOGIC_PRIMER.map((gate) => (
                <div
                  key={gate.name}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100 text-xs">{gate.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60 font-semibold">
                        {gate.formula}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">{gate.desc}</p>
                  </div>

                  {/* Mini Truth Table */}
                  <div className="mt-2.5 border border-slate-800/80 rounded-lg overflow-hidden bg-slate-900/90 text-[10px] font-mono">
                    <div className="grid grid-cols-3 bg-slate-800/70 py-1 text-slate-400 text-center font-bold border-b border-slate-800">
                      <div>A</div>
                      <div>B</div>
                      <div>OUT</div>
                    </div>
                    {gate.table.map((row, rIdx) => (
                      <div
                        key={rIdx}
                        className={`grid grid-cols-3 py-0.5 text-center border-b last:border-b-0 border-slate-800/40 ${
                          row.y === '1' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        <div>{row.a}</div>
                        <div>{row.b}</div>
                        <div>{row.y}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/50 shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="hidden sm:inline">Pro tip:</span>
            <span>Press</span>
            <kbd className="px-1 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-sky-300 border border-slate-700">
              ?
            </kbd>
            <span>or</span>
            <kbd className="px-1 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-sky-300 border border-slate-700">
              H
            </kbd>
            <span>anytime to toggle this guide</span>
          </div>

          <button
            type="button"
            id="btn-got-it-shortcuts"
            onClick={onClose}
            className="btn btn-primary btn-sm px-4 flex items-center gap-1.5"
          >
            <Check size={13} />
            <span>Got it</span>
          </button>
        </div>
      </div>
    </div>
  );
};
