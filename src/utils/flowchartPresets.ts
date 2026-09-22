import { Sheet, CircuitNode, Wire } from '../types';
import { createDefaultNode } from './circuitSolver';

/**
 * Creates built-in educational flowchart algorithm presets
 */
export function createFlowchartPresets(): Sheet[] {
  // 1. SUM OF 1 TO N (Accumulator Loop)
  const sheet1Nodes: CircuitNode[] = [];
  const sheet1Wires: Wire[] = [];

  const s1Start = createDefaultNode('FLOW_START', 240, 40, 'f1_start', {}, 'Start');
  const s1Init = createDefaultNode(
    'FLOW_PROCESS',
    235,
    140,
    'f1_init',
    { flowAction: 'N = 5, sum = 0, i = 1' },
    'N = 5, sum = 0, i = 1'
  );
  const s1Dec = createDefaultNode(
    'FLOW_DECISION',
    235,
    250,
    'f1_dec',
    { flowCondition: 'i <= N' },
    'i <= N ?'
  );
  const s1Step = createDefaultNode(
    'FLOW_PROCESS',
    460,
    258,
    'f1_step',
    { flowAction: 'sum = sum + i, i = i + 1' },
    'sum = sum + i, i = i + 1'
  );
  const s1Print = createDefaultNode(
    'FLOW_OUTPUT',
    235,
    390,
    'f1_print',
    { flowAction: 'Print "Sum = " + sum' },
    'Print "Sum = " + sum'
  );
  const s1End = createDefaultNode('FLOW_END', 240, 500, 'f1_end', {}, 'Stop / End');

  sheet1Nodes.push(s1Start, s1Init, s1Dec, s1Step, s1Print, s1End);

  // Wires:
  // Start -> Init
  sheet1Wires.push({
    id: 'f1_w1',
    fromNodeId: s1Start.id,
    fromPinId: s1Start.outputs[0].id,
    toNodeId: s1Init.id,
    toPinId: s1Init.inputs[0].id,
    value: true,
  });
  // Init -> Decision
  sheet1Wires.push({
    id: 'f1_w2',
    fromNodeId: s1Init.id,
    fromPinId: s1Init.outputs[0].id,
    toNodeId: s1Dec.id,
    toPinId: s1Dec.inputs[0].id,
    value: true,
  });
  // Decision (YES / True - pin 0) -> Step
  sheet1Wires.push({
    id: 'f1_w3',
    fromNodeId: s1Dec.id,
    fromPinId: s1Dec.outputs[0].id,
    toNodeId: s1Step.id,
    toPinId: s1Step.inputs[0].id,
    value: true,
  });
  // Step -> loops back to Decision
  sheet1Wires.push({
    id: 'f1_w4',
    fromNodeId: s1Step.id,
    fromPinId: s1Step.outputs[0].id,
    toNodeId: s1Dec.id,
    toPinId: s1Dec.inputs[0].id,
    value: true,
  });
  // Decision (NO / False - pin 1) -> Print
  sheet1Wires.push({
    id: 'f1_w5',
    fromNodeId: s1Dec.id,
    fromPinId: s1Dec.outputs[1].id,
    toNodeId: s1Print.id,
    toPinId: s1Print.inputs[0].id,
    value: false,
  });
  // Print -> End
  sheet1Wires.push({
    id: 'f1_w6',
    fromNodeId: s1Print.id,
    fromPinId: s1Print.outputs[0].id,
    toNodeId: s1End.id,
    toPinId: s1End.inputs[0].id,
    value: true,
  });

  const sheet1: Sheet = {
    id: 'flowchart_sheet_sum',
    name: 'Sum 1 to N Loop',
    circuitType: 'flowchart',
    nodes: sheet1Nodes,
    wires: sheet1Wires,
    pan: { x: 120, y: 40 },
    zoom: 1,
    updatedAt: Date.now(),
  };

  // 2. EVEN OR ODD NUMBER CHECKER
  const sheet2Nodes: CircuitNode[] = [];
  const sheet2Wires: Wire[] = [];

  const s2Start = createDefaultNode('FLOW_START', 240, 40, 'f2_start', {}, 'Start');
  const s2Input = createDefaultNode(
    'FLOW_INPUT',
    235,
    140,
    'f2_input',
    { flowVarName: 'num', flowValue: 14, flowPrompt: 'Enter an integer number:' },
    'Read num = 14'
  );
  const s2Dec = createDefaultNode(
    'FLOW_DECISION',
    235,
    250,
    'f2_dec',
    { flowCondition: 'num % 2 === 0' },
    'num % 2 == 0 ?'
  );
  const s2Even = createDefaultNode(
    'FLOW_OUTPUT',
    440,
    370,
    'f2_even',
    { flowAction: 'Print num + " is EVEN"' },
    'Print "num is EVEN"'
  );
  const s2Odd = createDefaultNode(
    'FLOW_OUTPUT',
    80,
    370,
    'f2_odd',
    { flowAction: 'Print num + " is ODD"' },
    'Print "num is ODD"'
  );
  const s2End = createDefaultNode('FLOW_END', 240, 490, 'f2_end', {}, 'Stop');

  sheet2Nodes.push(s2Start, s2Input, s2Dec, s2Even, s2Odd, s2End);

  sheet2Wires.push({
    id: 'f2_w1',
    fromNodeId: s2Start.id,
    fromPinId: s2Start.outputs[0].id,
    toNodeId: s2Input.id,
    toPinId: s2Input.inputs[0].id,
    value: true,
  });
  sheet2Wires.push({
    id: 'f2_w2',
    fromNodeId: s2Input.id,
    fromPinId: s2Input.outputs[0].id,
    toNodeId: s2Dec.id,
    toPinId: s2Dec.inputs[0].id,
    value: true,
  });
  // Decision YES -> Even
  sheet2Wires.push({
    id: 'f2_w3',
    fromNodeId: s2Dec.id,
    fromPinId: s2Dec.outputs[0].id,
    toNodeId: s2Even.id,
    toPinId: s2Even.inputs[0].id,
    value: true,
  });
  // Decision NO -> Odd
  sheet2Wires.push({
    id: 'f2_w4',
    fromNodeId: s2Dec.id,
    fromPinId: s2Dec.outputs[1].id,
    toNodeId: s2Odd.id,
    toPinId: s2Odd.inputs[0].id,
    value: false,
  });
  // Even -> End
  sheet2Wires.push({
    id: 'f2_w5',
    fromNodeId: s2Even.id,
    fromPinId: s2Even.outputs[0].id,
    toNodeId: s2End.id,
    toPinId: s2End.inputs[0].id,
    value: true,
  });
  // Odd -> End
  sheet2Wires.push({
    id: 'f2_w6',
    fromNodeId: s2Odd.id,
    fromPinId: s2Odd.outputs[0].id,
    toNodeId: s2End.id,
    toPinId: s2End.inputs[0].id,
    value: true,
  });

  const sheet2: Sheet = {
    id: 'flowchart_sheet_even_odd',
    name: 'Even or Odd Checker',
    circuitType: 'flowchart',
    nodes: sheet2Nodes,
    wires: sheet2Wires,
    pan: { x: 120, y: 40 },
    zoom: 1,
    updatedAt: Date.now(),
  };

  // 3. FACTORIAL CALCULATOR (N!)
  const sheet3Nodes: CircuitNode[] = [];
  const sheet3Wires: Wire[] = [];

  const s3Start = createDefaultNode('FLOW_START', 240, 40, 'f3_start', {}, 'Start');
  const s3Init = createDefaultNode(
    'FLOW_PROCESS',
    235,
    140,
    'f3_init',
    { flowAction: 'N = 5, fact = 1, i = 1' },
    'N = 5, fact = 1, i = 1'
  );
  const s3Dec = createDefaultNode(
    'FLOW_DECISION',
    235,
    250,
    'f3_dec',
    { flowCondition: 'i <= N' },
    'i <= N ?'
  );
  const s3Loop = createDefaultNode(
    'FLOW_PROCESS',
    460,
    258,
    'f3_loop',
    { flowAction: 'fact = fact * i, i = i + 1' },
    'fact = fact * i, i = i + 1'
  );
  const s3Out = createDefaultNode(
    'FLOW_OUTPUT',
    235,
    390,
    'f3_out',
    { flowAction: 'Print N + "! = " + fact' },
    'Print N + "! = " + fact'
  );
  const s3End = createDefaultNode('FLOW_END', 240, 500, 'f3_end', {}, 'Stop');

  sheet3Nodes.push(s3Start, s3Init, s3Dec, s3Loop, s3Out, s3End);

  sheet3Wires.push({
    id: 'f3_w1',
    fromNodeId: s3Start.id,
    fromPinId: s3Start.outputs[0].id,
    toNodeId: s3Init.id,
    toPinId: s3Init.inputs[0].id,
    value: true,
  });
  sheet3Wires.push({
    id: 'f3_w2',
    fromNodeId: s3Init.id,
    fromPinId: s3Init.outputs[0].id,
    toNodeId: s3Dec.id,
    toPinId: s3Dec.inputs[0].id,
    value: true,
  });
  sheet3Wires.push({
    id: 'f3_w3',
    fromNodeId: s3Dec.id,
    fromPinId: s3Dec.outputs[0].id,
    toNodeId: s3Loop.id,
    toPinId: s3Loop.inputs[0].id,
    value: true,
  });
  sheet3Wires.push({
    id: 'f3_w4',
    fromNodeId: s3Loop.id,
    fromPinId: s3Loop.outputs[0].id,
    toNodeId: s3Dec.id,
    toPinId: s3Dec.inputs[0].id,
    value: true,
  });
  sheet3Wires.push({
    id: 'f3_w5',
    fromNodeId: s3Dec.id,
    fromPinId: s3Dec.outputs[1].id,
    toNodeId: s3Out.id,
    toPinId: s3Out.inputs[0].id,
    value: false,
  });
  sheet3Wires.push({
    id: 'f3_w6',
    fromNodeId: s3Out.id,
    fromPinId: s3Out.outputs[0].id,
    toNodeId: s3End.id,
    toPinId: s3End.inputs[0].id,
    value: true,
  });

  const sheet3: Sheet = {
    id: 'flowchart_sheet_factorial',
    name: 'Factorial (N!) Calculator',
    circuitType: 'flowchart',
    nodes: sheet3Nodes,
    wires: sheet3Wires,
    pan: { x: 120, y: 40 },
    zoom: 1,
    updatedAt: Date.now(),
  };

  // 4. FIND MAXIMUM OF TWO NUMBERS
  const sheet4Nodes: CircuitNode[] = [];
  const sheet4Wires: Wire[] = [];

  const s4Start = createDefaultNode('FLOW_START', 240, 40, 'f4_start', {}, 'Start');
  const s4Init = createDefaultNode(
    'FLOW_PROCESS',
    235,
    140,
    'f4_init',
    { flowAction: 'A = 42, B = 79' },
    'A = 42, B = 79'
  );
  const s4Dec = createDefaultNode(
    'FLOW_DECISION',
    235,
    250,
    'f4_dec',
    { flowCondition: 'A > B' },
    'A > B ?'
  );
  const s4SetA = createDefaultNode(
    'FLOW_PROCESS',
    440,
    370,
    'f4_set_a',
    { flowAction: 'max = A' },
    'max = A'
  );
  const s4SetB = createDefaultNode(
    'FLOW_PROCESS',
    60,
    370,
    'f4_set_b',
    { flowAction: 'max = B' },
    'max = B'
  );
  const s4Print = createDefaultNode(
    'FLOW_OUTPUT',
    235,
    490,
    'f4_print',
    { flowAction: 'Print "Maximum value is: " + max' },
    'Print "Max is " + max'
  );
  const s4End = createDefaultNode('FLOW_END', 240, 600, 'f4_end', {}, 'Stop');

  sheet4Nodes.push(s4Start, s4Init, s4Dec, s4SetA, s4SetB, s4Print, s4End);

  sheet4Wires.push({
    id: 'f4_w1',
    fromNodeId: s4Start.id,
    fromPinId: s4Start.outputs[0].id,
    toNodeId: s4Init.id,
    toPinId: s4Init.inputs[0].id,
    value: true,
  });
  sheet4Wires.push({
    id: 'f4_w2',
    fromNodeId: s4Init.id,
    fromPinId: s4Init.outputs[0].id,
    toNodeId: s4Dec.id,
    toPinId: s4Dec.inputs[0].id,
    value: true,
  });
  sheet4Wires.push({
    id: 'f4_w3',
    fromNodeId: s4Dec.id,
    fromPinId: s4Dec.outputs[0].id,
    toNodeId: s4SetA.id,
    toPinId: s4SetA.inputs[0].id,
    value: true,
  });
  sheet4Wires.push({
    id: 'f4_w4',
    fromNodeId: s4Dec.id,
    fromPinId: s4Dec.outputs[1].id,
    toNodeId: s4SetB.id,
    toPinId: s4SetB.inputs[0].id,
    value: false,
  });
  sheet4Wires.push({
    id: 'f4_w5',
    fromNodeId: s4SetA.id,
    fromPinId: s4SetA.outputs[0].id,
    toNodeId: s4Print.id,
    toPinId: s4Print.inputs[0].id,
    value: true,
  });
  sheet4Wires.push({
    id: 'f4_w6',
    fromNodeId: s4SetB.id,
    fromPinId: s4SetB.outputs[0].id,
    toNodeId: s4Print.id,
    toPinId: s4Print.inputs[0].id,
    value: true,
  });
  sheet4Wires.push({
    id: 'f4_w7',
    fromNodeId: s4Print.id,
    fromPinId: s4Print.outputs[0].id,
    toNodeId: s4End.id,
    toPinId: s4End.inputs[0].id,
    value: true,
  });

  const sheet4: Sheet = {
    id: 'flowchart_sheet_max',
    name: 'Find Maximum (A or B)',
    circuitType: 'flowchart',
    nodes: sheet4Nodes,
    wires: sheet4Wires,
    pan: { x: 120, y: 40 },
    zoom: 1,
    updatedAt: Date.now(),
  };

  return [sheet1, sheet2, sheet3, sheet4];
}
