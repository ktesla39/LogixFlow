import { CircuitNode, Pin, Wire, SubCircuitDefinition } from '../types';

/**
 * Creates a SubCircuitDefinition from a list of selected nodes and existing wires.
 */
export function createSubCircuitDefinitionFromSelection(
  name: string,
  selectedNodes: CircuitNode[],
  existingWires: Wire[]
): SubCircuitDefinition {
  const selectedNodeIdSet = new Set(selectedNodes.map((n) => n.id));

  // Internal wires are wires where both ends are in the selection
  const internalWires: Wire[] = existingWires.filter(
    (w) => selectedNodeIdSet.has(w.fromNodeId) && selectedNodeIdSet.has(w.toNodeId)
  );

  // External input pins: selected node input pins that receive a wire from outside the selection,
  // or inputs of switches/constants/drivers inside the selection.
  // Also collect all unconnected input pins inside the selection as external inputs.
  const externalInputs: {
    pinName: string;
    internalNodeId: string;
    internalPinId: string;
    variableName?: string;
  }[] = [];

  const externalOutputs: {
    pinName: string;
    internalNodeId: string;
    internalPinId: string;
    variableName?: string;
  }[] = [];

  const usedInPinIds = new Set<string>();
  const usedOutPinIds = new Set<string>();

  // 1. Check wires crossing the boundary
  for (const wire of existingWires) {
    const isFromInside = selectedNodeIdSet.has(wire.fromNodeId);
    const isToInside = selectedNodeIdSet.has(wire.toNodeId);

    // Wire coming from OUTSIDE into an INSIDE node input
    if (!isFromInside && isToInside) {
      if (!usedInPinIds.has(wire.toPinId)) {
        usedInPinIds.add(wire.toPinId);
        const targetNode = selectedNodes.find((n) => n.id === wire.toNodeId);
        const targetPin = targetNode?.inputs.find((p) => p.id === wire.toPinId);
        const pinName = targetNode?.state?.variableName || targetPin?.name || `IN${externalInputs.length + 1}`;
        externalInputs.push({
          pinName,
          internalNodeId: wire.toNodeId,
          internalPinId: wire.toPinId,
          variableName: targetNode?.state?.variableName,
        });
      }
    }

    // Wire going from INSIDE node output to OUTSIDE
    if (isFromInside && !isToInside) {
      if (!usedOutPinIds.has(wire.fromPinId)) {
        usedOutPinIds.add(wire.fromPinId);
        const srcNode = selectedNodes.find((n) => n.id === wire.fromNodeId);
        const srcPin = srcNode?.outputs.find((p) => p.id === wire.fromPinId);
        const pinName = srcNode?.state?.variableName || srcPin?.name || `OUT${externalOutputs.length + 1}`;
        externalOutputs.push({
          pinName,
          internalNodeId: wire.fromNodeId,
          internalPinId: wire.fromPinId,
          variableName: srcNode?.state?.variableName,
        });
      }
    }
  }

  // 2. Unconnected inputs inside selection:
  // If there are input pins of gates/blocks not fed by internal wires, expose them as inputs!
  const internallyDrivenInputs = new Set(internalWires.map((w) => w.toPinId));
  for (const node of selectedNodes) {
    // If node is a switch or button, expose its output as an input or output depending on structure
    if (node.type === 'SWITCH' || node.type === 'BUTTON' || node.type === 'HIGH_CONST' || node.type === 'LOW_CONST') {
      const outPin = node.outputs[0];
      if (outPin && !usedInPinIds.has(outPin.id) && !internallyDrivenInputs.has(outPin.id)) {
        // Switch/Button acts as user-configurable input terminal of the subcircuit!
        usedInPinIds.add(outPin.id);
        const varName = node.state?.variableName || node.label || `IN${externalInputs.length + 1}`;
        externalInputs.push({
          pinName: varName,
          internalNodeId: node.id,
          internalPinId: outPin.id,
          variableName: varName,
        });
      }
    } else {
      for (const inPin of node.inputs) {
        if (!internallyDrivenInputs.has(inPin.id) && !usedInPinIds.has(inPin.id)) {
          usedInPinIds.add(inPin.id);
          const varName = node.state?.variableName ? `${node.state.variableName}_${inPin.name}` : inPin.name;
          externalInputs.push({
            pinName: varName,
            internalNodeId: node.id,
            internalPinId: inPin.id,
            variableName: node.state?.variableName,
          });
        }
      }
    }

    // 3. For probes, LEDs, buzzers inside selection: expose them as external outputs!
    if (node.type === 'PROBE' || node.type === 'LED' || node.type === 'SEVEN_SEG' || node.type === 'BUZZER') {
      const inPin = node.inputs[0];
      if (inPin && !usedOutPinIds.has(inPin.id)) {
        usedOutPinIds.add(inPin.id);
        const varName = node.state?.variableName || node.label || `OUT${externalOutputs.length + 1}`;
        externalOutputs.push({
          pinName: varName,
          internalNodeId: node.id,
          internalPinId: inPin.id,
          variableName: varName,
        });
      }
    }
  }

  // If still no outputs found, expose the output of the rightmost node in the selection
  if (externalOutputs.length === 0) {
    const sortedByX = [...selectedNodes].sort((a, b) => b.x - a.x);
    for (const node of sortedByX) {
      if (node.outputs.length > 0) {
        for (const outPin of node.outputs) {
          if (!usedOutPinIds.has(outPin.id)) {
            usedOutPinIds.add(outPin.id);
            externalOutputs.push({
              pinName: node.state?.variableName || outPin.name || 'OUT',
              internalNodeId: node.id,
              internalPinId: outPin.id,
              variableName: node.state?.variableName,
            });
          }
        }
        break;
      }
    }
  }

  // Clone nodes and internal wires with relative coordinates (origin at selection top-left)
  const minX = Math.min(...selectedNodes.map((n) => n.x));
  const minY = Math.min(...selectedNodes.map((n) => n.y));

  const clonedInternalNodes: CircuitNode[] = selectedNodes.map((n) => ({
    ...n,
    x: n.x - minX,
    y: n.y - minY,
    inputs: n.inputs.map((p) => ({ ...p })),
    outputs: n.outputs.map((p) => ({ ...p })),
    state: { ...n.state },
  }));

  const clonedInternalWires: Wire[] = internalWires.map((w) => ({ ...w }));

  return {
    id: `subdef_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    description: `Sub-circuit composed of ${selectedNodes.length} components (${selectedNodes.map((n) => n.type).join(', ')})`,
    inputPins: externalInputs,
    outputPins: externalOutputs,
    internalNodes: clonedInternalNodes,
    internalWires: clonedInternalWires,
    color: '#0284c7',
    createdAt: Date.now(),
  };
}

/**
 * Creates a SUB_CIRCUIT CircuitNode instance from a SubCircuitDefinition.
 */
export function createSubCircuitNodeInstance(
  def: SubCircuitDefinition,
  x: number,
  y: number,
  customNodeId?: string
): CircuitNode {
  const nodeId = customNodeId || `node_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const inputCount = Math.max(def.inputPins.length, 1);
  const outputCount = Math.max(def.outputPins.length, 1);
  const pinMax = Math.max(inputCount, outputCount);

  // Height scales with the number of terminal pins
  const pinSpacing = 24;
  const height = Math.max(72, (pinMax + 1) * pinSpacing);
  const width = Math.max(120, Math.min(180, def.name.length * 10 + 40));

  const inputs: Pin[] = def.inputPins.map((inDef: { pinName: string }, idx: number) => {
    const offsetY = ((idx + 1) * height) / (inputCount + 1);
    return {
      id: `${nodeId}_in_${idx}`,
      nodeId,
      type: 'input',
      name: inDef.pinName,
      index: idx,
      offsetX: 2,
      offsetY: Math.round(offsetY),
      value: false,
    };
  });

  const outputs: Pin[] = def.outputPins.map((outDef: { pinName: string }, idx: number) => {
    const offsetY = ((idx + 1) * height) / (outputCount + 1);
    return {
      id: `${nodeId}_out_${idx}`,
      nodeId,
      type: 'output',
      name: outDef.pinName,
      index: idx,
      offsetX: width - 2,
      offsetY: Math.round(offsetY),
      value: false,
    };
  });

  // Deep clone internal nodes & wires for independent state simulation per instance
  const instanceNodes: CircuitNode[] = def.internalNodes.map((n: CircuitNode) => ({
    ...n,
    id: `${nodeId}_int_${n.id}`,
    inputs: n.inputs.map((p: Pin) => ({
      ...p,
      id: `${nodeId}_int_${p.id}`,
      nodeId: `${nodeId}_int_${n.id}`,
    })),
    outputs: n.outputs.map((p: Pin) => ({
      ...p,
      id: `${nodeId}_int_${p.id}`,
      nodeId: `${nodeId}_int_${n.id}`,
    })),
    state: { ...n.state },
  }));

  const instanceWires: Wire[] = def.internalWires.map((w: Wire) => ({
    ...w,
    id: `${nodeId}_int_${w.id}`,
    fromNodeId: `${nodeId}_int_${w.fromNodeId}`,
    fromPinId: `${nodeId}_int_${w.fromPinId}`,
    toNodeId: `${nodeId}_int_${w.toNodeId}`,
    toPinId: `${nodeId}_int_${w.toPinId}`,
  }));

  return {
    id: nodeId,
    type: 'SUB_CIRCUIT',
    label: def.name,
    x,
    y,
    width,
    height,
    inputs,
    outputs,
    state: {
      subCircuitDefId: def.id,
      subCircuitName: def.name,
      subCircuitDef: def,
      variableName: def.name,
      customLabel: def.name,
      subCircuitInternalNodes: instanceNodes,
      subCircuitInternalWires: instanceWires,
      isCollapsed: true,
      color: def.color || '#0284c7',
    },
  };
}
