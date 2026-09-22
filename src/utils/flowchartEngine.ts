import { CircuitNode, Wire } from '../types';

export interface FlowchartLogEntry {
  id: string;
  timestamp: number;
  stepNumber: number;
  type: 'info' | 'output' | 'input' | 'decision' | 'error' | 'success';
  message: string;
  nodeId?: string;
  nodeLabel?: string;
}

export interface FlowchartExecutionState {
  currentNodeId: string | null;
  activeNodeId?: string | null;
  status: 'idle' | 'running' | 'paused' | 'waiting_input' | 'completed' | 'error';
  variables: Record<string, number | string | boolean>;
  logs: FlowchartLogEntry[];
  stepCount: number;
  waitingInput?: {
    nodeId: string;
    varName: string;
    prompt: string;
  };
  errorMsg?: string;
}

/**
 * Safely evaluates mathematical / boolean expressions within the variables environment
 */
export function safeEvaluateExpression(
  rawExpr: string,
  vars: Record<string, any>
): any {
  if (!rawExpr || !rawExpr.trim()) return 0;
  const expr = rawExpr.trim();

  // Handle direct literals
  if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
  if (expr.toLowerCase() === 'true') return true;
  if (expr.toLowerCase() === 'false') return false;
  if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
    return expr.slice(1, -1);
  }

  // If matches exact variable name
  if (Object.prototype.hasOwnProperty.call(vars, expr)) {
    return vars[expr];
  }

  // Create sanitized evaluation scope
  try {
    const scopeKeys = Object.keys(vars).filter((k) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k));
    const scopeVals = scopeKeys.map((k) => vars[k]);

    // Built-in safe math tools
    const safeMath = {
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      abs: Math.abs,
      min: Math.min,
      max: Math.max,
      sqrt: Math.sqrt,
      pow: Math.pow,
    };

    // Sanitize expression against dangerous keywords
    if (/import|require|process|window|document|eval|Function|globalThis/i.test(expr)) {
      throw new Error('Forbidden identifier in expression');
    }

    // Replace single = with === for condition expressions like (x = 5)
    let sanitizedExpr = expr;
    // Don't replace if it's already == or === or <= or >= or !=
    // But if someone wrote: x = 5 in a condition diamond
    if (!/(=={1,2}|<=|>=|!=|\+=|-=|\*=)/.test(sanitizedExpr) && /(^|[^=<>!])=([^=])/.test(sanitizedExpr)) {
      sanitizedExpr = sanitizedExpr.replace(/([^=<>!])=([^=])/g, '$1===$2');
    }

    const evaluator = new Function(
      'Math',
      ...scopeKeys,
      `"use strict"; return (${sanitizedExpr});`
    );

    return evaluator(safeMath, ...scopeVals);
  } catch (err: any) {
    console.warn('Flowchart expression evaluation error:', expr, err);
    // Fallback: check if variable or string
    if (Object.prototype.hasOwnProperty.call(vars, expr)) {
      return vars[expr];
    }
    return expr;
  }
}

/**
 * Executes one or more assignment statements (e.g. "sum = 0, i = 1" or "count++")
 */
export function executeAssignments(
  statements: string,
  vars: Record<string, any>
): Record<string, any> {
  const newVars = { ...vars };
  if (!statements || !statements.trim()) return newVars;

  // Split multiple assignments by comma or semicolon
  const parts = statements
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const part of parts) {
    // 1. Postfix increment / decrement (e.g. i++, count--)
    const incMatch = part.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(\+\+|--)$/);
    if (incMatch) {
      const varName = incMatch[1];
      const current = Number(newVars[varName] ?? 0);
      newVars[varName] = incMatch[2] === '++' ? current + 1 : current - 1;
      continue;
    }

    // 2. Compound assignment (e.g. sum += i, fact *= n)
    const compoundMatch = part.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(\+=|-=|\*=|\/=|%=)\s*(.+)$/);
    if (compoundMatch) {
      const varName = compoundMatch[1];
      const op = compoundMatch[2];
      const rhsExpr = compoundMatch[3];
      const rhsVal = safeEvaluateExpression(rhsExpr, newVars);
      const current = Number(newVars[varName] ?? 0);

      switch (op) {
        case '+=':
          newVars[varName] = current + rhsVal;
          break;
        case '-=':
          newVars[varName] = current - rhsVal;
          break;
        case '*=':
          newVars[varName] = current * rhsVal;
          break;
        case '/=':
          newVars[varName] = rhsVal !== 0 ? current / rhsVal : 0;
          break;
        case '%=':
          newVars[varName] = rhsVal !== 0 ? current % rhsVal : 0;
          break;
      }
      continue;
    }

    // 3. Standard assignment (e.g. x = x + 1, sum = 0, name = "Logix")
    const assignMatch = part.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+)$/);
    if (assignMatch) {
      const varName = assignMatch[1];
      const rhsExpr = assignMatch[2];
      newVars[varName] = safeEvaluateExpression(rhsExpr, newVars);
      continue;
    }

    // 4. Expression without explicit assignment: if valid identifier, initialize to 0
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(part)) {
      if (newVars[part] === undefined) {
        newVars[part] = 0;
      }
    }
  }

  return newVars;
}

/**
 * Initializes clean execution state starting at the FLOW_START node
 */
export function initFlowchartExecution(nodes: CircuitNode[]): FlowchartExecutionState {
  const startNode = nodes.find((n) => n.type === 'FLOW_START');

  return {
    currentNodeId: startNode ? startNode.id : null,
    status: startNode ? 'idle' : 'error',
    variables: {},
    logs: [
      {
        id: `log_${Date.now()}_0`,
        timestamp: Date.now(),
        stepNumber: 0,
        type: startNode ? 'info' : 'error',
        message: startNode
          ? `Algorithm initialized with start terminal "${startNode.label || 'Start'}". Ready to run or step.`
          : 'No "Start" terminal found. Add a Start block from the Algorithm palette to begin.',
        nodeId: startNode?.id,
        nodeLabel: startNode?.label || 'Start',
      },
    ],
    stepCount: 0,
    errorMsg: startNode ? undefined : 'No Start block found in flowchart.',
  };
}

/**
 * Steps the flowchart forward by one instruction block
 */
export function stepFlowchartExecution(
  nodes: CircuitNode[],
  wires: Wire[],
  currentState: FlowchartExecutionState,
  providedInput?: string | number
): FlowchartExecutionState {
  const nodeMap = new Map<string, CircuitNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const state: FlowchartExecutionState = {
    ...currentState,
    variables: { ...currentState.variables },
    logs: [...currentState.logs],
  };

  // If idle or without current node, initialize at start
  if (state.status === 'idle' || !state.currentNodeId) {
    const startNode = nodes.find((n) => n.type === 'FLOW_START');
    if (!startNode) {
      state.status = 'error';
      state.errorMsg = 'Cannot run: No Start Terminal found.';
      state.logs.push({
        id: `log_${Date.now()}_err`,
        timestamp: Date.now(),
        stepNumber: state.stepCount,
        type: 'error',
        message: 'No Start terminal found.',
      });
      return state;
    }
    state.currentNodeId = startNode.id;
    state.status = 'running';
  }

  const currentNode = nodeMap.get(state.currentNodeId);
  if (!currentNode) {
    state.status = 'error';
    state.errorMsg = `Node ${state.currentNodeId} not found in circuit.`;
    return state;
  }

  state.stepCount += 1;
  const currentStep = state.stepCount;

  // 1. FLOW_START
  if (currentNode.type === 'FLOW_START') {
    state.logs.push({
      id: `log_${Date.now()}_${currentStep}`,
      timestamp: Date.now(),
      stepNumber: currentStep,
      type: 'info',
      message: `▶ Execution started at [${currentNode.label || 'Start'}]`,
      nodeId: currentNode.id,
      nodeLabel: currentNode.label,
    });

    const nextWire = wires.find((w) => w.fromNodeId === currentNode.id);
    if (!nextWire) {
      state.status = 'completed';
      state.logs.push({
        id: `log_${Date.now()}_end`,
        timestamp: Date.now(),
        stepNumber: currentStep,
        type: 'info',
        message: 'Start block has no outgoing wire connected.',
      });
      state.currentNodeId = null;
      return state;
    }
    state.currentNodeId = nextWire.toNodeId;
    return state;
  }

  // 2. FLOW_PROCESS
  if (currentNode.type === 'FLOW_PROCESS') {
    const actionText = currentNode.state?.flowAction || currentNode.label || '';
    const beforeVars = { ...state.variables };
    state.variables = executeAssignments(actionText, state.variables);

    // Compute diff of modified variables for friendly log display
    const changed = Object.keys(state.variables).filter(
      (k) => state.variables[k] !== beforeVars[k]
    );
    const diffStr =
      changed.length > 0
        ? ` (${changed.map((k) => `${k} = ${state.variables[k]}`).join(', ')})`
        : '';

    state.logs.push({
      id: `log_${Date.now()}_${currentStep}`,
      timestamp: Date.now(),
      stepNumber: currentStep,
      type: 'info',
      message: `⚙️ Process: ${actionText}${diffStr}`,
      nodeId: currentNode.id,
      nodeLabel: currentNode.label,
    });

    const nextWire = wires.find((w) => w.fromNodeId === currentNode.id);
    if (!nextWire) {
      state.status = 'completed';
      state.logs.push({
        id: `log_${Date.now()}_end`,
        timestamp: Date.now(),
        stepNumber: currentStep,
        type: 'info',
        message: 'Flow ended: Process has no outgoing connection.',
      });
      state.currentNodeId = null;
      return state;
    }
    state.currentNodeId = nextWire.toNodeId;
    return state;
  }

  // 3. FLOW_INPUT (Read Data)
  if (currentNode.type === 'FLOW_INPUT') {
    const rawText = currentNode.state?.flowAction || currentNode.label || 'Read X';
    // Extract variable name from "Read N", "Input count", or custom state
    let varName = currentNode.state?.flowVarName;
    if (!varName) {
      const match = rawText.match(/(?:Read|Input|Get)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/i);
      varName = match ? match[1] : rawText.trim() || 'inputVal';
    }

    // Check if input was provided this turn
    if (providedInput !== undefined && providedInput !== null && providedInput !== '') {
      const parsed = isNaN(Number(providedInput)) ? String(providedInput) : Number(providedInput);
      state.variables[varName] = parsed;
      state.waitingInput = undefined;

      state.logs.push({
        id: `log_${Date.now()}_${currentStep}`,
        timestamp: Date.now(),
        stepNumber: currentStep,
        type: 'input',
        message: `📥 Input received: ${varName} = ${parsed}`,
        nodeId: currentNode.id,
        nodeLabel: currentNode.label,
      });

      const nextWire = wires.find((w) => w.fromNodeId === currentNode.id);
      if (!nextWire) {
        state.status = 'completed';
        state.currentNodeId = null;
        return state;
      }
      state.currentNodeId = nextWire.toNodeId;
      return state;
    }

    // Check if pre-configured default value in node state exists
    if (currentNode.state?.flowValue !== undefined && currentNode.state.flowValue !== '') {
      const parsed = isNaN(Number(currentNode.state.flowValue))
        ? String(currentNode.state.flowValue)
        : Number(currentNode.state.flowValue);
      state.variables[varName] = parsed;

      state.logs.push({
        id: `log_${Date.now()}_${currentStep}`,
        timestamp: Date.now(),
        stepNumber: currentStep,
        type: 'input',
        message: `📥 Input read default: ${varName} = ${parsed}`,
        nodeId: currentNode.id,
        nodeLabel: currentNode.label,
      });

      const nextWire = wires.find((w) => w.fromNodeId === currentNode.id);
      if (!nextWire) {
        state.status = 'completed';
        state.currentNodeId = null;
        return state;
      }
      state.currentNodeId = nextWire.toNodeId;
      return state;
    }

    // Pause and request user input in UI
    state.status = 'waiting_input';
    state.waitingInput = {
      nodeId: currentNode.id,
      varName,
      prompt: currentNode.state?.flowPrompt || `Enter value for ${varName}:`,
    };
    state.logs.push({
      id: `log_${Date.now()}_${currentStep}`,
      timestamp: Date.now(),
      stepNumber: currentStep,
      type: 'input',
      message: `⏳ Waiting for user input: ${varName}...`,
      nodeId: currentNode.id,
      nodeLabel: currentNode.label,
    });
    return state;
  }

  // 4. FLOW_OUTPUT (Print / Display)
  if (currentNode.type === 'FLOW_OUTPUT') {
    const rawText = currentNode.state?.flowAction || currentNode.label || 'Print result';
    // Clean prefix like "Print ", "Output ", "Display "
    const exprText = rawText.replace(/^(?:Print|Output|Display|Show)\s+/i, '').trim();

    const outputVal = safeEvaluateExpression(exprText, state.variables);

    state.logs.push({
      id: `log_${Date.now()}_${currentStep}`,
      timestamp: Date.now(),
      stepNumber: currentStep,
      type: 'output',
      message: `📤 Output: ${outputVal}`,
      nodeId: currentNode.id,
      nodeLabel: currentNode.label,
    });

    const nextWire = wires.find((w) => w.fromNodeId === currentNode.id);
    if (!nextWire) {
      state.status = 'completed';
      state.logs.push({
        id: `log_${Date.now()}_end`,
        timestamp: Date.now(),
        stepNumber: currentStep,
        type: 'info',
        message: 'Flow ended: Output block has no outgoing connection.',
      });
      state.currentNodeId = null;
      return state;
    }
    state.currentNodeId = nextWire.toNodeId;
    return state;
  }

  // 5. FLOW_DECISION (Condition Branching)
  if (currentNode.type === 'FLOW_DECISION') {
    const condText = currentNode.state?.flowCondition || currentNode.label || 'x > 0';
    // Strip trailing '?' if written as "i <= N?"
    const cleanCond = condText.replace(/\?+$/, '').trim();
    const result = Boolean(safeEvaluateExpression(cleanCond, state.variables));

    state.logs.push({
      id: `log_${Date.now()}_${currentStep}`,
      timestamp: Date.now(),
      stepNumber: currentStep,
      type: 'decision',
      message: `🔀 Decision: (${cleanCond}) evaluated to ${result ? 'TRUE (YES)' : 'FALSE (NO)'}`,
      nodeId: currentNode.id,
      nodeLabel: currentNode.label,
    });

    // Find outgoing wire: pin 0 is YES / TRUE, pin 1 is NO / FALSE
    const yesPin = currentNode.outputs[0];
    const noPin = currentNode.outputs[1];

    let targetWire: Wire | undefined;
    if (result) {
      targetWire = wires.find(
        (w) => w.fromNodeId === currentNode.id && (!yesPin || w.fromPinId === yesPin.id)
      );
    } else {
      targetWire = wires.find(
        (w) => w.fromNodeId === currentNode.id && (!noPin || w.fromPinId === noPin.id)
      );
    }

    // Fallback: if only one wire connected, follow it
    if (!targetWire) {
      const anyWire = wires.find((w) => w.fromNodeId === currentNode.id);
      if (anyWire) {
        targetWire = anyWire;
      }
    }

    if (!targetWire) {
      state.status = 'completed';
      state.logs.push({
        id: `log_${Date.now()}_end`,
        timestamp: Date.now(),
        stepNumber: currentStep,
        type: 'info',
        message: `Branch ${result ? 'YES' : 'NO'} has no outgoing wire connected. Program stopped.`,
      });
      state.currentNodeId = null;
      return state;
    }

    state.currentNodeId = targetWire.toNodeId;
    return state;
  }

  // 6. FLOW_CONNECTOR (Junction)
  if (currentNode.type === 'FLOW_CONNECTOR') {
    const nextWire = wires.find((w) => w.fromNodeId === currentNode.id);
    if (!nextWire) {
      state.status = 'completed';
      state.currentNodeId = null;
      return state;
    }
    state.currentNodeId = nextWire.toNodeId;
    return state;
  }

  // 7. FLOW_SUBROUTINE
  if (currentNode.type === 'FLOW_SUBROUTINE') {
    state.logs.push({
      id: `log_${Date.now()}_${currentStep}`,
      timestamp: Date.now(),
      stepNumber: currentStep,
      type: 'info',
      message: `📦 Subroutine executed: ${currentNode.label || 'Subroutine'}`,
      nodeId: currentNode.id,
      nodeLabel: currentNode.label,
    });

    const nextWire = wires.find((w) => w.fromNodeId === currentNode.id);
    if (!nextWire) {
      state.status = 'completed';
      state.currentNodeId = null;
      return state;
    }
    state.currentNodeId = nextWire.toNodeId;
    return state;
  }

  // 8. FLOW_END (Stop)
  if (currentNode.type === 'FLOW_END') {
    state.status = 'completed';
    const finalVarsStr = Object.entries(state.variables)
      .map(([k, v]) => `${k} = ${v}`)
      .join(', ');

    state.logs.push({
      id: `log_${Date.now()}_${currentStep}`,
      timestamp: Date.now(),
      stepNumber: currentStep,
      type: 'success',
      message: `🏁 Program completed successfully! Final State: { ${finalVarsStr || 'no variables'} }`,
      nodeId: currentNode.id,
      nodeLabel: currentNode.label,
    });
    state.currentNodeId = currentNode.id;
    return state;
  }

  // Default fallback for any unhandled node
  const defaultWire = wires.find((w) => w.fromNodeId === currentNode.id);
  if (defaultWire) {
    state.currentNodeId = defaultWire.toNodeId;
  } else {
    state.status = 'completed';
    state.currentNodeId = null;
  }
  return state;
}

/**
 * Initializes a new flowchart execution state for a set of nodes
 */
export function initFlowchartState(nodes?: CircuitNode[]): FlowchartExecutionState {
  const startNode = nodes?.find((n) => n.type === 'FLOW_START');
  const initialId = startNode ? startNode.id : null;
  return {
    currentNodeId: initialId,
    activeNodeId: initialId,
    status: 'idle',
    variables: {},
    logs: [
      {
        id: `log_init_${Date.now()}`,
        timestamp: Date.now(),
        stepNumber: 0,
        type: 'info',
        message: 'Algorithm initialized. Press Step or Run to begin execution.',
      },
    ],
    stepCount: 0,
  };
}

/**
 * Convenience wrapper for stepping the flowchart engine
 */
export function stepFlowchart(
  nodes: CircuitNode[],
  wires: Wire[],
  currentState: FlowchartExecutionState,
  providedInput?: string | number
): FlowchartExecutionState {
  const next = stepFlowchartExecution(nodes, wires, currentState, providedInput);
  next.activeNodeId = next.currentNodeId;
  return next;
}

