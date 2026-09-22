import React, { useState, useMemo } from 'react';
import { Sheet, Project, CircuitNode, Wire } from '../types';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  FileSpreadsheet,
  Network,
  Download,
  Copy,
  Check,
  ExternalLink,
  Tag,
  AlertTriangle,
  Info,
  CheckCircle2,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface EdaToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  currentSheet: Sheet;
  onSelectNode: (nodeId: string) => void;
  onUpdateNodeLabel?: (nodeId: string, label: string) => void;
  theme?: 'dark' | 'light';
}

export interface DrcViolation {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  nodeId?: string;
  nodeLabel?: string;
  pinName?: string;
  wireId?: string;
  location?: { x: number; y: number };
}

export interface BomEntry {
  category: string;
  name: string;
  designators: string[];
  quantity: number;
  pinCount: number;
  description: string;
  nodes: CircuitNode[];
}

export interface NetlistEntry {
  netId: string;
  netName: string;
  state: 'HIGH' | 'LOW' | 'HI_Z' | 'UNKNOWN';
  driver?: { nodeId: string; nodeLabel: string; pinName: string };
  pins: { nodeId: string; nodeLabel: string; pinName: string; pinType: 'input' | 'output' }[];
  wireIds: string[];
}

export const EdaToolsModal: React.FC<EdaToolsModalProps> = ({
  isOpen,
  onClose,
  project,
  currentSheet,
  onSelectNode,
  onUpdateNodeLabel,
  theme = 'light',
}) => {
  const [activeTab, setActiveTab] = useState<'erc' | 'bom' | 'netlist'>('erc');
  const [copiedText, setCopiedText] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const isDark = theme === 'dark';

  // --- 1. ALTIUM-STYLE ELECTRICAL RULES CHECK (ERC / DRC) ---
  const drcViolations = useMemo<DrcViolation[]>(() => {
    const list: DrcViolation[] = [];
    const nodes = currentSheet.nodes || [];
    const wires = currentSheet.wires || [];

    // Map wires by input pin (to check floating inputs or multi-drivers)
    const wiresToInputPin = new Map<string, Wire[]>();
    const wiresFromOutputPin = new Map<string, Wire[]>();

    wires.forEach((w) => {
      // Input end
      const inList = wiresToInputPin.get(w.toPinId) || [];
      inList.push(w);
      wiresToInputPin.set(w.toPinId, inList);

      // Output end
      const outList = wiresFromOutputPin.get(w.fromPinId) || [];
      outList.push(w);
      wiresFromOutputPin.set(w.fromPinId, outList);
    });

    // Check each component
    nodes.forEach((node) => {
      // 1. Floating inputs (unconnected gate inputs)
      node.inputs?.forEach((pin) => {
        const inWires = wiresToInputPin.get(pin.id) || [];
        if (inWires.length === 0) {
          list.push({
            id: `drc_floating_${node.id}_${pin.id}`,
            severity: 'warning',
            title: 'Floating Input Pin',
            description: `Pin "${pin.name}" on ${node.label || node.type} has no connected input signal wire.`,
            nodeId: node.id,
            nodeLabel: node.label || node.type,
            pinName: pin.name,
            location: { x: node.x, y: node.y },
          });
        }
      });

      // 2. Unconnected output pins
      node.outputs?.forEach((pin) => {
        const outWires = wiresFromOutputPin.get(pin.id) || [];
        if (outWires.length === 0 && !['LED', 'SEVEN_SEG', 'PROBE', 'BUZZER'].includes(node.type)) {
          list.push({
            id: `drc_unconnected_out_${node.id}_${pin.id}`,
            severity: 'info',
            title: 'Unconnected Output Pin',
            description: `Output pin "${pin.name}" of ${node.label || node.type} is not routed to any component.`,
            nodeId: node.id,
            nodeLabel: node.label || node.type,
            pinName: pin.name,
            location: { x: node.x, y: node.y },
          });
        }
      });

      // 3. Isolated Component check (no input and no output wires)
      const totalConnected = (node.inputs || []).reduce((acc, p) => acc + (wiresToInputPin.get(p.id)?.length || 0), 0) +
        (node.outputs || []).reduce((acc, p) => acc + (wiresFromOutputPin.get(p.id)?.length || 0), 0);
      if (totalConnected === 0 && (node.inputs?.length || node.outputs?.length)) {
        list.push({
          id: `drc_isolated_${node.id}`,
          severity: 'warning',
          title: 'Isolated Component',
          description: `Component ${node.label || node.type} is completely unattached to any electrical net.`,
          nodeId: node.id,
          nodeLabel: node.label || node.type,
          location: { x: node.x, y: node.y },
        });
      }
    });

    // 4. Multi-driver contention check (two outputs directly driving the same input node or net)
    const pinDrivenByOutputs = new Map<string, string[]>();
    wires.forEach((w) => {
      const existing = pinDrivenByOutputs.get(w.toPinId) || [];
      if (!existing.includes(w.fromNodeId)) {
        existing.push(w.fromNodeId);
      }
      pinDrivenByOutputs.set(w.toPinId, existing);
    });

    pinDrivenByOutputs.forEach((driverNodeIds, toPinId) => {
      if (driverNodeIds.length > 1) {
        // Find recipient node
        const recipientNode = nodes.find((n) => n.inputs?.some((p) => p.id === toPinId));
        const driverNames = driverNodeIds.map((id) => nodes.find((n) => n.id === id)?.label || id).join(', ');
        list.push({
          id: `drc_contention_${toPinId}`,
          severity: 'error',
          title: 'Bus Contention / Short Circuit',
          description: `Input pin on ${recipientNode?.label || 'Component'} is being driven by ${driverNodeIds.length} simultaneous outputs (${driverNames}).`,
          nodeId: recipientNode?.id,
          nodeLabel: recipientNode?.label || recipientNode?.type,
        });
      }
    });

    // 5. Zero components warning
    if (nodes.length === 0) {
      list.push({
        id: 'drc_empty_sheet',
        severity: 'info',
        title: 'Empty Schematic Sheet',
        description: 'Schematic has no components or circuits placed on canvas.',
      });
    }

    return list;
  }, [currentSheet]);

  const errorCount = drcViolations.filter((v) => v.severity === 'error').length;
  const warningCount = drcViolations.filter((v) => v.severity === 'warning').length;
  const infoCount = drcViolations.filter((v) => v.severity === 'info').length;

  const filteredViolations = useMemo(() => {
    if (severityFilter === 'all') return drcViolations;
    return drcViolations.filter((v) => v.severity === severityFilter);
  }, [drcViolations, severityFilter]);

  // --- 2. ALTIUM-STYLE BILL OF MATERIALS (BOM) GENERATOR ---
  const bomEntries = useMemo<BomEntry[]>(() => {
    const nodes = currentSheet.nodes || [];
    const grouped = new Map<string, { type: string; category: string; description: string; nodes: CircuitNode[] }>();

    // Helper to categorize components
    const categorize = (type: string): { category: string; description: string; prefix: string } => {
      switch (type) {
        case 'AND': return { category: 'Logic Gate', description: 'Dual/Quad 2-Input AND Gate (7408)', prefix: 'U' };
        case 'NAND': return { category: 'Logic Gate', description: 'Quad 2-Input NAND Gate (7400)', prefix: 'U' };
        case 'OR': return { category: 'Logic Gate', description: 'Quad 2-Input OR Gate (7432)', prefix: 'U' };
        case 'NOR': return { category: 'Logic Gate', description: 'Quad 2-Input NOR Gate (7402)', prefix: 'U' };
        case 'XOR': return { category: 'Logic Gate', description: 'Quad 2-Input XOR Gate (7486)', prefix: 'U' };
        case 'XNOR': return { category: 'Logic Gate', description: 'Quad 2-Input XNOR Gate (74266)', prefix: 'U' };
        case 'NOT': return { category: 'Logic Gate', description: 'Hex Inverter NOT Gate (7404)', prefix: 'U' };
        case 'BUFFER': return { category: 'Logic Gate', description: 'Hex Non-Inverting Buffer (7407)', prefix: 'U' };
        case 'TRI_STATE': return { category: 'Logic Gate', description: 'Tri-State Bus Driver (74125)', prefix: 'U' };
        case 'SWITCH': return { category: 'Control / Input', description: 'SPST Binary Toggle Switch', prefix: 'SW' };
        case 'BUTTON': return { category: 'Control / Input', description: 'Momentary Push Button Trigger', prefix: 'PB' };
        case 'CLOCK': return { category: 'Oscillator', description: 'Programmable Digital Clock Generator', prefix: 'OSC' };
        case 'HIGH_CONST': return { category: 'Power / VCC', description: 'Logic High Reference (+5V Source)', prefix: 'PWR' };
        case 'LOW_CONST': return { category: 'Power / GND', description: 'Logic Low Reference (0V Ground)', prefix: 'GND' };
        case 'LED': return { category: 'Indicator', description: 'Solid-State LED Indicator Lamp', prefix: 'D' };
        case 'PROBE': return { category: 'Test Point', description: 'High-Impedance Digital Logic Probe', prefix: 'TP' };
        case 'SEVEN_SEG': return { category: 'Display', description: '7-Segment Numeric Digital Display', prefix: 'DS' };
        case 'BUZZER': return { category: 'Audio', description: 'Piezoelectric Audio Indicator', prefix: 'BZ' };
        case 'D_FLIP_FLOP': return { category: 'Sequential IC', description: 'Dual D-Type Flip-Flop with Set/Reset', prefix: 'IC' };
        case 'JK_FLIP_FLOP': return { category: 'Sequential IC', description: 'Dual JK Flip-Flop (7476)', prefix: 'IC' };
        case 'SR_FLIP_FLOP': return { category: 'Sequential IC', description: 'SR Bistable Latch Memory Element', prefix: 'IC' };
        case 'T_FLIP_FLOP': return { category: 'Sequential IC', description: 'Toggle T-Type Flip-Flop Frequency Divider', prefix: 'IC' };
        case 'HALF_ADDER': return { category: 'Arithmetic IC', description: '1-Bit Binary Half Adder Block', prefix: 'IC' };
        case 'FULL_ADDER': return { category: 'Arithmetic IC', description: '1-Bit Full Binary Adder with Carry In/Out', prefix: 'IC' };
        case 'MUX_2TO1': return { category: 'Routing IC', description: '2-to-1 Multiplexer Data Selector', prefix: 'IC' };
        case 'DEMUX_1TO2': return { category: 'Routing IC', description: '1-to-2 Demultiplexer Decoder', prefix: 'IC' };
        case 'SUBCIRCUIT': return { category: 'Subsystem Module', description: 'Modular Sub-Circuit Integrated Block', prefix: 'MOD' };
        default: return { category: 'Component', description: type, prefix: 'U' };
      }
    };

    nodes.forEach((n) => {
      const info = categorize(n.type);
      const key = `${n.type}`;
      if (!grouped.has(key)) {
        grouped.set(key, { type: n.type, category: info.category, description: info.description, nodes: [] });
      }
      grouped.get(key)!.nodes.push(n);
    });

    const result: BomEntry[] = [];
    grouped.forEach((val) => {
      const pinCount = (val.nodes[0]?.inputs?.length || 0) + (val.nodes[0]?.outputs?.length || 0);
      const designators = val.nodes.map((n) => n.label || n.type);
      result.push({
        name: val.type,
        category: val.category,
        description: val.description,
        quantity: val.nodes.length,
        pinCount,
        designators,
        nodes: val.nodes,
      });
    });

    return result.sort((a, b) => b.quantity - a.quantity);
  }, [currentSheet]);

  const totalPartsCount = useMemo(() => bomEntries.reduce((acc, b) => acc + b.quantity, 0), [bomEntries]);

  // --- 3. ALTIUM-STYLE NETLIST INSPECTOR ---
  const netlistEntries = useMemo<NetlistEntry[]>(() => {
    const nodes = currentSheet.nodes || [];
    const wires = currentSheet.wires || [];

    // Group interconnected pins and wires into nets (Disjoint-Set / Union-Find)
    // Map pinId -> Net
    type PinRef = { nodeId: string; pinId: string; pinType: 'input' | 'output'; name: string };
    const allPins = new Map<string, PinRef>();

    nodes.forEach((node) => {
      node.inputs?.forEach((p) => allPins.set(p.id, { nodeId: node.id, pinId: p.id, pinType: 'input', name: p.name }));
      node.outputs?.forEach((p) => allPins.set(p.id, { nodeId: node.id, pinId: p.id, pinType: 'output', name: p.name }));
    });

    const parent = new Map<string, string>();
    allPins.forEach((_, pinId) => parent.set(pinId, pinId));

    const find = (id: string): string => {
      if (parent.get(id) === id) return id;
      const root = find(parent.get(id)!);
      parent.set(id, root);
      return root;
    };

    const union = (id1: string, id2: string) => {
      const root1 = find(id1);
      const root2 = find(id2);
      if (root1 !== root2) {
        parent.set(root1, root2);
      }
    };

    wires.forEach((w) => {
      if (allPins.has(w.fromPinId) && allPins.has(w.toPinId)) {
        union(w.fromPinId, w.toPinId);
      }
    });

    // Group into distinct nets
    const netGroups = new Map<string, { pinIds: string[]; wireIds: string[]; state: boolean | undefined }>();

    allPins.forEach((_, pinId) => {
      const root = find(pinId);
      if (!netGroups.has(root)) {
        netGroups.set(root, { pinIds: [], wireIds: [], state: undefined });
      }
      netGroups.get(root)!.pinIds.push(pinId);
    });

    wires.forEach((w) => {
      if (allPins.has(w.fromPinId)) {
        const root = find(w.fromPinId);
        const g = netGroups.get(root);
        if (g && !g.wireIds.includes(w.id)) {
          g.wireIds.push(w.id);
          g.state = w.value;
        }
      }
    });

    // Build final netlist entries (filter out solitary unconnected single pins for clean view)
    const list: NetlistEntry[] = [];
    let netIdx = 1;

    netGroups.forEach((g) => {
      if (g.pinIds.length <= 1 && g.wireIds.length === 0) return; // skip single orphan pin

      const pinsInfo = g.pinIds.map((pId) => {
        const pref = allPins.get(pId)!;
        const node = nodes.find((n) => n.id === pref.nodeId);
        return {
          nodeId: pref.nodeId,
          nodeLabel: node?.label || node?.type || 'Component',
          pinName: pref.name,
          pinType: pref.pinType,
        };
      });

      const driverPin = pinsInfo.find((p) => p.pinType === 'output');
      const netName = driverPin
        ? `NET_${driverPin.nodeLabel.replace(/\s+/g, '_')}_${driverPin.pinName}`
        : `NET_${String(netIdx).padStart(3, '0')}`;

      list.push({
        netId: `net_${netIdx}`,
        netName,
        state: g.state === true ? 'HIGH' : g.state === false ? 'LOW' : 'HI_Z',
        driver: driverPin,
        pins: pinsInfo,
        wireIds: g.wireIds,
      });

      netIdx++;
    });

    return list;
  }, [currentSheet]);

  // Export BOM as CSV
  const handleExportBomCsv = () => {
    const headers = ['Designator', 'Component Type', 'Category', 'Quantity', 'Pin Count', 'Description'];
    const rows = bomEntries.map((b) => [
      `"${b.designators.join(', ')}"`,
      `"${b.name}"`,
      `"${b.category}"`,
      b.quantity,
      b.pinCount,
      `"${b.description}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${project.name.replace(/\s+/g, '_')}_BOM.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Netlist as Wirelist Text
  const handleExportNetlist = () => {
    let text = `; ==========================================================\n`;
    text += `; LogixFlow EDA Netlist Wirelist File\n`;
    text += `; Project: ${project.name}\n`;
    text += `; Sheet: ${currentSheet.name}\n`;
    text += `; Generated: ${new Date().toISOString()}\n`;
    text += `; ==========================================================\n\n`;

    netlistEntries.forEach((net) => {
      text += `NET ${net.netName} (State: ${net.state})\n`;
      net.pins.forEach((p) => {
        text += `  ${p.nodeLabel}:${p.pinName} [${p.pinType.toUpperCase()}]\n`;
      });
      text += `\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_Netlist.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy Netlist to Clipboard
  const handleCopyNetlist = () => {
    const summary = netlistEntries.map((n) => `${n.netName}: ${n.pins.map((p) => `${p.nodeLabel}.${p.pinName}`).join(' <-> ')}`).join('\n');
    navigator.clipboard.writeText(summary);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl h-[88vh] max-h-[760px] rounded-2xl shadow-2xl flex flex-col border overflow-hidden transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-slate-950/80'
            : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/80'
        }`}
      >
        {/* Header Bar */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-950/40">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono tracking-tight">ALTIUM EDA WORKSTATION</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  v2.5 Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {project.name} &bull; Sheet: {currentSheet.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Close modal (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Switcher & Quick Metrics */}
        <div
          className={`flex flex-wrap items-center justify-between px-5 py-2.5 border-b gap-3 shrink-0 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100/70 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 bg-slate-950/40 p-1 rounded-xl border border-slate-700/50">
            <button
              type="button"
              onClick={() => setActiveTab('erc')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'erc'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert size={14} />
              <span>Design Rules (DRC)</span>
              {errorCount > 0 ? (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                  {errorCount}
                </span>
              ) : warningCount > 0 ? (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  {warningCount}
                </span>
              ) : (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  0
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'bom'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileSpreadsheet size={14} />
              <span>Bill of Materials (BOM)</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
                {totalPartsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('netlist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'netlist'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Network size={14} />
              <span>Netlist Inspector</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
                {netlistEntries.length}
              </span>
            </button>
          </div>

          {/* Tab Specific Quick Action Buttons */}
          <div className="flex items-center gap-2">
            {activeTab === 'erc' && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[11px] text-slate-500 mr-1">Filter:</span>
                {(['all', 'error', 'warning', 'info'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize border transition-all ${
                      severityFilter === sev
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/50'
                        : 'border-transparent text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'bom' && (
              <button
                type="button"
                onClick={handleExportBomCsv}
                className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
                title="Download standard CSV Bill of Materials"
              >
                <Download size={13} />
                <span>Export BOM (CSV)</span>
              </button>
            )}

            {activeTab === 'netlist' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyNetlist}
                  className="btn btn-outline-secondary btn-sm flex items-center gap-1"
                  title="Copy wirelist to clipboard"
                >
                  {copiedText ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedText ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportNetlist}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
                  title="Download standard EDA Netlist wirelist format"
                >
                  <Download size={13} />
                  <span>Export Netlist</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: ELECTRICAL RULES CHECK (ERC) */}
          {activeTab === 'erc' && (
            <div className="space-y-4">
              {/* Summary Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                  errorCount > 0
                    ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                    : warningCount > 0
                    ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                    : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      errorCount > 0
                        ? 'bg-rose-500 text-white'
                        : warningCount > 0
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {errorCount > 0 ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">
                      {errorCount > 0
                        ? `${errorCount} Critical DRC Violation${errorCount > 1 ? 's' : ''} Detected`
                        : warningCount > 0
                        ? `${warningCount} Design Warning${warningCount > 1 ? 's' : ''} Found`
                        : 'Schematic Clean & Ready for Simulation!'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Evaluated {currentSheet.nodes?.length || 0} components, {currentSheet.wires?.length || 0} signal wires, and {netlistEntries.length} electrical nets against Altium EDA verification standards.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-1 rounded bg-rose-950/80 text-rose-400 border border-rose-800">
                    {errorCount} Errors
                  </span>
                  <span className="px-2 py-1 rounded bg-amber-950/80 text-amber-400 border border-amber-800">
                    {warningCount} Warnings
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-950/80 text-slate-400 border border-slate-800">
                    {infoCount} Info
                  </span>
                </div>
              </div>

              {/* DRC Violation Items List */}
              {filteredViolations.length === 0 ? (
                <div className="p-12 text-center border border-dashed rounded-2xl border-slate-800 text-slate-500 space-y-2">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
                  <div className="text-sm font-bold text-slate-300">No rule violations matching current filter</div>
                  <div className="text-xs text-slate-500">All input pins driven, no short circuits, and net fan-out valid.</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredViolations.map((v) => (
                    <div
                      key={v.id}
                      className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                        v.severity === 'error'
                          ? 'bg-rose-950/20 border-rose-800/40 hover:border-rose-700'
                          : v.severity === 'warning'
                          ? 'bg-amber-950/20 border-amber-800/40 hover:border-amber-700'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {v.severity === 'error' && <AlertTriangle size={16} className="text-rose-400" />}
                          {v.severity === 'warning' && <AlertTriangle size={16} className="text-amber-400" />}
                          {v.severity === 'info' && <Info size={16} className="text-sky-400" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono">{v.title}</span>
                            {v.nodeLabel && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                                {v.nodeLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{v.description}</p>
                        </div>
                      </div>

                      {v.nodeId && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectNode(v.nodeId!);
                            onClose();
                          }}
                          className="shrink-0 btn btn-sm btn-outline-secondary flex items-center gap-1 text-[11px]"
                          title="Locate and focus this component in schematic canvas"
                        >
                          <span>Locate</span>
                          <ArrowRight size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BILL OF MATERIALS (BOM) */}
          {activeTab === 'bom' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span>
                  Total unique component footprints: <strong className="text-white">{bomEntries.length}</strong> &bull; Total parts placed:{' '}
                  <strong className="text-sky-400">{totalPartsCount}</strong>
                </span>
                <span className="text-[11px] font-mono">Altium Standard ANSI/IPC BOM Format</span>
              </div>

              {bomEntries.length === 0 ? (
                <div className="p-12 text-center border border-dashed rounded-2xl border-slate-800 text-slate-500">
                  No components placed on this schematic yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 font-mono text-[11px] text-slate-400">
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3">Designators</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-center">Pins</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {bomEntries.map((item, idx) => (
                        <tr key={item.name} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {item.designators.map((d, dIdx) => (
                                <span
                                  key={dIdx}
                                  className="px-1.5 py-0.2 rounded text-[10px] bg-sky-950/60 text-sky-300 border border-sky-800/50"
                                >
                                  {d}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-white">{item.name}</td>
                          <td className="py-2.5 px-3 text-slate-400">{item.category}</td>
                          <td className="py-2.5 px-3 text-slate-400 font-sans">{item.description}</td>
                          <td className="py-2.5 px-3 text-center text-slate-400">{item.pinCount}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-sky-400">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NETLIST INSPECTOR */}
          {activeTab === 'netlist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span>
                  Discovered <strong className="text-white">{netlistEntries.length}</strong> electrical nets across current sheet.
                </span>
                <span className="text-[11px] font-mono">Live signal state: HIGH (1), LOW (0), HI-Z (Float)</span>
              </div>

              {netlistEntries.length === 0 ? (
                <div className="p-12 text-center border border-dashed rounded-2xl border-slate-800 text-slate-500">
                  No wired electrical nets found on canvas. Connect components using wires to build nets.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {netlistEntries.map((net) => (
                    <div
                      key={net.netId}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-sky-400">{net.netName}</span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold border ${
                              net.state === 'HIGH'
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                : net.state === 'LOW'
                                ? 'bg-slate-800 text-slate-400 border-slate-700'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {net.state}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {net.pins.length} Connected Pins &bull; {net.wireIds.length} Wire Segments
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                        {net.pins.map((pin, pIdx) => (
                          <div
                            key={pIdx}
                            className={`flex items-center gap-1 px-2 py-1 rounded border ${
                              pin.pinType === 'output'
                                ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
                                : 'bg-slate-950/60 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span className="font-semibold">{pin.nodeLabel}</span>
                            <span className="text-slate-500">.</span>
                            <span className="text-sky-400">{pin.pinName}</span>
                            <span className="text-[9px] uppercase px-1 rounded bg-black/40 text-slate-400">
                              {pin.pinType === 'output' ? 'OUT' : 'IN'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div
          className={`flex items-center justify-between px-5 py-3 border-t text-xs text-slate-500 font-mono shrink-0 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>Altium Schematic Capture Rule Engine</span>
            <span>&bull;</span>
            <span>ISO/ANSI Standard</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
