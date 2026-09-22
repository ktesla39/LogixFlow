import { Sheet, CircuitNode, Wire } from '../types';
import { createDefaultNode } from './circuitSolver';

/**
 * Creates built-in educational and practical Electric Circuit presets
 */
export function createElectricPresets(): Sheet[] {
  // 1. PRECISION VOLTAGE DIVIDER & POTENTIOMETER
  const sheet1Nodes: CircuitNode[] = [];
  const sheet1Wires: Wire[] = [];

  const e1Batt = createDefaultNode('ELEC_BATTERY', 120, 140, 'e1_batt', { voltageVolts: 9 }, '9V Battery');
  const e1Sw = createDefaultNode('ELEC_SWITCH', 260, 140, 'e1_sw', { isOn: true }, 'Main Power Switch');
  const e1R1 = createDefaultNode('ELEC_RESISTOR', 420, 100, 'e1_r1', { resistanceOhms: 1000 }, 'R1 (1kΩ)');
  const e1R2 = createDefaultNode('ELEC_RESISTOR', 420, 240, 'e1_r2', { resistanceOhms: 2000 }, 'R2 (2kΩ)');
  const e1Gnd = createDefaultNode('ELEC_GROUND', 420, 370, 'e1_gnd', {}, 'GND (0V)');
  const e1Vm = createDefaultNode('ELEC_VOLTMETER', 620, 170, 'e1_vm', {}, 'Vout Probe (6.00V)');

  sheet1Nodes.push(e1Batt, e1Sw, e1R1, e1R2, e1Gnd, e1Vm);

  // Wires:
  sheet1Wires.push(
    { id: 'w_e1_1', fromNodeId: e1Batt.id, fromPinId: e1Batt.outputs[0].id, toNodeId: e1Sw.id, toPinId: e1Sw.inputs[0].id, value: true },
    { id: 'w_e1_2', fromNodeId: e1Sw.id, fromPinId: e1Sw.outputs[0].id, toNodeId: e1R1.id, toPinId: e1R1.inputs[0].id, value: true },
    { id: 'w_e1_3', fromNodeId: e1R1.id, fromPinId: e1R1.outputs[0].id, toNodeId: e1R2.id, toPinId: e1R2.inputs[0].id, value: true },
    { id: 'w_e1_4', fromNodeId: e1R1.id, fromPinId: e1R1.outputs[0].id, toNodeId: e1Vm.id, toPinId: e1Vm.inputs[0].id, value: true },
    { id: 'w_e1_5', fromNodeId: e1R2.id, fromPinId: e1R2.outputs[0].id, toNodeId: e1Gnd.id, toPinId: e1Gnd.inputs[0].id, value: false }
  );

  // 2. RC LOW-PASS FILTER & TIMING CIRCUIT
  const sheet2Nodes: CircuitNode[] = [];
  const sheet2Wires: Wire[] = [];

  const e2Src = createDefaultNode('ELEC_AC_SOURCE', 120, 160, 'e2_src', {}, 'AC / Pulse Source');
  const e2Sw = createDefaultNode('ELEC_SWITCH', 260, 160, 'e2_sw', { isOn: true }, 'Input Enable');
  const e2R = createDefaultNode('ELEC_RESISTOR', 420, 160, 'e2_r', { resistanceOhms: 1000 }, 'R (1kΩ)');
  const e2C = createDefaultNode('ELEC_CAPACITOR', 580, 240, 'e2_c', { capacitanceFarads: 0.00001 }, 'C (10µF Filter)');
  const e2Gnd = createDefaultNode('ELEC_GROUND', 580, 360, 'e2_gnd', {}, 'GND');
  const e2Vm = createDefaultNode('ELEC_VOLTMETER', 720, 160, 'e2_vm', {}, 'Filtered Output V(t)');

  sheet2Nodes.push(e2Src, e2Sw, e2R, e2C, e2Gnd, e2Vm);

  sheet2Wires.push(
    { id: 'w_e2_1', fromNodeId: e2Src.id, fromPinId: e2Src.outputs[0].id, toNodeId: e2Sw.id, toPinId: e2Sw.inputs[0].id, value: true },
    { id: 'w_e2_2', fromNodeId: e2Sw.id, fromPinId: e2Sw.outputs[0].id, toNodeId: e2R.id, toPinId: e2R.inputs[0].id, value: true },
    { id: 'w_e2_3', fromNodeId: e2R.id, fromPinId: e2R.outputs[0].id, toNodeId: e2C.id, toPinId: e2C.inputs[0].id, value: true },
    { id: 'w_e2_4', fromNodeId: e2R.id, fromPinId: e2R.outputs[0].id, toNodeId: e2Vm.id, toPinId: e2Vm.inputs[0].id, value: true },
    { id: 'w_e2_5', fromNodeId: e2C.id, fromPinId: e2C.outputs[0].id, toNodeId: e2Gnd.id, toPinId: e2Gnd.inputs[0].id, value: false }
  );

  // 3. BJT NPN TRANSISTOR SWITCH & LED DRIVER
  const sheet3Nodes: CircuitNode[] = [];
  const sheet3Wires: Wire[] = [];

  const e3Vcc = createDefaultNode('ELEC_BATTERY', 120, 80, 'e3_vcc', { voltageVolts: 5 }, 'VCC (+5V)');
  const e3Led = createDefaultNode('ELEC_LED', 360, 80, 'e3_led', { isOn: true }, 'High-Intensity LED');
  const e3Rc = createDefaultNode('ELEC_RESISTOR', 520, 80, 'e3_rc', { resistanceOhms: 330 }, 'Rc (330Ω)');
  const e3Npn = createDefaultNode('ELEC_NPN', 520, 220, 'e3_npn', {}, '2N3904 NPN');
  const e3Ctrl = createDefaultNode('ELEC_SWITCH', 120, 240, 'e3_ctrl', { isOn: true }, 'Base Control (Logic High)');
  const e3Rb = createDefaultNode('ELEC_RESISTOR', 300, 240, 'e3_rb', { resistanceOhms: 4700 }, 'Rb (4.7kΩ Base)');
  const e3Gnd = createDefaultNode('ELEC_GROUND', 520, 360, 'e3_gnd', {}, 'GND (0V)');

  sheet3Nodes.push(e3Vcc, e3Led, e3Rc, e3Npn, e3Ctrl, e3Rb, e3Gnd);

  sheet3Wires.push(
    { id: 'w_e3_1', fromNodeId: e3Vcc.id, fromPinId: e3Vcc.outputs[0].id, toNodeId: e3Led.id, toPinId: e3Led.inputs[0].id, value: true },
    { id: 'w_e3_2', fromNodeId: e3Led.id, fromPinId: e3Led.outputs[0].id, toNodeId: e3Rc.id, toPinId: e3Rc.inputs[0].id, value: true },
    { id: 'w_e3_3', fromNodeId: e3Rc.id, fromPinId: e3Rc.outputs[0].id, toNodeId: e3Npn.id, toPinId: e3Npn.inputs[0].id, value: true },
    { id: 'w_e3_4', fromNodeId: e3Ctrl.id, fromPinId: e3Ctrl.outputs[0].id, toNodeId: e3Rb.id, toPinId: e3Rb.inputs[0].id, value: true },
    { id: 'w_e3_5', fromNodeId: e3Rb.id, fromPinId: e3Rb.outputs[0].id, toNodeId: e3Npn.id, toPinId: e3Npn.inputs[0].id, value: true },
    { id: 'w_e3_6', fromNodeId: e3Npn.id, fromPinId: e3Npn.outputs[0].id, toNodeId: e3Gnd.id, toPinId: e3Gnd.inputs[0].id, value: false }
  );

  // 4. FULL-WAVE BRIDGE RECTIFIER
  const sheet4Nodes: CircuitNode[] = [];
  const sheet4Wires: Wire[] = [];

  const e4Ac = createDefaultNode('ELEC_AC_SOURCE', 120, 180, 'e4_ac', {}, 'AC 12V 60Hz Source');
  const e4D1 = createDefaultNode('ELEC_DIODE', 320, 100, 'e4_d1', {}, '1N4007 Diode D1');
  const e4D2 = createDefaultNode('ELEC_DIODE', 320, 260, 'e4_d2', {}, '1N4007 Diode D2');
  const e4Cap = createDefaultNode('ELEC_CAPACITOR', 520, 180, 'e4_cap', { capacitanceFarads: 0.0001 }, 'Filter Cap 100µF');
  const e4Load = createDefaultNode('ELEC_RESISTOR', 680, 180, 'e4_load', { resistanceOhms: 1000 }, 'DC Load R (1kΩ)');
  const e4Vm = createDefaultNode('ELEC_VOLTMETER', 840, 180, 'e4_vm', {}, 'Rectified DC Output');
  const e4Gnd = createDefaultNode('ELEC_GROUND', 680, 340, 'e4_gnd', {}, 'GND');

  sheet4Nodes.push(e4Ac, e4D1, e4D2, e4Cap, e4Load, e4Vm, e4Gnd);

  sheet4Wires.push(
    { id: 'w_e4_1', fromNodeId: e4Ac.id, fromPinId: e4Ac.outputs[0].id, toNodeId: e4D1.id, toPinId: e4D1.inputs[0].id, value: true },
    { id: 'w_e4_2', fromNodeId: e4Ac.id, fromPinId: e4Ac.outputs[0].id, toNodeId: e4D2.id, toPinId: e4D2.inputs[0].id, value: true },
    { id: 'w_e4_3', fromNodeId: e4D1.id, fromPinId: e4D1.outputs[0].id, toNodeId: e4Cap.id, toPinId: e4Cap.inputs[0].id, value: true },
    { id: 'w_e4_4', fromNodeId: e4Cap.id, fromPinId: e4Cap.outputs[0].id, toNodeId: e4Load.id, toPinId: e4Load.inputs[0].id, value: true },
    { id: 'w_e4_5', fromNodeId: e4Load.id, fromPinId: e4Load.outputs[0].id, toNodeId: e4Vm.id, toPinId: e4Vm.inputs[0].id, value: true },
    { id: 'w_e4_6', fromNodeId: e4Load.id, fromPinId: e4Load.outputs[0].id, toNodeId: e4Gnd.id, toPinId: e4Gnd.inputs[0].id, value: false }
  );

  // 5. ZENER DIODE VOLTAGE CLAMPING REGULATOR
  const sheet5Nodes: CircuitNode[] = [];
  const sheet5Wires: Wire[] = [];

  const e5Vin = createDefaultNode('ELEC_BATTERY', 120, 160, 'e5_vin', { voltageVolts: 12 }, 'Unregulated Vin (12V)');
  const e5Sw = createDefaultNode('ELEC_SWITCH', 260, 160, 'e5_sw', { isOn: true }, 'Supply Switch');
  const e5Rs = createDefaultNode('ELEC_RESISTOR', 420, 160, 'e5_rs', { resistanceOhms: 470 }, 'Current Limiting Rs (470Ω)');
  const e5Zener = createDefaultNode('ELEC_ZENER', 580, 250, 'e5_zener', {}, '5.1V Zener Diode (Reverse Bias)');
  const e5Vm = createDefaultNode('ELEC_VOLTMETER', 740, 160, 'e5_vm', {}, 'Stabilized Vz (5.10V)');
  const e5Gnd = createDefaultNode('ELEC_GROUND', 580, 370, 'e5_gnd', {}, 'GND Reference');

  sheet5Nodes.push(e5Vin, e5Sw, e5Rs, e5Zener, e5Vm, e5Gnd);

  sheet5Wires.push(
    { id: 'w_e5_1', fromNodeId: e5Vin.id, fromPinId: e5Vin.outputs[0].id, toNodeId: e5Sw.id, toPinId: e5Sw.inputs[0].id, value: true },
    { id: 'w_e5_2', fromNodeId: e5Sw.id, fromPinId: e5Sw.outputs[0].id, toNodeId: e5Rs.id, toPinId: e5Rs.inputs[0].id, value: true },
    { id: 'w_e5_3', fromNodeId: e5Rs.id, fromPinId: e5Rs.outputs[0].id, toNodeId: e5Zener.id, toPinId: e5Zener.inputs[0].id, value: true },
    { id: 'w_e5_4', fromNodeId: e5Rs.id, fromPinId: e5Rs.outputs[0].id, toNodeId: e5Vm.id, toPinId: e5Vm.inputs[0].id, value: true },
    { id: 'w_e5_5', fromNodeId: e5Zener.id, fromPinId: e5Zener.outputs[0].id, toNodeId: e5Gnd.id, toPinId: e5Gnd.inputs[0].id, value: false }
  );

  return [
    {
      id: 'electric_sheet_voltage_divider',
      name: 'Voltage Divider & Potentiometer',
      circuitType: 'electric',
      nodes: sheet1Nodes,
      wires: sheet1Wires,
      pan: { x: 40, y: 60 },
      zoom: 1,
      updatedAt: Date.now(),
    },
    {
      id: 'electric_sheet_rc_filter',
      name: 'RC Low-Pass Filter & Integrator',
      circuitType: 'electric',
      nodes: sheet2Nodes,
      wires: sheet2Wires,
      pan: { x: 40, y: 60 },
      zoom: 1,
      updatedAt: Date.now(),
    },
    {
      id: 'electric_sheet_npn_switch',
      name: 'BJT NPN Transistor Switch & Driver',
      circuitType: 'electric',
      nodes: sheet3Nodes,
      wires: sheet3Wires,
      pan: { x: 40, y: 60 },
      zoom: 1,
      updatedAt: Date.now(),
    },
    {
      id: 'electric_sheet_bridge_rectifier',
      name: 'Full-Wave Bridge Rectifier & Filter',
      circuitType: 'electric',
      nodes: sheet4Nodes,
      wires: sheet4Wires,
      pan: { x: 40, y: 60 },
      zoom: 1,
      updatedAt: Date.now(),
    },
    {
      id: 'electric_sheet_zener_regulator',
      name: 'Zener Diode Voltage Regulator',
      circuitType: 'electric',
      nodes: sheet5Nodes,
      wires: sheet5Wires,
      pan: { x: 40, y: 60 },
      zoom: 1,
      updatedAt: Date.now(),
    },
  ];
}
