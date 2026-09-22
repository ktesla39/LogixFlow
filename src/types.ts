export type GateType =
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'NAND'
  | 'NOR'
  | 'XOR'
  | 'XNOR'
  | 'BUFFER'
  | 'TRI_STATE';

export type FlipFlopType =
  | 'D_FLIP_FLOP'
  | 'JK_FLIP_FLOP'
  | 'SR_FLIP_FLOP'
  | 'T_FLIP_FLOP';

export type CombinationalType =
  | 'HALF_ADDER'
  | 'FULL_ADDER'
  | 'MUX_2TO1'
  | 'DEMUX_1TO2';

export type InputType =
  | 'SWITCH'
  | 'BUTTON'
  | 'CLOCK'
  | 'HIGH_CONST'
  | 'LOW_CONST';

export type OutputType =
  | 'LED'
  | 'PROBE'
  | 'SEVEN_SEG'
  | 'BUZZER';

export type ElectricComponentType =
  | 'ELEC_RESISTOR'
  | 'ELEC_CAPACITOR'
  | 'ELEC_INDUCTOR'
  | 'ELEC_DIODE'
  | 'ELEC_ZENER'
  | 'ELEC_LED'
  | 'ELEC_BATTERY'
  | 'ELEC_GROUND'
  | 'ELEC_AC_SOURCE'
  | 'ELEC_NPN'
  | 'ELEC_PNP'
  | 'ELEC_POTENTIOMETER'
  | 'ELEC_SWITCH'
  | 'ELEC_VOLTMETER'
  | 'ELEC_AMMETER'
  | 'ELEC_OPAMP'
  | 'ELEC_TRANSFORMER'
  | 'ELEC_FUSE'
  | 'ELEC_SPDT_SWITCH'
  | 'ELEC_OHMMETER';

export type FlowchartNodeType =
  | 'FLOW_START'
  | 'FLOW_END'
  | 'FLOW_PROCESS'
  | 'FLOW_DECISION'
  | 'FLOW_INPUT'
  | 'FLOW_OUTPUT'
  | 'FLOW_CONNECTOR'
  | 'FLOW_SUBROUTINE';

export type CircuitMode = 'logic' | 'flowchart' | 'electric';

export type NodeType =
  | GateType
  | FlipFlopType
  | CombinationalType
  | InputType
  | OutputType
  | ElectricComponentType
  | FlowchartNodeType
  | 'SUBCIRCUIT'
  | 'SUB_CIRCUIT';

export interface Pin {
  id: string;
  nodeId: string;
  type: 'input' | 'output';
  name: string;
  index: number;
  // Offset relative to node top-left
  offsetX: number;
  offsetY: number;
  value: boolean;
  expression?: string;
}

export interface CircuitNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  inputs: Pin[];
  outputs: Pin[];
  // Internal state for interactive elements (e.g. switch isOn, clock freq, etc.)
  state: {
    isOn?: boolean;
    frequencyHz?: number;
    color?: string;
    customLabel?: string;
    variableName?: string;
    computedExpression?: string;
    inputCount?: number;
    lastToggleTime?: number;
    prevClk?: boolean;
    q?: boolean;
    qBar?: boolean;
    // Flowchart specific execution state
    flowAction?: string;
    flowCondition?: string;
    flowVarName?: string;
    flowPrompt?: string;
    flowValue?: string | number;
    isFlowActive?: boolean;
    // Electric circuit specific simulation state
    resistance?: number;
    resistanceOhms?: number;
    capacitanceFarads?: number;
    inductanceHenries?: number;
    voltageVolts?: number;
    currentAmps?: number;
    forwardVoltageDrop?: number;
    zenerBreakdownVoltage?: number;
    isConducting?: boolean;
    wiperPercent?: number;
    potentiometerRatio?: number; // 0 to 1
    measuredValue?: string;
    opAmpGain?: number;
    transformerRatio?: number;
    fuseCurrentRating?: number;
    isFuseBlown?: boolean;
    switchPosition?: 'A' | 'B';
    // Subcircuit packaging state
    subcircuitSheetId?: string;
    subcircuitName?: string;
    subcircuitNodes?: CircuitNode[];
    subcircuitWires?: Wire[];
    subcircuitInputMap?: { pinId: string; internalNodeId: string; internalPinId: string }[];
    subcircuitOutputMap?: { pinId: string; internalNodeId: string; internalPinId: string }[];
    subCircuitDefId?: string;
    subCircuitName?: string;
    subCircuitDef?: SubCircuitDefinition;
    subCircuitInternalNodes?: CircuitNode[];
    subCircuitInternalWires?: Wire[];
    isCollapsed?: boolean;
  };
}

export interface SubCircuitPinDefinition {
  pinName: string;
  internalNodeId: string;
  internalPinId: string;
  variableName?: string;
}

export interface SubCircuitDefinition {
  id: string;
  name: string;
  description?: string;
  color?: string;
  inputPins: SubCircuitPinDefinition[];
  outputPins: SubCircuitPinDefinition[];
  internalNodes: CircuitNode[];
  internalWires: Wire[];
  createdAt?: number;
}

export interface Wire {
  id: string;
  fromNodeId: string;
  fromPinId: string;
  toNodeId: string;
  toPinId: string;
  value: boolean;
  expression?: string;
  label?: string;
}

export interface Sheet {
  id: string;
  name: string;
  circuitType?: CircuitMode;
  nodes: CircuitNode[];
  wires: Wire[];
  pan: { x: number; y: number };
  zoom: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  folderId?: string;
  circuitType?: CircuitMode;
  description?: string;
  sheets: Sheet[];
  activeSheetId: string;
  createdAt: number;
  updatedAt: number;
}

export interface DesignFolder {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface SimulationSettings {
  running: boolean;
  clockHz: number;
  speedMs: number;
  showGrid: boolean;
  snapToGrid: boolean;
  wireStyle: 'curved' | 'orthogonal';
  soundEnabled: boolean;
  showTimingDiagram: boolean;
  theme?: 'dark' | 'light';
  showWireExpressions?: boolean;
  showComponentVariables?: boolean;
}

export interface DraggingWire {
  fromNodeId: string;
  fromPinId: string;
  fromPinType: 'input' | 'output';
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  hoverPinId?: string;
  isSnapped?: boolean;
}

export interface TruthTableEntry {
  inputs: Record<string, boolean>;
  outputs: Record<string, boolean>;
}
