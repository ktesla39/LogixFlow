import React, { useState, useEffect, useRef } from 'react';
import { NodeType, CircuitMode } from '../types';
import { PaletteGateSymbol } from './GateSymbols';
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  Search,
  X,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  Cpu,
  Zap,
  GitBranch,
} from 'lucide-react';

interface ComponentPaletteProps {
  onAddComponent: (type: NodeType) => void;
  isMobileDrawerOpen: boolean;
  onToggleMobileDrawer: () => void;
  theme?: 'dark' | 'light';
  circuitMode?: CircuitMode;
  onCircuitModeChange?: (mode: CircuitMode) => void;
  onLoadFlowchartPreset?: (presetId: string) => void;
  onLoadElectricPreset?: (presetId: string) => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
}

interface PaletteItem {
  type: NodeType;
  name: string;
  tags?: string[];
  description?: string;
}

const FLOWCHART_BLOCKS: PaletteItem[] = [
  { type: 'FLOW_START', name: 'Start', tags: ['begin', 'entry', 'terminal', 'oval', 'start'] },
  { type: 'FLOW_END', name: 'Stop / End', tags: ['stop', 'halt', 'exit', 'finish', 'terminal', 'oval', 'end'] },
  { type: 'FLOW_PROCESS', name: 'Action Process', tags: ['process', 'action', 'assign', 'calculation', 'rect', 'expression', 'math', 'statement'] },
  { type: 'FLOW_DECISION', name: 'Decision (IF)', tags: ['decision', 'if', 'condition', 'branch', 'diamond', 'comparison', 'test', 'boolean'] },
  { type: 'FLOW_INPUT', name: 'Input (Read)', tags: ['input', 'read', 'prompt', 'ask', 'parallelogram', 'scan', 'cin', 'get'] },
  { type: 'FLOW_OUTPUT', name: 'Output (Print)', tags: ['output', 'print', 'display', 'write', 'parallelogram', 'cout', 'log', 'console', 'show'] },
  { type: 'FLOW_CONNECTOR', name: 'Junction', tags: ['connector', 'junction', 'node', 'merge', 'circle', 'join'] },
  { type: 'FLOW_SUBROUTINE', name: 'Subroutine', tags: ['subroutine', 'function', 'procedure', 'call', 'method', 'routine'] },
];

const INPUT_CONTROLS: PaletteItem[] = [
  { type: 'SWITCH', name: 'Toggle Switch', tags: ['switch', 'toggle', 'input', 'binary', '0', '1', 'state', 'lever'] },
  { type: 'BUTTON', name: 'Push Button', tags: ['button', 'push', 'pulse', 'momentary', 'input', 'trigger', 'press'] },
  { type: 'CLOCK', name: 'Clock', tags: ['clock', 'oscillator', 'pulse', 'timer', 'frequency', 'hertz', 'hz', 'generator', 'clk'] },
  { type: 'HIGH_CONST', name: 'High Constant', tags: ['high', '1', 'vcc', 'true', 'constant', 'power', 'on', 'source'] },
  { type: 'LOW_CONST', name: 'Low Constant', tags: ['low', '0', 'gnd', 'ground', 'false', 'constant', 'off', 'zero'] },
];

const OUTPUT_CONTROLS: PaletteItem[] = [
  { type: 'LED', name: 'Light Bulb', tags: ['led', 'light', 'lamp', 'bulb', 'output', 'diode', 'indicator'] },
  { type: 'SEVEN_SEG', name: '4-Bit Digit', tags: ['7-segment', 'seven segment', 'display', 'digit', 'hex', 'bcd', 'output', 'number', 'counter'] },
  { type: 'PROBE', name: 'Probe', tags: ['probe', 'voltmeter', 'tester', 'measure', 'signal', 'state', 'monitor', 'test'] },
  { type: 'BUZZER', name: 'Buzzer', tags: ['buzzer', 'audio', 'sound', 'beep', 'speaker', 'alarm', 'tone'] },
];

const LOGIC_GATES: PaletteItem[] = [
  { type: 'BUFFER', name: 'Buffer', tags: ['buffer', 'delay', 'driver', 'repeater', 'pass'] },
  { type: 'NOT', name: 'NOT Gate', tags: ['not', 'inverter', 'inverse', 'negation', 'invert', 'complement'] },
  { type: 'AND', name: 'AND Gate', tags: ['and', 'gate', 'conjunction', 'product', 'logic'] },
  { type: 'NAND', name: 'NAND Gate', tags: ['nand', 'universal', 'not and', 'gate'] },
  { type: 'OR', name: 'OR Gate', tags: ['or', 'gate', 'disjunction', 'sum', 'logic'] },
  { type: 'NOR', name: 'NOR Gate', tags: ['nor', 'universal', 'not or', 'gate'] },
  { type: 'XOR', name: 'XOR Gate', tags: ['xor', 'exclusive or', 'parity', 'inequality', 'modulo', 'gate'] },
  { type: 'XNOR', name: 'XNOR Gate', tags: ['xnor', 'equality', 'equivalence', 'coincidence', 'exclusive nor', 'gate'] },
  { type: 'TRI_STATE', name: 'Tri-State', tags: ['tri-state', 'tristate', 'high-z', 'bus', 'enable', 'buffer'] },
];

const FLIP_FLOPS: PaletteItem[] = [
  { type: 'D_FLIP_FLOP', name: 'D Flip-Flop', tags: ['d', 'dff', 'data', 'flip flop', 'latch', 'memory', 'register', 'sequential'] },
  { type: 'T_FLIP_FLOP', name: 'T Flip-Flop', tags: ['t', 'tff', 'toggle', 'flip flop', 'counter', 'divide', 'sequential'] },
  { type: 'JK_FLIP_FLOP', name: 'JK Flip-Flop', tags: ['jk', 'jkff', 'flip flop', 'universal', 'sequential'] },
  { type: 'SR_FLIP_FLOP', name: 'SR Flip-Flop', tags: ['sr', 'srff', 'set', 'reset', 'latch', 'flip flop', 'bistable'] },
];

const COMBINATIONAL_BLOCKS: PaletteItem[] = [
  { type: 'HALF_ADDER', name: 'Half Adder', tags: ['half adder', 'ha', 'add', 'adder', 'sum', 'carry', 'arithmetic'] },
  { type: 'FULL_ADDER', name: 'Full Adder', tags: ['full adder', 'fa', 'add', 'adder', 'sum', 'carry', 'arithmetic', 'cin', 'cout'] },
  { type: 'MUX_2TO1', name: '2:1 MUX', tags: ['mux', 'multiplexer', 'selector', 'routing', 'data selector', 'switch'] },
  { type: 'DEMUX_1TO2', name: '1:2 DEMUX', tags: ['demux', 'demultiplexer', 'decoder', 'routing', 'distributor'] },
];

const PASSIVE_COMPONENTS: PaletteItem[] = [
  { type: 'ELEC_RESISTOR', name: 'Resistor (1kΩ)', tags: ['resistor', 'ohm', 'r', 'passive', 'load', 'divider'] },
  { type: 'ELEC_POTENTIOMETER', name: 'Potentiometer', tags: ['potentiometer', 'pot', 'rheostat', 'variable', 'trimmer'] },
  { type: 'ELEC_CAPACITOR', name: 'Capacitor (10µF)', tags: ['capacitor', 'cap', 'farad', 'filter', 'charge', 'rc'] },
  { type: 'ELEC_INDUCTOR', name: 'Inductor (1mH)', tags: ['inductor', 'coil', 'choke', 'henry', 'filter', 'rlc'] },
  { type: 'ELEC_TRANSFORMER', name: 'AC Transformer', tags: ['transformer', 'ac', 'coupling', 'step-up', 'step-down', 'turns', 'primary', 'secondary'] },
  { type: 'ELEC_FUSE', name: 'Safety Fuse', tags: ['fuse', 'safety', 'blown', 'overcurrent', 'protection', 'breaker'] },
];

const SEMICONDUCTORS: PaletteItem[] = [
  { type: 'ELEC_DIODE', name: 'PN Diode (1N4007)', tags: ['diode', 'rectifier', '1n4007', 'p-n', 'silicon', 'clamp'] },
  { type: 'ELEC_ZENER', name: 'Zener Diode (5.1V)', tags: ['zener', 'breakdown', 'regulator', 'reference', 'reverse'] },
  { type: 'ELEC_LED', name: 'LED Indicator', tags: ['led', 'light emitting diode', 'indicator', 'photon', 'lamp'] },
  { type: 'ELEC_OPAMP', name: 'Op-Amp Amplifier', tags: ['opamp', 'operational amplifier', 'comparator', 'inverting', 'non-inverting', 'gain', '741'] },
  { type: 'ELEC_NPN', name: 'NPN Transistor (BJT)', tags: ['npn', 'bjt', 'transistor', 'amplifier', 'switch', '2n3904'] },
  { type: 'ELEC_PNP', name: 'PNP Transistor (BJT)', tags: ['pnp', 'bjt', 'transistor', 'amplifier', 'switch', '2n3906'] },
];

const SOURCES_METERS: PaletteItem[] = [
  { type: 'ELEC_BATTERY', name: 'DC Battery (+9V)', tags: ['battery', 'dc', 'vcc', 'cell', 'voltage', 'power', 'source'] },
  { type: 'ELEC_GROUND', name: 'Earth Ground (0V)', tags: ['ground', 'gnd', 'earth', 'reference', '0v', 'common'] },
  { type: 'ELEC_AC_SOURCE', name: 'AC Source (60Hz)', tags: ['ac', 'alternating', 'sine', 'wave', 'generator', 'oscillator'] },
  { type: 'ELEC_SWITCH', name: 'SPST Knife Switch', tags: ['switch', 'knife', 'spst', 'toggle', 'contact', 'disconnect'] },
  { type: 'ELEC_SPDT_SWITCH', name: 'SPDT Selector Switch', tags: ['spdt', 'switch', 'selector', '3-way', 'throw', 'toggle'] },
  { type: 'ELEC_VOLTMETER', name: 'Digital Voltmeter', tags: ['voltmeter', 'volt', 'meter', 'measure', 'multimeter', 'voltage'] },
  { type: 'ELEC_AMMETER', name: 'Digital Ammeter', tags: ['ammeter', 'amp', 'current', 'meter', 'milliamp', 'series'] },
  { type: 'ELEC_OHMMETER', name: 'Digital Ohmmeter', tags: ['ohmmeter', 'ohm', 'resistance', 'meter', 'multimeter', 'tester'] },
];

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  onAddComponent,
  isMobileDrawerOpen,
  onToggleMobileDrawer,
  theme = 'light',
  circuitMode = 'logic',
  onCircuitModeChange,
  onLoadFlowchartPreset,
  onLoadElectricPreset,
  isOpen = true,
  onToggleOpen,
}) => {
  const isDark = theme === 'dark';

  const [flowchartOpen, setFlowchartOpen] = useState(circuitMode === 'flowchart');
  const [inputsOpen, setInputsOpen] = useState(true);
  const [outputsOpen, setOutputsOpen] = useState(true);
  const [gatesOpen, setGatesOpen] = useState(true);
  const [flipFlopsOpen, setFlipFlopsOpen] = useState(true);
  const [combOpen, setCombOpen] = useState(true);
  const [passivesOpen, setPassivesOpen] = useState(true);
  const [semiconductorsOpen, setSemiconductorsOpen] = useState(true);
  const [sourcesOpen, setSourcesOpen] = useState(true);
  const [electricLogicOpen, setElectricLogicOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFlowchartOpen(circuitMode === 'flowchart');
    setSearchQuery('');
  }, [circuitMode]);

  // Global shortcut: press '/' or 'Ctrl+K' / 'Cmd+K' to quickly focus the component search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (!isTyping) {
        if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
          e.preventDefault();
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDragStart = (e: React.DragEvent, type: NodeType) => {
    e.dataTransfer.setData('application/logicflow-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const isSearching = searchQuery.trim().length > 0;

  const filterItems = (items: PaletteItem[]) => {
    if (!isSearching) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(q)))
    );
  };

  // Total components across the app
  const totalAllItems =
    circuitMode === 'flowchart'
      ? FLOWCHART_BLOCKS
      : circuitMode === 'electric'
      ? [...PASSIVE_COMPONENTS, ...SEMICONDUCTORS, ...SOURCES_METERS]
      : [
          ...LOGIC_GATES,
          ...COMBINATIONAL_BLOCKS,
          ...INPUT_CONTROLS,
          ...OUTPUT_CONTROLS,
          ...FLIP_FLOPS,
          ...PASSIVE_COMPONENTS,
          ...SEMICONDUCTORS,
          ...SOURCES_METERS,
        ];
  const totalAllMatchesCount = filterItems(totalAllItems).length;

  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0));

  const renderSectionHeader = (
    title: string,
    isOpen: boolean,
    toggle: () => void,
    filteredCount: number,
    totalCount: number
  ) => (
    <button
      type="button"
      onClick={toggle}
      className={`w-full flex items-center justify-between px-3 py-2 select-none transition-colors border-b ${
        isDark
          ? 'bg-slate-800/90 hover:bg-slate-750 text-slate-200 border-slate-700/60'
          : 'bg-slate-200/95 hover:bg-slate-300/80 text-slate-800 border-slate-300'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`text-xs font-semibold tracking-wide ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          }`}
        >
          {title}
        </span>
        <span
          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
            isSearching
              ? isDark
                ? 'text-sky-300 bg-sky-950/80 border-sky-800/60 font-bold'
                : 'text-sky-700 bg-sky-100 border-sky-300 font-bold'
              : isDark
              ? 'text-slate-400 bg-slate-900/80 border-slate-700/50'
              : 'text-slate-600 bg-slate-100 border-slate-300'
          }`}
        >
          {isSearching ? `${filteredCount}` : totalCount}
        </span>
      </div>
      <div className="w-4 h-4 rounded bg-[#0284c7] flex items-center justify-center text-white text-[10px] shadow-xs">
        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </div>
    </button>
  );

  const renderGrid = (filtered: PaletteItem[]) => {
    if (filtered.length === 0) return null;

    return (
      <div
        className={`grid grid-cols-2 gap-1.5 p-2 transition-colors ${
          isDark ? 'bg-slate-900/90' : 'bg-slate-100'
        }`}
      >
        {filtered.map((item) => (
          <button
            key={item.type}
            type="button"
            draggable={!isTouchDevice}
            onDragStart={(e) => handleDragStart(e, item.type)}
            onClick={(e) => {
              e.preventDefault();
              onAddComponent(item.type);
              if (isMobileDrawerOpen) onToggleMobileDrawer();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onAddComponent(item.type);
              if (isMobileDrawerOpen) onToggleMobileDrawer();
            }}
            className={`flex flex-col items-center justify-center p-2 rounded border shadow-xs hover:shadow transition-all cursor-pointer active:scale-95 group select-none min-h-[72px] touch-manipulation ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/70 hover:border-sky-500 text-slate-200 active:bg-sky-900/40'
                : 'bg-white hover:bg-sky-50 border-slate-200 hover:border-sky-500 text-slate-700 active:bg-sky-100'
            }`}
            title={`Tap or drag to add ${item.name}`}
          >
            <div className="w-full flex items-center justify-center py-0.5 group-hover:scale-105 transition-transform pointer-events-none">
              <PaletteGateSymbol type={item.type} theme={theme} />
            </div>
            <span
              className={`text-[10px] font-medium text-center leading-tight mt-1 truncate max-w-full transition-colors pointer-events-none ${
                isDark
                  ? 'text-slate-300 group-hover:text-sky-400'
                  : 'text-slate-700 group-hover:text-sky-600'
              }`}
            >
              {item.name}
            </span>
          </button>
        ))}
      </div>
    );
  };

  const renderSection = (
    title: string,
    items: PaletteItem[],
    isOpen: boolean,
    toggle: () => void
  ) => {
    const filtered = filterItems(items);

    // If searching, hide empty sections to keep the palette focused on matching results
    if (isSearching && filtered.length === 0) {
      return null;
    }

    // Auto-expand during search so the user immediately sees matching elements
    const shouldShow = isSearching ? true : isOpen;

    return (
      <div key={title} className="border-b last:border-b-0 border-slate-200 dark:border-slate-800/60">
        {renderSectionHeader(title, shouldShow, toggle, filtered.length, items.length)}
        {shouldShow && renderGrid(filtered)}
      </div>
    );
  };

  const paletteContent = (
    <div
      className={`flex flex-col h-full select-none transition-colors border-r ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-300/80'
      }`}
    >
      {/* Palette Top Header Bar */}
      <div
        className={`px-3 py-2 flex items-center justify-between border-b shrink-0 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-200/90 border-slate-300'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-slate-400">
            {circuitMode === 'flowchart' ? 'Algorithm' : circuitMode === 'electric' ? 'Electric' : 'Components'}
          </span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-sky-500/15 text-sky-400 border border-sky-500/30">
            {totalAllItems.length}
          </span>
        </div>
        {onToggleOpen && (
          <button
            type="button"
            onClick={onToggleOpen}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={14} />
          </button>
        )}
      </div>

      {/* Circuit Mode Selector Tabs */}
      {onCircuitModeChange && (
        <div className="px-2 pt-2 pb-1 shrink-0">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/60 dark:bg-slate-950 rounded-lg border border-slate-800/80">
            <button
              type="button"
              id="palette-tab-logic"
              onClick={() => onCircuitModeChange('logic')}
              className={`py-1 px-1.5 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-all ${
                circuitMode === 'logic'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Digital Logic Gates & Flip-Flops"
            >
              <Cpu size={11} />
              <span>Logic</span>
            </button>
            <button
              type="button"
              id="palette-tab-electric"
              onClick={() => onCircuitModeChange('electric')}
              className={`py-1 px-1.5 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-all ${
                circuitMode === 'electric'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Electric Circuit: Diodes, Transistors, RLC"
            >
              <Zap size={11} />
              <span>Electric</span>
            </button>
            <button
              type="button"
              id="palette-tab-flowchart"
              onClick={() => onCircuitModeChange('flowchart')}
              className={`py-1 px-1.5 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-all ${
                circuitMode === 'flowchart'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Algorithm Flowcharts"
            >
              <GitBranch size={11} />
              <span>Flow</span>
            </button>
          </div>
        </div>
      )}

      {/* Component Search Bar */}
      <div
        className={`p-2 border-b transition-colors ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-200/80 border-slate-300'
        }`}
      >
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
            isDark
              ? 'bg-slate-900 border-slate-700/80 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/50 text-white'
              : 'bg-white border-slate-300 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/40 text-slate-900 shadow-2xs'
          }`}
        >
          <Search size={13} className="text-slate-400 shrink-0" />
          <input
            ref={searchInputRef}
            id="component-palette-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchQuery('');
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="Search gates, IO, blocks..."
            aria-label="Search components by name or keyword"
            className="w-full bg-transparent text-xs focus:outline-none placeholder-slate-400 min-w-0"
          />
          {isSearching ? (
            <button
              type="button"
              id="btn-clear-component-search"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
              title="Clear search (Esc)"
            >
              <X size={13} />
            </button>
          ) : (
            <kbd
              className={`hidden sm:inline-block text-[9px] font-mono px-1 py-0.2 rounded border select-none shrink-0 ${
                isDark
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : 'bg-slate-100 text-slate-500 border-slate-300'
              }`}
              title="Press / to search"
            >
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Palette Items Scroll View */}
      <div className="flex-1 overflow-y-auto">
        {isSearching && totalAllMatchesCount === 0 ? (
          <div className="p-4 text-center flex flex-col items-center justify-center gap-2">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-500'
              }`}
            >
              <Search size={16} />
            </div>
            <div className="text-xs font-semibold text-slate-300 dark:text-slate-300">
              No matching components
            </div>
            <div className="text-[11px] text-slate-400 leading-normal max-w-45">
              No components match &ldquo;{searchQuery}&rdquo;.
            </div>
            <button
              type="button"
              id="btn-clear-search-empty-state"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="btn btn-outline-primary btn-sm mt-2"
            >
              <RotateCcw size={12} />
              <span>Clear search</span>
            </button>
          </div>
        ) : (
          <div>
            {circuitMode === 'flowchart' ? (
              <>
                {renderSection(
                  'Algorithm Blocks',
                  FLOWCHART_BLOCKS,
                  flowchartOpen,
                  () => setFlowchartOpen(!flowchartOpen)
                )}

                {onLoadFlowchartPreset && (!isSearching || 'preset study algorithm sum loop even odd factorial max'.includes(searchQuery.toLowerCase())) && (
                  <div className="p-3 border-t border-slate-700/50 mt-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 mb-2">
                      <BookOpen size={13} />
                      <span>Study Algorithm Presets</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {[
                        ['flowchart_sheet_sum', 'Sum 1 to N Loop', 'Accumulator pattern'],
                        ['flowchart_sheet_even_odd', 'Even / Odd Checker', 'Decision condition'],
                        ['flowchart_sheet_factorial', 'Factorial (N!)', 'Multiplication loop'],
                        ['flowchart_sheet_max', 'Find Maximum (A or B)', 'Branch comparison'],
                      ].map(([id, title, description]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => onLoadFlowchartPreset(id)}
                          className="btn btn-outline-secondary btn-sm w-full text-left py-2 px-2.5 flex flex-col items-start gap-0.5"
                        >
                          <div className="font-semibold text-xs">{title}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : circuitMode === 'electric' ? (
              <>
                {/* Passive Components: Resistor, Cap, Inductor, Pot */}
                {renderSection('Passive Components', PASSIVE_COMPONENTS, passivesOpen, () => setPassivesOpen(!passivesOpen))}

                {/* Semiconductors: Diode, Zener, LED, BJT Transistors */}
                {renderSection('Semiconductors', SEMICONDUCTORS, semiconductorsOpen, () => setSemiconductorsOpen(!semiconductorsOpen))}

                {/* Sources & Meters: DC Battery, Ground, AC Source, Switch, Meters */}
                {renderSection('Sources & Meters', SOURCES_METERS, sourcesOpen, () => setSourcesOpen(!sourcesOpen))}

                {onLoadElectricPreset && (!isSearching || 'preset electric divider rc filter bjt bridge zener'.includes(searchQuery.toLowerCase())) && (
                  <div className={`p-3 border-t mt-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 mb-2">
                      <Zap size={13} />
                      <span>Electric Circuit Presets</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {[
                        ['electric_sheet_divider', 'Voltage Divider & Pot', '9V to 6V Ohm divider'],
                        ['electric_sheet_rc', 'RC Low-Pass Filter', 'AC timing & filter'],
                        ['electric_sheet_bjt', 'BJT NPN Switch & LED', 'Transistor saturation'],
                        ['electric_sheet_bridge', 'Bridge Rectifier', 'Full-wave AC to DC'],
                        ['electric_sheet_zener', 'Zener Regulator (5.1V)', 'Reverse breakdown regulation'],
                      ].map(([id, title, description]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => onLoadElectricPreset(id)}
                          className="btn btn-outline-secondary btn-sm w-full text-left py-2 px-2.5 flex flex-col items-start gap-0.5"
                        >
                          <div className={`font-semibold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{title}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Logic Gates */}
                {renderSection('Logic Gates', LOGIC_GATES, gatesOpen, () => setGatesOpen(!gatesOpen))}

                {/* Adders & MUX */}
                {renderSection('Adders & MUX', COMBINATIONAL_BLOCKS, combOpen, () => setCombOpen(!combOpen))}

                {/* Input Controls */}
                {renderSection('Input Controls', INPUT_CONTROLS, inputsOpen, () => setInputsOpen(!inputsOpen))}

                {/* Output Controls */}
                {renderSection('Output Controls', OUTPUT_CONTROLS, outputsOpen, () => setOutputsOpen(!outputsOpen))}

                {/* Flip-Flops & Latches */}
                {renderSection('Flip-Flops & Latches', FLIP_FLOPS, flipFlopsOpen, () => setFlipFlopsOpen(!flipFlopsOpen))}

                {/* Analog & Electric Integration inside Logic */}
                {renderSection(
                  'Electric & Analog',
                  [...PASSIVE_COMPONENTS, ...SEMICONDUCTORS, ...SOURCES_METERS],
                  electricLogicOpen,
                  () => setElectricLogicOpen(!electricLogicOpen)
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Palette */}
      {isOpen !== false && (
        <aside id="component-palette" className="hidden md:flex flex-col w-56 shrink-0 z-20 shadow-sm">
          {paletteContent}
        </aside>
      )}

      {/* Floating Restore Button when Desktop Sidebar is Collapsed */}
      {isOpen === false && onToggleOpen && (
        <div className="hidden md:flex absolute top-3 left-3 z-30">
          <button
            type="button"
            onClick={onToggleOpen}
            className="btn btn-secondary btn-sm shadow-lg flex items-center gap-1.5 border border-slate-700/80 bg-slate-900/90 text-slate-200 hover:bg-slate-800 transition-all hover:scale-105"
            title="Expand Components Sidebar"
            aria-label="Expand Components Sidebar"
          >
            <PanelLeftOpen size={14} className="text-sky-400" />
            <span className="text-xs font-semibold">Components</span>
          </button>
        </div>
      )}

      {/* Mobile Drawer */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onToggleMobileDrawer}
          />
          <div
            className={`relative w-72 max-w-[85vw] h-full shadow-2xl flex flex-col z-10 transition-colors ${
              isDark ? 'bg-slate-900' : 'bg-slate-100'
            }`}
          >
            <div
              className={`p-3 flex items-center justify-between border-b shrink-0 transition-colors ${
                isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="LogixFlow" className="w-5 h-5 object-contain rounded" />
                <span className="font-semibold text-xs">Add Components</span>
              </div>
              <button
                type="button"
                onClick={onToggleMobileDrawer}
                className="btn btn-sm btn-icon btn-outline-secondary"
                aria-label="Close drawer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 min-h-0 flex flex-col">{paletteContent}</div>
          </div>
        </div>
      )}
    </>
  );
};
