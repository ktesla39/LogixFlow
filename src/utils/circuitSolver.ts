import { CircuitNode, NodeType, Pin, TruthTableEntry, Wire } from '../types';
import { computeCircuitExpressions } from './booleanAlgebra';

export function getNodeDimensions(type: NodeType): { width: number; height: number } {
  switch (type) {
    case 'AND':
    case 'OR':
    case 'NAND':
    case 'NOR':
    case 'XOR':
    case 'XNOR':
      return { width: 110, height: 72 };
    case 'NOT':
    case 'BUFFER':
      return { width: 100, height: 60 };
    case 'TRI_STATE':
      return { width: 100, height: 64 };
    case 'D_FLIP_FLOP':
    case 'T_FLIP_FLOP':
      return { width: 110, height: 80 };
    case 'JK_FLIP_FLOP':
    case 'SR_FLIP_FLOP':
      return { width: 110, height: 88 };
    case 'HALF_ADDER':
      return { width: 110, height: 80 };
    case 'FULL_ADDER':
      return { width: 110, height: 88 };
    case 'MUX_2TO1':
    case 'DEMUX_1TO2':
      return { width: 96, height: 72 };
    case 'SWITCH':
      return { width: 88, height: 54 };
    case 'BUTTON':
      return { width: 78, height: 58 };
    case 'CLOCK':
      return { width: 90, height: 54 };
    case 'HIGH_CONST':
    case 'LOW_CONST':
      return { width: 76, height: 44 };
    case 'LED':
      return { width: 68, height: 76 };
    case 'PROBE':
      return { width: 96, height: 58 };
    case 'SEVEN_SEG':
      return { width: 96, height: 120 };
    case 'BUZZER':
      return { width: 78, height: 64 };
    case 'FLOW_START':
    case 'FLOW_END':
      return { width: 140, height: 50 };
    case 'FLOW_PROCESS':
    case 'FLOW_INPUT':
    case 'FLOW_OUTPUT':
    case 'FLOW_SUBROUTINE':
      return { width: 150, height: 60 };
    case 'FLOW_DECISION':
      return { width: 150, height: 80 };
    case 'FLOW_CONNECTOR':
      return { width: 50, height: 50 };
    case 'SUBCIRCUIT':
    case 'SUB_CIRCUIT':
      return { width: 140, height: 96 };
    case 'ELEC_RESISTOR':
      return { width: 90, height: 48 };
    case 'ELEC_CAPACITOR':
    case 'ELEC_INDUCTOR':
      return { width: 84, height: 50 };
    case 'ELEC_DIODE':
    case 'ELEC_ZENER':
    case 'ELEC_LED':
      return { width: 88, height: 54 };
    case 'ELEC_BATTERY':
      return { width: 80, height: 60 };
    case 'ELEC_GROUND':
      return { width: 60, height: 44 };
    case 'ELEC_AC_SOURCE':
      return { width: 76, height: 60 };
    case 'ELEC_NPN':
    case 'ELEC_PNP':
      return { width: 92, height: 76 };
    case 'ELEC_POTENTIOMETER':
      return { width: 94, height: 68 };
    case 'ELEC_SWITCH':
      return { width: 84, height: 50 };
    case 'ELEC_SPDT_SWITCH':
      return { width: 88, height: 56 };
    case 'ELEC_FUSE':
      return { width: 84, height: 48 };
    case 'ELEC_TRANSFORMER':
      return { width: 94, height: 68 };
    case 'ELEC_OPAMP':
      return { width: 96, height: 72 };
    case 'ELEC_VOLTMETER':
    case 'ELEC_AMMETER':
    case 'ELEC_OHMMETER':
      return { width: 88, height: 64 };
    default:
      return { width: 100, height: 70 };
  }
}

/**
 * Reconfigures pin count for multi-input logic gates (2 to 8 inputs)
 */
export function updateGateInputCount(node: CircuitNode, newCount: number): CircuitNode {
  const count = Math.max(2, Math.min(8, newCount));
  const height = node.height;
  const newInputs: Pin[] = [];

  const pinLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  for (let i = 0; i < count; i++) {
    let offsetY = 36;
    if (count === 2) {
      offsetY = i === 0 ? 22 : 50;
    } else if (count === 3) {
      offsetY = i === 0 ? 18 : i === 1 ? 36 : 54;
    } else if (count === 4) {
      offsetY = 16 + i * 14;
    } else {
      offsetY = 14 + (i / (count - 1)) * 44;
    }

    const existingPin = node.inputs[i];
    newInputs.push({
      id: existingPin ? existingPin.id : `${node.id}_in_${i}`,
      nodeId: node.id,
      type: 'input',
      name: pinLetters[i] || `IN_${i}`,
      index: i,
      offsetX: 2,
      offsetY: Math.round(offsetY),
      value: existingPin ? existingPin.value : false,
      expression: existingPin ? existingPin.expression : undefined,
    });
  }

  return {
    ...node,
    inputs: newInputs,
    state: {
      ...node.state,
      inputCount: count,
    },
  };
}

export function createDefaultNode(
  type: NodeType,
  x: number,
  y: number,
  id?: string,
  stateOverride?: CircuitNode['state'],
  customLabel?: string
): CircuitNode {
  const nodeId = id || `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const { width, height } = getNodeDimensions(type);

  const inputs: Pin[] = [];
  const outputs: Pin[] = [];

  const initialInputCount = stateOverride?.inputCount || 2;

  switch (type) {
    case 'AND':
    case 'OR':
    case 'NAND':
    case 'NOR':
    case 'XOR':
    case 'XNOR': {
      const pinLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      for (let i = 0; i < initialInputCount; i++) {
        let offsetY = 36;
        if (initialInputCount === 2) {
          offsetY = i === 0 ? 22 : 50;
        } else if (initialInputCount === 3) {
          offsetY = i === 0 ? 18 : i === 1 ? 36 : 54;
        } else {
          offsetY = 16 + i * 14;
        }

        inputs.push({
          id: `${nodeId}_in_${i}`,
          nodeId,
          type: 'input',
          name: pinLetters[i],
          index: i,
          offsetX: 2,
          offsetY: Math.round(offsetY),
          value: false,
        });
      }

      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'Q',
        index: 0,
        offsetX: 108,
        offsetY: 36,
        value: false,
      });
      break;
    }

    case 'NOT':
    case 'BUFFER': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'A',
        index: 0,
        offsetX: 2,
        offsetY: 30,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'Q',
        index: 0,
        offsetX: 98,
        offsetY: 30,
        value: type === 'NOT' ? true : false,
      });
      break;
    }

    case 'SWITCH': {
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'OUT',
        index: 0,
        offsetX: 86,
        offsetY: 27,
        value: stateOverride?.isOn ?? false,
      });
      break;
    }

    case 'BUTTON': {
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'OUT',
        index: 0,
        offsetX: 76,
        offsetY: 29,
        value: stateOverride?.isOn ?? false,
      });
      break;
    }

    case 'CLOCK': {
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'CLK',
        index: 0,
        offsetX: 88,
        offsetY: 27,
        value: false,
      });
      break;
    }

    case 'HIGH_CONST': {
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: '1',
        index: 0,
        offsetX: 74,
        offsetY: 22,
        value: true,
      });
      break;
    }

    case 'LOW_CONST': {
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: '0',
        index: 0,
        offsetX: 74,
        offsetY: 22,
        value: false,
      });
      break;
    }

    case 'LED': {
      // Light Bulb: terminal at the bottom lead of the bulb base
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'IN',
        index: 0,
        offsetX: 34,
        offsetY: 74,
        value: false,
      });
      break;
    }

    case 'PROBE': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'IN',
        index: 0,
        offsetX: 2,
        offsetY: 29,
        value: false,
      });
      break;
    }

    case 'BUZZER': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'IN',
        index: 0,
        offsetX: 2,
        offsetY: 32,
        value: false,
      });
      break;
    }

    case 'SEVEN_SEG': {
      const pinNames = ['A (1)', 'B (2)', 'C (4)', 'D (8)'];
      for (let i = 0; i < 4; i++) {
        inputs.push({
          id: `${nodeId}_in_${i}`,
          nodeId,
          type: 'input',
          name: pinNames[i],
          index: i,
          offsetX: 2,
          offsetY: 26 + i * 24,
          value: false,
        });
      }
      break;
    }

    case 'TRI_STATE': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'IN',
        index: 0,
        offsetX: 2,
        offsetY: 24,
        value: false,
      });
      inputs.push({
        id: `${nodeId}_in_1`,
        nodeId,
        type: 'input',
        name: 'EN',
        index: 1,
        offsetX: 48,
        offsetY: 60,
        value: true,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'OUT',
        index: 0,
        offsetX: 98,
        offsetY: 24,
        value: false,
      });
      break;
    }

    case 'D_FLIP_FLOP': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'D',
        index: 0,
        offsetX: 2,
        offsetY: 24,
        value: false,
      });
      inputs.push({
        id: `${nodeId}_in_1`,
        nodeId,
        type: 'input',
        name: 'CLK',
        index: 1,
        offsetX: 2,
        offsetY: 56,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'Q',
        index: 0,
        offsetX: 108,
        offsetY: 24,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_1`,
        nodeId,
        type: 'output',
        name: '~Q',
        index: 1,
        offsetX: 108,
        offsetY: 56,
        value: true,
      });
      break;
    }

    case 'T_FLIP_FLOP': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'T',
        index: 0,
        offsetX: 2,
        offsetY: 24,
        value: false,
      });
      inputs.push({
        id: `${nodeId}_in_1`,
        nodeId,
        type: 'input',
        name: 'CLK',
        index: 1,
        offsetX: 2,
        offsetY: 56,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'Q',
        index: 0,
        offsetX: 108,
        offsetY: 24,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_1`,
        nodeId,
        type: 'output',
        name: '~Q',
        index: 1,
        offsetX: 108,
        offsetY: 56,
        value: true,
      });
      break;
    }

    case 'JK_FLIP_FLOP': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'J',
        index: 0,
        offsetX: 2,
        offsetY: 20,
        value: false,
      });
      inputs.push({
        id: `${nodeId}_in_1`,
        nodeId,
        type: 'input',
        name: 'CLK',
        index: 1,
        offsetX: 2,
        offsetY: 44,
        value: false,
      });
      inputs.push({
        id: `${nodeId}_in_2`,
        nodeId,
        type: 'input',
        name: 'K',
        index: 2,
        offsetX: 2,
        offsetY: 68,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'Q',
        index: 0,
        offsetX: 108,
        offsetY: 24,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_1`,
        nodeId,
        type: 'output',
        name: '~Q',
        index: 1,
        offsetX: 108,
        offsetY: 64,
        value: true,
      });
      break;
    }

    case 'SR_FLIP_FLOP': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'S',
        index: 0,
        offsetX: 2,
        offsetY: 20,
        value: false,
      });
      inputs.push({
        id: `${nodeId}_in_1`,
        nodeId,
        type: 'input',
        name: 'CLK',
        index: 1,
        offsetX: 2,
        offsetY: 44,
        value: false,
      });
      inputs.push({
        id: `${nodeId}_in_2`,
        nodeId,
        type: 'input',
        name: 'R',
        index: 2,
        offsetX: 2,
        offsetY: 68,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'Q',
        index: 0,
        offsetX: 108,
        offsetY: 24,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_1`,
        nodeId,
        type: 'output',
        name: '~Q',
        index: 1,
        offsetX: 108,
        offsetY: 64,
        value: true,
      });
      break;
    }

    case 'HALF_ADDER': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'A',
        index: 0,
        offsetX: 2,
        offsetY: 24,
        value: false,
      });
      inputs.push({
        id: `${nodeId}_in_1`,
        nodeId,
        type: 'input',
        name: 'B',
        index: 1,
        offsetX: 2,
        offsetY: 56,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'SUM',
        index: 0,
        offsetX: 108,
        offsetY: 24,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_1`,
        nodeId,
        type: 'output',
        name: 'CARRY',
        index: 1,
        offsetX: 108,
        offsetY: 56,
        value: false,
      });
      break;
    }

    case 'FULL_ADDER': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'A',
        index: 0,
        offsetX: 2,
        offsetY: 20,
        value: false,
      });
      inputs.push({
        id: `${nodeId}_in_1`,
        nodeId,
        type: 'input',
        name: 'B',
        index: 1,
        offsetX: 2,
        offsetY: 44,
        value: false,
      });
      inputs.push({
        id: `${nodeId}_in_2`,
        nodeId,
        type: 'input',
        name: 'Cin',
        index: 2,
        offsetX: 2,
        offsetY: 68,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'SUM',
        index: 0,
        offsetX: 108,
        offsetY: 28,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_1`,
        nodeId,
        type: 'output',
        name: 'Cout',
        index: 1,
        offsetX: 108,
        offsetY: 60,
        value: false,
      });
      break;
    }

    case 'MUX_2TO1': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'D0',
        index: 0,
        offsetX: 2,
        offsetY: 20,
        value: false,
      });
      inputs.push({
        id: `${nodeId}_in_1`,
        nodeId,
        type: 'input',
        name: 'D1',
        index: 1,
        offsetX: 2,
        offsetY: 50,
        value: false,
      });
      inputs.push({
        id: `${nodeId}_in_2`,
        nodeId,
        type: 'input',
        name: 'SEL',
        index: 2,
        offsetX: 48,
        offsetY: 70,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'Y',
        index: 0,
        offsetX: 94,
        offsetY: 35,
        value: false,
      });
      break;
    }

    case 'DEMUX_1TO2': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'IN',
        index: 0,
        offsetX: 2,
        offsetY: 35,
        value: false,
      });
      inputs.push({
        id: `${nodeId}_in_1`,
        nodeId,
        type: 'input',
        name: 'SEL',
        index: 1,
        offsetX: 48,
        offsetY: 70,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'Y0',
        index: 0,
        offsetX: 94,
        offsetY: 20,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_1`,
        nodeId,
        type: 'output',
        name: 'Y1',
        index: 1,
        offsetX: 94,
        offsetY: 50,
        value: false,
      });
      break;
    }

    case 'FLOW_START': {
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'NEXT',
        index: 0,
        offsetX: 70,
        offsetY: 50,
        value: true,
      });
      break;
    }

    case 'FLOW_END': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'IN',
        index: 0,
        offsetX: 70,
        offsetY: 0,
        value: false,
      });
      break;
    }

    case 'FLOW_PROCESS': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'IN',
        index: 0,
        offsetX: 75,
        offsetY: 0,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'NEXT',
        index: 0,
        offsetX: 75,
        offsetY: 60,
        value: true,
      });
      break;
    }

    case 'FLOW_DECISION': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'IN',
        index: 0,
        offsetX: 75,
        offsetY: 4,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'YES',
        index: 0,
        offsetX: 146,
        offsetY: 40,
        value: true,
      });
      outputs.push({
        id: `${nodeId}_out_1`,
        nodeId,
        type: 'output',
        name: 'NO',
        index: 1,
        offsetX: 75,
        offsetY: 76,
        value: false,
      });
      break;
    }

    case 'FLOW_INPUT': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'IN',
        index: 0,
        offsetX: 75,
        offsetY: 4,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'NEXT',
        index: 0,
        offsetX: 75,
        offsetY: 56,
        value: true,
      });
      break;
    }

    case 'FLOW_OUTPUT': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'IN',
        index: 0,
        offsetX: 75,
        offsetY: 4,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'NEXT',
        index: 0,
        offsetX: 75,
        offsetY: 56,
        value: true,
      });
      break;
    }

    case 'FLOW_CONNECTOR': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'IN 1',
        index: 0,
        offsetX: 25,
        offsetY: 4,
        value: false,
      });
      inputs.push({
        id: `${nodeId}_in_1`,
        nodeId,
        type: 'input',
        name: 'IN 2',
        index: 1,
        offsetX: 4,
        offsetY: 25,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'NEXT',
        index: 0,
        offsetX: 25,
        offsetY: 46,
        value: true,
      });
      break;
    }

    case 'FLOW_SUBROUTINE': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'IN',
        index: 0,
        offsetX: 75,
        offsetY: 0,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'NEXT',
        index: 0,
        offsetX: 75,
        offsetY: 60,
        value: true,
      });
      break;
    }

    case 'SUBCIRCUIT':
    case 'SUB_CIRCUIT': {
      const inCount = stateOverride?.subcircuitInputMap?.length || (stateOverride?.subCircuitDef?.inputPins?.length) || 2;
      const outCount = stateOverride?.subcircuitOutputMap?.length || (stateOverride?.subCircuitDef?.outputPins?.length) || 1;
      for (let i = 0; i < inCount; i++) {
        const pinName = stateOverride?.subCircuitDef?.inputPins?.[i]?.pinName || `IN${i + 1}`;
        inputs.push({
          id: `${nodeId}_in_${i}`,
          nodeId,
          type: 'input',
          name: pinName,
          index: i,
          offsetX: 2,
          offsetY: Math.round(20 + i * 22),
          value: false,
        });
      }
      for (let j = 0; j < outCount; j++) {
        const pinName = stateOverride?.subCircuitDef?.outputPins?.[j]?.pinName || `OUT${j + 1}`;
        outputs.push({
          id: `${nodeId}_out_${j}`,
          nodeId,
          type: 'output',
          name: pinName,
          index: j,
          offsetX: width - 2,
          offsetY: Math.round(20 + j * 22),
          value: false,
        });
      }
      break;
    }

    case 'ELEC_RESISTOR': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'T1',
        index: 0,
        offsetX: 2,
        offsetY: 24,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'T2',
        index: 0,
        offsetX: width - 2,
        offsetY: 24,
        value: false,
      });
      break;
    }

    case 'ELEC_CAPACITOR': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: '+',
        index: 0,
        offsetX: 2,
        offsetY: 25,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: '-',
        index: 0,
        offsetX: width - 2,
        offsetY: 25,
        value: false,
      });
      break;
    }

    case 'ELEC_INDUCTOR': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'L1',
        index: 0,
        offsetX: 2,
        offsetY: 25,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'L2',
        index: 0,
        offsetX: width - 2,
        offsetY: 25,
        value: false,
      });
      break;
    }

    case 'ELEC_DIODE': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'Anode (+)',
        index: 0,
        offsetX: 2,
        offsetY: 27,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'Cathode (-)',
        index: 0,
        offsetX: width - 2,
        offsetY: 27,
        value: false,
      });
      break;
    }

    case 'ELEC_ZENER': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'Anode (+)',
        index: 0,
        offsetX: 2,
        offsetY: 27,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'Cathode (-)',
        index: 0,
        offsetX: width - 2,
        offsetY: 27,
        value: false,
      });
      break;
    }

    case 'ELEC_LED': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'Anode (+)',
        index: 0,
        offsetX: 2,
        offsetY: 27,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'Cathode (-)',
        index: 0,
        offsetX: width - 2,
        offsetY: 27,
        value: false,
      });
      break;
    }

    case 'ELEC_BATTERY': {
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'V+ (+9V)',
        index: 0,
        offsetX: width - 2,
        offsetY: 30,
        value: true,
      });
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'V- (0V)',
        index: 0,
        offsetX: 2,
        offsetY: 30,
        value: false,
      });
      break;
    }

    case 'ELEC_GROUND': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'GND (0V)',
        index: 0,
        offsetX: Math.round(width / 2),
        offsetY: 2,
        value: false,
      });
      break;
    }

    case 'ELEC_AC_SOURCE': {
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'AC Out',
        index: 0,
        offsetX: width - 2,
        offsetY: 30,
        value: false,
      });
      break;
    }

    case 'ELEC_NPN': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'Base (B)',
        index: 0,
        offsetX: 2,
        offsetY: 38,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'Collector (C)',
        index: 0,
        offsetX: width - 2,
        offsetY: 18,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_1`,
        nodeId,
        type: 'output',
        name: 'Emitter (E)',
        index: 1,
        offsetX: width - 2,
        offsetY: 58,
        value: false,
      });
      break;
    }

    case 'ELEC_PNP': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'Base (B)',
        index: 0,
        offsetX: 2,
        offsetY: 38,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'Emitter (E)',
        index: 0,
        offsetX: width - 2,
        offsetY: 18,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_1`,
        nodeId,
        type: 'output',
        name: 'Collector (C)',
        index: 1,
        offsetX: width - 2,
        offsetY: 58,
        value: false,
      });
      break;
    }

    case 'ELEC_POTENTIOMETER': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'Terminal 1',
        index: 0,
        offsetX: 2,
        offsetY: 18,
        value: false,
      });
      inputs.push({
        id: `${nodeId}_in_1`,
        nodeId,
        type: 'input',
        name: 'Terminal 2',
        index: 1,
        offsetX: 2,
        offsetY: 50,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'Wiper (W)',
        index: 0,
        offsetX: width - 2,
        offsetY: 34,
        value: false,
      });
      break;
    }

    case 'ELEC_SWITCH': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'IN',
        index: 0,
        offsetX: 2,
        offsetY: 25,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'OUT',
        index: 0,
        offsetX: width - 2,
        offsetY: 25,
        value: false,
      });
      break;
    }

    case 'ELEC_VOLTMETER': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'V+ (Red)',
        index: 0,
        offsetX: 2,
        offsetY: 20,
        value: false,
      });
      inputs.push({
        id: `${nodeId}_in_1`,
        nodeId,
        type: 'input',
        name: 'V- (Black)',
        index: 1,
        offsetX: 2,
        offsetY: 44,
        value: false,
      });
      break;
    }

    case 'ELEC_AMMETER': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'A+ (In)',
        index: 0,
        offsetX: 2,
        offsetY: 32,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'A- (Out)',
        index: 0,
        offsetX: width - 2,
        offsetY: 32,
        value: false,
      });
      break;
    }

    case 'ELEC_OPAMP': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'V- (Inverting)',
        index: 0,
        offsetX: 2,
        offsetY: 22,
        value: false,
      });
      inputs.push({
        id: `${nodeId}_in_1`,
        nodeId,
        type: 'input',
        name: 'V+ (Non-inv)',
        index: 1,
        offsetX: 2,
        offsetY: 50,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'Vout',
        index: 0,
        offsetX: width - 2,
        offsetY: 36,
        value: false,
      });
      break;
    }

    case 'ELEC_TRANSFORMER': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'Pri 1',
        index: 0,
        offsetX: 2,
        offsetY: 18,
        value: false,
      });
      inputs.push({
        id: `${nodeId}_in_1`,
        nodeId,
        type: 'input',
        name: 'Pri 2',
        index: 1,
        offsetX: 2,
        offsetY: 50,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'Sec 1',
        index: 0,
        offsetX: width - 2,
        offsetY: 18,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_1`,
        nodeId,
        type: 'output',
        name: 'Sec 2',
        index: 1,
        offsetX: width - 2,
        offsetY: 50,
        value: false,
      });
      break;
    }

    case 'ELEC_FUSE': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'F1',
        index: 0,
        offsetX: 2,
        offsetY: 24,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'F2',
        index: 0,
        offsetX: width - 2,
        offsetY: 24,
        value: false,
      });
      break;
    }

    case 'ELEC_SPDT_SWITCH': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'COM',
        index: 0,
        offsetX: 2,
        offsetY: 28,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_0`,
        nodeId,
        type: 'output',
        name: 'A (Top)',
        index: 0,
        offsetX: width - 2,
        offsetY: 16,
        value: false,
      });
      outputs.push({
        id: `${nodeId}_out_1`,
        nodeId,
        type: 'output',
        name: 'B (Bottom)',
        index: 1,
        offsetX: width - 2,
        offsetY: 40,
        value: false,
      });
      break;
    }

    case 'ELEC_OHMMETER': {
      inputs.push({
        id: `${nodeId}_in_0`,
        nodeId,
        type: 'input',
        name: 'Lead 1 (Red)',
        index: 0,
        offsetX: 2,
        offsetY: 20,
        value: false,
      });
      inputs.push({
        id: `${nodeId}_in_1`,
        nodeId,
        type: 'input',
        name: 'Lead 2 (Black)',
        index: 1,
        offsetX: 2,
        offsetY: 44,
        value: false,
      });
      break;
    }
  }

  const defaultLabel = customLabel || type;

  return {
    id: nodeId,
    type,
    label: defaultLabel,
    x,
    y,
    width,
    height,
    inputs,
    outputs,
    state: {
      isOn: type === 'ELEC_BATTERY' ? true : false,
      frequencyHz: type === 'ELEC_AC_SOURCE' ? 60 : 1,
      color: type === 'ELEC_LED' ? '#10b981' : '#10b981',
      resistanceOhms: type === 'ELEC_RESISTOR' ? 1000 : type === 'ELEC_POTENTIOMETER' ? 10000 : undefined,
      capacitanceFarads: type === 'ELEC_CAPACITOR' ? 0.00001 : undefined,
      inductanceHenries: type === 'ELEC_INDUCTOR' ? 0.001 : undefined,
      voltageVolts: type === 'ELEC_BATTERY' ? 9 : type === 'ELEC_GROUND' ? 0 : type === 'ELEC_AC_SOURCE' ? 5 : undefined,
      forwardVoltageDrop: type === 'ELEC_DIODE' ? 0.7 : type === 'ELEC_ZENER' ? 0.7 : type === 'ELEC_LED' ? 2.0 : undefined,
      zenerBreakdownVoltage: type === 'ELEC_ZENER' ? 5.1 : undefined,
      isConducting: false,
      potentiometerRatio: 0.5,
      switchPosition: type === 'ELEC_SPDT_SWITCH' ? 'A' : undefined,
      fuseCurrentRating: type === 'ELEC_FUSE' ? 0.5 : undefined,
      isFuseBlown: false,
      transformerRatio: type === 'ELEC_TRANSFORMER' ? 0.5 : undefined,
      measuredValue:
        type === 'ELEC_VOLTMETER'
          ? '0.00 V'
          : type === 'ELEC_AMMETER'
          ? '0.0 mA'
          : type === 'ELEC_OHMMETER'
          ? '1.00 kΩ'
          : undefined,
      variableName:
        stateOverride?.variableName ||
        (type === 'SWITCH' || type === 'BUTTON'
          ? customLabel || 'A'
          : type === 'CLOCK'
          ? 'CLK'
          : type === 'HIGH_CONST'
          ? 'VCC'
          : type === 'LOW_CONST'
          ? 'GND'
          : type === 'ELEC_RESISTOR'
          ? 'R'
          : type === 'ELEC_CAPACITOR'
          ? 'C'
          : type === 'ELEC_INDUCTOR'
          ? 'L'
          : type === 'ELEC_DIODE'
          ? 'D'
          : type === 'ELEC_ZENER'
          ? 'ZD'
          : type === 'ELEC_LED'
          ? 'LED'
          : type === 'ELEC_BATTERY'
          ? 'V1'
          : type === 'ELEC_GROUND'
          ? 'GND'
          : type === 'ELEC_AC_SOURCE'
          ? 'AC'
          : type === 'ELEC_NPN'
          ? 'Q1'
          : type === 'ELEC_PNP'
          ? 'Q2'
          : type === 'ELEC_POTENTIOMETER'
          ? 'POT'
          : type === 'ELEC_SWITCH'
          ? 'SW'
          : type === 'ELEC_SPDT_SWITCH'
          ? 'SW2'
          : type === 'ELEC_FUSE'
          ? 'F1'
          : type === 'ELEC_TRANSFORMER'
          ? 'T1'
          : type === 'ELEC_OPAMP'
          ? 'U1'
          : type === 'ELEC_VOLTMETER'
          ? 'VM'
          : type === 'ELEC_AMMETER'
          ? 'AM'
          : type === 'ELEC_OHMMETER'
          ? 'OM'
          : ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER', 'TRI_STATE'].includes(type)
          ? 'Y'
          : ['D_FLIP_FLOP', 'JK_FLIP_FLOP', 'SR_FLIP_FLOP', 'T_FLIP_FLOP'].includes(type)
          ? 'Q'
          : type === 'HALF_ADDER' || type === 'FULL_ADDER'
          ? 'SUM'
          : type === 'MUX_2TO1' || type === 'DEMUX_1TO2'
          ? 'Y'
          : type === 'PROBE' || type === 'LED'
          ? customLabel || 'OUT'
          : type === 'SEVEN_SEG'
          ? 'HEX'
          : type === 'BUZZER'
          ? 'BUZZ'
          : undefined),
      ...stateOverride,
    },
  };
}

/**
 * Evaluates the circuit by propagating logic levels through wires and gates.
 * Uses an iterative fixed-point loop to handle sequential feedback (latches, oscillators).
 */
export function evaluateCircuit(
  nodes: CircuitNode[],
  wires: Wire[],
  timeMs: number = Date.now()
): { nodes: CircuitNode[]; wires: Wire[]; buzzerActive: boolean } {
  // Clone nodes and wires to preserve immutability
  const nodeMap = new Map<string, CircuitNode>();
  nodes.forEach((n) => {
    nodeMap.set(n.id, {
      ...n,
      inputs: n.inputs.map((p) => ({ ...p })),
      outputs: n.outputs.map((p) => ({ ...p })),
      state: { ...n.state },
    });
  });

  const updatedWires: Wire[] = wires.map((w) => ({ ...w }));

  // 1. Evaluate clock nodes based on current timestamp
  nodeMap.forEach((node) => {
    if (node.type === 'CLOCK') {
      const freq = node.state.frequencyHz || 1;
      const periodMs = 1000 / freq;
      const halfPeriod = periodMs / 2;
      const phase = timeMs % periodMs;
      const clkVal = phase < halfPeriod;
      if (node.outputs[0]) {
        node.outputs[0].value = clkVal;
      }
    } else if (node.type === 'SWITCH' || node.type === 'BUTTON') {
      if (node.outputs[0]) {
        node.outputs[0].value = Boolean(node.state.isOn);
      }
    } else if (node.type === 'HIGH_CONST') {
      if (node.outputs[0]) {
        node.outputs[0].value = true;
      }
    } else if (node.type === 'LOW_CONST') {
      if (node.outputs[0]) {
        node.outputs[0].value = false;
      }
    } else if (node.type === 'ELEC_BATTERY') {
      if (node.outputs[0]) {
        node.outputs[0].value = true;
      }
      if (node.inputs[0]) {
        node.inputs[0].value = false;
      }
    } else if (node.type === 'ELEC_GROUND') {
      if (node.inputs[0]) {
        node.inputs[0].value = false;
      }
    } else if (node.type === 'ELEC_AC_SOURCE') {
      const freq = node.state.frequencyHz || 60;
      const periodMs = 1000 / freq;
      const phase = (timeMs % periodMs) / periodMs;
      const acVal = Math.sin(phase * 2 * Math.PI) > 0;
      if (node.outputs[0]) {
        node.outputs[0].value = acVal;
      }
    }
  });

  // 2. Iterative relaxation solver (up to 12 passes for feedback loops)
  const MAX_PASSES = 12;
  let hasChanged = true;
  let pass = 0;

  while (hasChanged && pass < MAX_PASSES) {
    hasChanged = false;
    pass++;

    // Propagate output pin values through wires to input pins
    for (const wire of updatedWires) {
      const sourceNode = nodeMap.get(wire.fromNodeId);
      const targetNode = nodeMap.get(wire.toNodeId);
      if (!sourceNode || !targetNode) continue;

      const sourcePin = sourceNode.outputs.find((p) => p.id === wire.fromPinId);
      const targetPin = targetNode.inputs.find((p) => p.id === wire.toPinId);

      if (sourcePin && targetPin) {
        const sourceVal = sourcePin.value;
        wire.value = sourceVal;
        if (targetPin.value !== sourceVal) {
          targetPin.value = sourceVal;
          hasChanged = true;
        }
      }
    }

    // Evaluate logic gates based on current input values
    nodeMap.forEach((node) => {
      const inVals = node.inputs.map((p) => p.value);
      let outVal = false;

      switch (node.type) {
        case 'AND':
          outVal = inVals.length > 0 && inVals.every(Boolean);
          break;
        case 'OR':
          outVal = inVals.some(Boolean);
          break;
        case 'NOT':
          outVal = !inVals[0];
          break;
        case 'NAND':
          outVal = !(inVals.length > 0 && inVals.every(Boolean));
          break;
        case 'NOR':
          outVal = !inVals.some(Boolean);
          break;
        case 'XOR': {
          const trueCount = inVals.filter(Boolean).length;
          outVal = trueCount % 2 === 1;
          break;
        }
        case 'XNOR': {
          const trueCount = inVals.filter(Boolean).length;
          outVal = trueCount % 2 === 0;
          break;
        }
        case 'BUFFER':
          outVal = Boolean(inVals[0]);
          break;
        case 'TRI_STATE': {
          const inVal = Boolean(inVals[0]);
          const enVal = inVals[1] !== undefined ? Boolean(inVals[1]) : true;
          outVal = enVal ? inVal : false;
          break;
        }

        case 'HALF_ADDER': {
          const a = Boolean(inVals[0]);
          const b = Boolean(inVals[1]);
          const sum = a !== b;
          const carry = a && b;
          if (node.outputs[0] && node.outputs[0].value !== sum) {
            node.outputs[0].value = sum;
            hasChanged = true;
          }
          if (node.outputs[1] && node.outputs[1].value !== carry) {
            node.outputs[1].value = carry;
            hasChanged = true;
          }
          return;
        }

        case 'FULL_ADDER': {
          const a = Boolean(inVals[0]);
          const b = Boolean(inVals[1]);
          const cin = Boolean(inVals[2]);
          const sum = (a !== b) !== cin;
          const cout = (a && b) || (cin && (a !== b));
          if (node.outputs[0] && node.outputs[0].value !== sum) {
            node.outputs[0].value = sum;
            hasChanged = true;
          }
          if (node.outputs[1] && node.outputs[1].value !== cout) {
            node.outputs[1].value = cout;
            hasChanged = true;
          }
          return;
        }

        case 'MUX_2TO1': {
          const d0 = Boolean(inVals[0]);
          const d1 = Boolean(inVals[1]);
          const sel = Boolean(inVals[2]);
          const y = sel ? d1 : d0;
          if (node.outputs[0] && node.outputs[0].value !== y) {
            node.outputs[0].value = y;
            hasChanged = true;
          }
          return;
        }

        case 'DEMUX_1TO2': {
          const inputSig = Boolean(inVals[0]);
          const sel = Boolean(inVals[1]);
          const y0 = !sel ? inputSig : false;
          const y1 = sel ? inputSig : false;
          if (node.outputs[0] && node.outputs[0].value !== y0) {
            node.outputs[0].value = y0;
            hasChanged = true;
          }
          if (node.outputs[1] && node.outputs[1].value !== y1) {
            node.outputs[1].value = y1;
            hasChanged = true;
          }
          return;
        }

        case 'D_FLIP_FLOP': {
          const d = Boolean(inVals[0]);
          const clk = Boolean(inVals[1]);
          const isRisingEdge = clk && !node.state.prevClk;
          if (node.state.q === undefined) {
            node.state.q = false;
            node.state.qBar = true;
          }
          if (isRisingEdge) {
            node.state.q = d;
            node.state.qBar = !d;
          }
          if (node.outputs[0] && node.outputs[0].value !== node.state.q) {
            node.outputs[0].value = Boolean(node.state.q);
            hasChanged = true;
          }
          if (node.outputs[1] && node.outputs[1].value !== node.state.qBar) {
            node.outputs[1].value = Boolean(node.state.qBar);
            hasChanged = true;
          }
          return;
        }

        case 'T_FLIP_FLOP': {
          const t = Boolean(inVals[0]);
          const clk = Boolean(inVals[1]);
          const isRisingEdge = clk && !node.state.prevClk;
          if (node.state.q === undefined) {
            node.state.q = false;
            node.state.qBar = true;
          }
          if (isRisingEdge && t) {
            node.state.q = !node.state.q;
            node.state.qBar = !node.state.q;
          }
          if (node.outputs[0] && node.outputs[0].value !== node.state.q) {
            node.outputs[0].value = Boolean(node.state.q);
            hasChanged = true;
          }
          if (node.outputs[1] && node.outputs[1].value !== node.state.qBar) {
            node.outputs[1].value = Boolean(node.state.qBar);
            hasChanged = true;
          }
          return;
        }

        case 'JK_FLIP_FLOP': {
          const j = Boolean(inVals[0]);
          const clk = Boolean(inVals[1]);
          const k = Boolean(inVals[2]);
          const isRisingEdge = clk && !node.state.prevClk;
          if (node.state.q === undefined) {
            node.state.q = false;
            node.state.qBar = true;
          }
          if (isRisingEdge) {
            if (j && k) {
              node.state.q = !node.state.q;
            } else if (j) {
              node.state.q = true;
            } else if (k) {
              node.state.q = false;
            }
            node.state.qBar = !node.state.q;
          }
          if (node.outputs[0] && node.outputs[0].value !== node.state.q) {
            node.outputs[0].value = Boolean(node.state.q);
            hasChanged = true;
          }
          if (node.outputs[1] && node.outputs[1].value !== node.state.qBar) {
            node.outputs[1].value = Boolean(node.state.qBar);
            hasChanged = true;
          }
          return;
        }

        case 'SR_FLIP_FLOP': {
          const s = Boolean(inVals[0]);
          const clk = Boolean(inVals[1]);
          const r = Boolean(inVals[2]);
          const isRisingEdge = clk && !node.state.prevClk;
          if (node.state.q === undefined) {
            node.state.q = false;
            node.state.qBar = true;
          }
          if (isRisingEdge) {
            if (s && r) {
              node.state.q = false;
              node.state.qBar = false;
            } else if (s) {
              node.state.q = true;
              node.state.qBar = false;
            } else if (r) {
              node.state.q = false;
              node.state.qBar = true;
            } else {
              node.state.qBar = !node.state.q;
            }
          }
          if (node.outputs[0] && node.outputs[0].value !== node.state.q) {
            node.outputs[0].value = Boolean(node.state.q);
            hasChanged = true;
          }
          if (node.outputs[1] && node.outputs[1].value !== node.state.qBar) {
            node.outputs[1].value = Boolean(node.state.qBar);
            hasChanged = true;
          }
          return;
        }

        case 'SUBCIRCUIT':
        case 'SUB_CIRCUIT': {
          const subDef = node.state?.subCircuitDef;
          const internalNodesSource = node.state?.subCircuitInternalNodes || node.state?.subcircuitNodes;
          const internalWiresSource = node.state?.subCircuitInternalWires || node.state?.subcircuitWires || [];

          if (internalNodesSource && internalNodesSource.length > 0) {
            const internalNodes = internalNodesSource.map((n) => ({
              ...n,
              inputs: n.inputs.map((p) => ({ ...p })),
              outputs: n.outputs.map((p) => ({ ...p })),
              state: { ...n.state },
            }));
            const internalWires = internalWiresSource.map((w) => ({ ...w }));

            if (subDef && subDef.inputPins) {
              subDef.inputPins.forEach((inDef, idx) => {
                const extVal = Boolean(node.inputs[idx]?.value);
                const targetIntNodeId = `${node.id}_int_${inDef.internalNodeId}`;
                const tgt = internalNodes.find((n) => n.id === targetIntNodeId || n.id === inDef.internalNodeId);
                if (tgt) {
                  if (tgt.type === 'SWITCH' || tgt.type === 'BUTTON') {
                    tgt.state.isOn = extVal;
                    if (tgt.outputs[0]) tgt.outputs[0].value = extVal;
                  } else {
                    const inPin = tgt.inputs.find((p) => p.id === `${node.id}_int_${inDef.internalPinId}` || p.id === inDef.internalPinId);
                    if (inPin) inPin.value = extVal;
                  }
                }
              });
            } else if (node.state.subcircuitInputMap) {
              for (const mapping of node.state.subcircuitInputMap) {
                const extPin = node.inputs.find((p) => p.id === mapping.pinId);
                if (!extPin) continue;
                const tgt = internalNodes.find((n) => n.id === mapping.internalNodeId);
                if (!tgt) continue;
                if (tgt.type === 'SWITCH' || tgt.type === 'BUTTON') {
                  tgt.state.isOn = extPin.value;
                  if (tgt.outputs[0]) tgt.outputs[0].value = extPin.value;
                } else {
                  const inP = tgt.inputs.find((p) => p.id === mapping.internalPinId);
                  if (inP) inP.value = extPin.value;
                }
              }
            }

            const subResult = evaluateCircuit(internalNodes, internalWires, timeMs);

            if (subDef && subDef.outputPins) {
              subDef.outputPins.forEach((outDef, idx) => {
                const targetIntNodeId = `${node.id}_int_${outDef.internalNodeId}`;
                const src = subResult.nodes.find((n) => n.id === targetIntNodeId || n.id === outDef.internalNodeId);
                if (src) {
                  const outPin = src.outputs.find((p) => p.id === `${node.id}_int_${outDef.internalPinId}` || p.id === outDef.internalPinId);
                  const val = outPin ? outPin.value : false;
                  if (node.outputs[idx] && node.outputs[idx].value !== val) {
                    node.outputs[idx].value = val;
                    hasChanged = true;
                  }
                }
              });
            } else if (node.state.subcircuitOutputMap) {
              for (const mapping of node.state.subcircuitOutputMap) {
                const extPin = node.outputs.find((p) => p.id === mapping.pinId);
                if (!extPin) continue;
                const src = subResult.nodes.find((n) => n.id === mapping.internalNodeId);
                if (!src) continue;
                const outP = src.outputs.find((p) => p.id === mapping.internalPinId);
                const val = outP ? outP.value : false;
                if (extPin.value !== val) {
                  extPin.value = val;
                  hasChanged = true;
                }
              }
            }
          }
          return;
        }

        case 'ELEC_RESISTOR':
        case 'ELEC_CAPACITOR':
        case 'ELEC_INDUCTOR':
          outVal = Boolean(inVals[0]);
          break;

        case 'ELEC_DIODE':
        case 'ELEC_ZENER': {
          const conducting = Boolean(inVals[0]);
          node.state.isConducting = conducting;
          outVal = conducting;
          break;
        }

        case 'ELEC_LED': {
          const conducting = Boolean(inVals[0]);
          node.state.isConducting = conducting;
          node.state.isOn = conducting;
          outVal = conducting;
          break;
        }

        case 'ELEC_SWITCH': {
          outVal = node.state.isOn ? Boolean(inVals[0]) : false;
          break;
        }

        case 'ELEC_SPDT_SWITCH': {
          const comVal = Boolean(inVals[0]);
          const pos = node.state.switchPosition || 'A';
          const outA = pos === 'A' ? comVal : false;
          const outB = pos === 'B' ? comVal : false;
          if (node.outputs[0] && node.outputs[0].value !== outA) {
            node.outputs[0].value = outA;
            hasChanged = true;
          }
          if (node.outputs[1] && node.outputs[1].value !== outB) {
            node.outputs[1].value = outB;
            hasChanged = true;
          }
          return;
        }

        case 'ELEC_FUSE': {
          const inVal = Boolean(inVals[0]);
          outVal = node.state.isFuseBlown ? false : inVal;
          break;
        }

        case 'ELEC_OPAMP': {
          // inVals[0] = V- (Inverting), inVals[1] = V+ (Non-inverting)
          const vInv = Boolean(inVals[0]);
          const vNonInv = Boolean(inVals[1]);
          // Comparator behavior: V+ > V- => HIGH (Saturation)
          outVal = vNonInv && !vInv;
          break;
        }

        case 'ELEC_TRANSFORMER': {
          // Coupled transfer from Pri 1 to Sec 1
          outVal = Boolean(inVals[0]);
          if (node.outputs[1]) {
            node.outputs[1].value = false;
          }
          break;
        }

        case 'ELEC_POTENTIOMETER': {
          outVal = Boolean(inVals[0]);
          break;
        }

        case 'ELEC_NPN': {
          const isBaseHigh = Boolean(inVals[0]);
          node.state.isConducting = isBaseHigh;
          if (node.outputs[1] && node.outputs[1].value !== isBaseHigh) {
            node.outputs[1].value = isBaseHigh;
            hasChanged = true;
          }
          return;
        }

        case 'ELEC_PNP': {
          const isBaseLow = !Boolean(inVals[0]);
          node.state.isConducting = isBaseLow;
          if (node.outputs[1] && node.outputs[1].value !== isBaseLow) {
            node.outputs[1].value = isBaseLow;
            hasChanged = true;
          }
          return;
        }

        case 'ELEC_VOLTMETER': {
          const pos = Boolean(inVals[0]);
          const neg = Boolean(inVals[1]);
          if (pos && !neg) {
            node.state.measuredValue = '+5.00 V';
          } else if (!pos && neg) {
            node.state.measuredValue = '-5.00 V';
          } else {
            node.state.measuredValue = '0.00 V';
          }
          return;
        }

        case 'ELEC_AMMETER': {
          const inVal = Boolean(inVals[0]);
          node.state.measuredValue = inVal ? '25.0 mA' : '0.0 mA';
          outVal = inVal;
          break;
        }

        case 'ELEC_OHMMETER': {
          const in1 = Boolean(inVals[0]);
          const in2 = Boolean(inVals[1]);
          node.state.measuredValue = in1 || in2 ? '1.00 kΩ' : 'O.L. (Open)';
          return;
        }

        default:
          return;
      }

      if (node.outputs[0] && node.outputs[0].value !== outVal) {
        node.outputs[0].value = outVal;
        hasChanged = true;
      }
    });
  }

  // Update prevClk on sequential nodes for edge detection on the next simulation cycle
  nodeMap.forEach((node) => {
    if (
      node.type === 'D_FLIP_FLOP' ||
      node.type === 'T_FLIP_FLOP' ||
      node.type === 'JK_FLIP_FLOP' ||
      node.type === 'SR_FLIP_FLOP'
    ) {
      node.state.prevClk = Boolean(node.inputs[1]?.value);
    }
  });

  let buzzerActive = false;
    nodeMap.forEach((node) => {
      if (node.type === 'BUZZER' && node.inputs[0]?.value) {
        buzzerActive = true;
      }
    });

    const evaluatedNodes = Array.from(nodeMap.values());

    // 4. Compute symbolic Boolean algebra expressions for all pins, wires, and nodes
    try {
      const { nodeExpressions, wireExpressions } = computeCircuitExpressions(evaluatedNodes, updatedWires);

      updatedWires.forEach((w) => {
        w.expression = wireExpressions.get(w.id);
      });

      evaluatedNodes.forEach((node) => {
        const exprData = nodeExpressions.get(node.id);
        if (exprData) {
          node.inputs.forEach((pin, idx) => {
            pin.expression = exprData.inputs[idx];
          });
          node.outputs.forEach((pin, idx) => {
            pin.expression = exprData.outputs[idx];
          });
          if (exprData.outputs[0] !== undefined) {
            node.state.computedExpression = exprData.outputs[0];
          }
        }
      });
    } catch (e) {
      console.warn('Error evaluating symbolic expressions:', e);
    }

    return {
      nodes: evaluatedNodes,
      wires: updatedWires,
      buzzerActive,
    };
  }

/**
 * 7-Segment display decoder:
 * Takes 4 binary inputs (A: bit 0, B: bit 1, C: bit 2, D: bit 3)
 * Returns array of 7 segment booleans: [a, b, c, d, e, f, g] and hex character
 */
export function decodeSevenSegment(inputs: boolean[]): {
  segments: [boolean, boolean, boolean, boolean, boolean, boolean, boolean];
  hexChar: string;
} {
  const val =
    (inputs[0] ? 1 : 0) +
    (inputs[1] ? 2 : 0) +
    (inputs[2] ? 4 : 0) +
    (inputs[3] ? 8 : 0);

  const hexChar = val.toString(16).toUpperCase();

  // Segment mapping: a (top), b (top-right), c (bottom-right), d (bottom), e (bottom-left), f (top-left), g (center)
  const segmentTable: Record<number, [boolean, boolean, boolean, boolean, boolean, boolean, boolean]> = {
    0: [true, true, true, true, true, true, false],
    1: [false, true, true, false, false, false, false],
    2: [true, true, false, true, true, false, true],
    3: [true, true, true, true, false, false, true],
    4: [false, true, true, false, false, true, true],
    5: [true, false, true, true, false, true, true],
    6: [true, false, true, true, true, true, true],
    7: [true, true, true, false, false, false, false],
    8: [true, true, true, true, true, true, true],
    9: [true, true, true, true, false, true, true],
    10: [true, true, true, false, true, true, true], // A
    11: [false, false, true, true, true, true, true], // b
    12: [true, false, false, true, true, true, false], // C
    13: [false, true, true, true, true, false, true], // d
    14: [true, false, false, true, true, true, true], // E
    15: [true, false, false, false, true, true, true], // F
  };

  return {
    segments: segmentTable[val] || [false, false, false, false, false, false, false],
    hexChar,
  };
}

/**
 * Computes an automated Truth Table for the circuit.
 * Identifies primary user inputs (SWITCH, BUTTON) and outputs (LED, PROBE, BUZZER).
 */
export function generateTruthTable(
  nodes: CircuitNode[],
  wires: Wire[]
): { inputNames: string[]; outputNames: string[]; entries: TruthTableEntry[] } {
  const inputNodes = nodes.filter((n) => n.type === 'SWITCH' || n.type === 'BUTTON');
  const outputNodes = nodes.filter(
    (n) => n.type === 'LED' || n.type === 'PROBE' || n.type === 'BUZZER'
  );

  if (inputNodes.length === 0 || outputNodes.length === 0) {
    return { inputNames: [], outputNames: [], entries: [] };
  }

  // Cap inputs to 6 (64 combinations) to prevent browser stutter
  const selectedInputs = inputNodes.slice(0, 6);
  const totalCombinations = 1 << selectedInputs.length;
  const entries: TruthTableEntry[] = [];

  // Deduplicate names to guarantee uniqueness in headers and entry records
  const getUniqueNames = (itemNodes: CircuitNode[]) => {
    const labelCounts = new Map<string, number>();
    itemNodes.forEach((n) => {
      const lbl = n.state.variableName || n.label || n.type;
      labelCounts.set(lbl, (labelCounts.get(lbl) || 0) + 1);
    });

    const currentCounts = new Map<string, number>();
    return itemNodes.map((n) => {
      const lbl = n.state.variableName || n.label || n.type;
      if ((labelCounts.get(lbl) || 0) > 1) {
        const c = (currentCounts.get(lbl) || 0) + 1;
        currentCounts.set(lbl, c);
        return `${lbl} #${c}`;
      }
      return lbl;
    });
  };

  const inputNames = getUniqueNames(selectedInputs);
  const outputNames = getUniqueNames(outputNodes);

  for (let i = 0; i < totalCombinations; i++) {
    // Set inputs for this combination
    const simNodes = nodes.map((n) => {
      const inIdx = selectedInputs.findIndex((inp) => inp.id === n.id);
      if (inIdx !== -1) {
        const bitVal = Boolean((i >> (selectedInputs.length - 1 - inIdx)) & 1);
        return {
          ...n,
          state: { ...n.state, isOn: bitVal },
          outputs: n.outputs.map((p) => ({ ...p, value: bitVal })),
        };
      }
      return n;
    });

    const evaluated = evaluateCircuit(simNodes, wires, 0);

    const inputRow: Record<string, boolean> = {};
    selectedInputs.forEach((inp, idx) => {
      inputRow[inputNames[idx]] = Boolean((i >> (selectedInputs.length - 1 - idx)) & 1);
    });

    const outputRow: Record<string, boolean> = {};
    outputNodes.forEach((outNode, idx) => {
      const evaluatedOut = evaluated.nodes.find((n) => n.id === outNode.id);
      outputRow[outputNames[idx]] = evaluatedOut?.inputs[0]?.value ?? false;
    });

    entries.push({
      inputs: inputRow,
      outputs: outputRow,
    });
  }

  return { inputNames, outputNames, entries };
}
