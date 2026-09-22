import React, { useRef, useState } from 'react';
import { CircuitNode, Pin } from '../types';
import { GateSymbol } from './GateSymbols';
import { getComponentVariableDisplay, formatUserVariableInput } from '../utils/booleanAlgebra';
import { Pencil, Check } from 'lucide-react';

interface NodeComponentProps {
  node: CircuitNode;
  isSelected: boolean;
  theme?: 'dark' | 'light';
  showVariables?: boolean;
  onSelect: (nodeId: string, e: React.MouseEvent | React.TouchEvent) => void;
  onInspect?: (nodeId: string) => void;
  onContextMenuNode?: (nodeId: string, clientX: number, clientY: number) => void;
  onDelete: (nodeId: string) => void;
  onStartWire: (pin: Pin, e: React.MouseEvent | React.TouchEvent) => void;
  onEndWire: (pin: Pin, e: React.MouseEvent | React.TouchEvent) => void;
  onToggleSwitch?: (nodeId: string) => void;
  onButtonPress?: (nodeId: string, pressed: boolean) => void;
  onUpdateState?: (nodeId: string, newState: Partial<CircuitNode['state']>) => void;
  onUpdateLabel?: (nodeId: string, newLabel: string) => void;
}

const NodeComponentBase: React.FC<NodeComponentProps> = ({
  node,
  isSelected,
  theme = 'light',
  showVariables = true,
  onSelect,
  onInspect,
  onContextMenuNode,
  onStartWire,
  onEndWire,
  onToggleSwitch,
  onButtonPress,
  onUpdateState,
  onUpdateLabel,
}) => {
  const lastTouchTimeRef = useRef<number>(0);
  const isOutputActive = Boolean(node.outputs[0]?.value);
  const inputValues = node.inputs.map((p) => p.value);
  const isDark = theme === 'dark';

  // Determine if the component is actively energized / lit
  const isLit =
    node.type === 'HIGH_CONST'
      ? true
      : node.type === 'LOW_CONST'
      ? false
      : node.type === 'SWITCH' || node.type === 'BUTTON' || node.type === 'ELEC_SWITCH' || node.type === 'ELEC_BATTERY'
      ? Boolean(node.state?.isOn)
      : node.type === 'LED' || node.type === 'PROBE' || node.type === 'BUZZER' || node.type === 'ELEC_LED'
      ? Boolean(node.inputs[0]?.value)
      : Boolean(node.outputs[0]?.value);

  // Inline variable editing state
  const [isEditingVar, setIsEditingVar] = useState(false);
  const [editingVarText, setEditingVarText] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const varInfo = getComponentVariableDisplay(node);

  const startEditing = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setEditingVarText(node.state.variableName || varInfo.varName);
    setIsEditingVar(true);
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 50);
  };

  const handleSaveVar = () => {
    const trimmed = editingVarText.trim();
    if (trimmed) {
      const formatted = formatUserVariableInput(trimmed);
      if (formatted !== node.state.variableName) {
        onUpdateState?.(node.id, { variableName: formatted });
        onUpdateLabel?.(node.id, formatted);
      }
    }
    setIsEditingVar(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      handleSaveVar();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setIsEditingVar(false);
    }
  };

  // Render Pin Terminal Point
  const renderPin = (pin: Pin) => {
    const isHigh = pin.value;
    return (
      <div
        key={pin.id}
        className="absolute group z-30 pointer-events-auto cursor-crosshair"
        style={{
          left: `${pin.offsetX}px`,
          top: `${pin.offsetY}px`,
          transform: 'translate(-50%, -50%)',
        }}
        title={`${pin.name}: ${isHigh ? '1' : '0'}${pin.expression ? ` (${pin.expression})` : ''}`}
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartWire(pin, e);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          onStartWire(pin, e);
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          onEndWire(pin, e);
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          onEndWire(pin, e);
        }}
      >
        {/* Generous 24px hit area for easy click/drag */}
        <div className="w-6 h-6 -ml-3 -mt-3 absolute flex items-center justify-center">
          <div
            className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 group-hover:scale-125 ${
              isHigh
                ? 'bg-sky-400 border-sky-600'
                : 'bg-white border-slate-900 group-hover:border-sky-500'
            }`}
          />
        </div>

        {/* Pin Tooltip */}
        <div className="hidden group-hover:flex absolute -top-7 left-1/2 -translate-x-1/2 items-center gap-1 text-[9px] font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 text-white pointer-events-none z-40 whitespace-nowrap shadow-lg">
          <span className="font-bold text-sky-400">{pin.name}</span>:
          <span className={isHigh ? 'text-sky-300 font-bold' : 'text-slate-400'}>
            {isHigh ? '1' : '0'}
          </span>
          {pin.expression && (
            <span className="text-emerald-300 font-mono pl-1 border-l border-slate-700">
              {pin.expression}
            </span>
          )}
        </div>
      </div>
    );
  };

  const handleComponentClick = (e: React.MouseEvent) => {
    if (node.type === 'SWITCH' || node.type === 'ELEC_SWITCH') {
      e.stopPropagation();
      onToggleSwitch?.(node.id);
    } else if (node.type === 'ELEC_SPDT_SWITCH') {
      e.stopPropagation();
      const currentPos = node.state?.switchPosition || 'A';
      onUpdateState?.(node.id, { switchPosition: currentPos === 'A' ? 'B' : 'A' });
    } else if (node.type === 'ELEC_FUSE') {
      e.stopPropagation();
      onUpdateState?.(node.id, { isFuseBlown: !node.state?.isFuseBlown });
    }
  };

  return (
    <div
      id={`node-${node.id}`}
      className={`absolute select-none cursor-move transition-all duration-150 group/node ${
        isSelected ? 'z-20' : 'z-10'
      }`}
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: `${node.width}px`,
        height: `${node.height}px`,
        touchAction: 'none',
        outline: isSelected
          ? isDark
            ? '2px solid #38bdf8'
            : '2px solid #0284c7'
          : 'none',
        outlineOffset: '4px',
        boxShadow: isSelected
          ? isDark
            ? '0 2px 6px rgba(0, 0, 0, 0.35)'
            : '0 2px 6px rgba(15, 23, 42, 0.12)'
          : undefined,
        borderRadius: '6px',
        filter: isLit
          ? isDark
            ? 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.45))'
            : 'drop-shadow(0 0 5px rgba(2, 132, 199, 0.4))'
          : 'none',
      }}
      onMouseDown={(e) => {
        // Desktop left-click selects
        if (e.button === 0) {
          e.stopPropagation();
          onSelect(node.id, e);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect(node.id, e);
        if (onContextMenuNode) {
          onContextMenuNode(node.id, e.clientX, e.clientY);
        } else {
          onInspect?.(node.id);
        }
      }}
      onDoubleClick={(e) => {
        // Double-click opens inspector
        e.stopPropagation();
        onSelect(node.id, e);
        onInspect?.(node.id);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        const now = Date.now();
        // Mobile double-tap opens inspector
        if (now - lastTouchTimeRef.current < 320) {
          onSelect(node.id, e);
          onInspect?.(node.id);
        } else {
          onSelect(node.id, e);
        }
        lastTouchTimeRef.current = now;
      }}
      onClick={handleComponentClick}
    >
      {/* Variable Display Above Any Type of Component */}
      {showVariables && (
        <div
          className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center justify-center whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          {isEditingVar ? (
            <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-0.5 rounded-full border border-sky-400 shadow-sm text-xs animate-in zoom-in-95 duration-100">
              <input
                ref={editInputRef}
                type="text"
                value={editingVarText}
                onChange={(e) => setEditingVarText(e.target.value)}
                onBlur={handleSaveVar}
                onKeyDown={handleKeyDown}
                maxLength={12}
                className="w-16 bg-transparent text-center font-mono font-bold text-sky-300 text-xs focus:outline-none"
                placeholder="Var"
              />
              <button
                type="button"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleSaveVar();
                }}
                className="text-emerald-400 hover:text-emerald-300 transition-colors p-0.5"
                title="Save variable"
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <div
              className={`group/var flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold transition-all duration-150 cursor-pointer select-none ${
                isDark
                  ? isSelected
                    ? 'bg-slate-900 border-sky-400 text-sky-200 ring-1 ring-sky-500'
                    : 'bg-slate-900/95 border-slate-700/80 text-slate-200 hover:border-sky-400 hover:bg-slate-800'
                  : isSelected
                  ? 'bg-sky-50 border-sky-500 text-sky-950 ring-1 ring-sky-400'
                  : 'bg-white/95 border-slate-300 text-slate-800 hover:border-sky-500 hover:bg-sky-50/60'
              }`}
              title={varInfo.tooltip}
              onClick={startEditing}
              onDoubleClick={startEditing}
            >
              {/* Active signal indicator dot */}
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  varInfo.isHigh
                    ? 'bg-sky-400'
                    : 'bg-slate-400/60'
                }`}
              />

              {/* Variable Display Text */}
              <span className="tracking-tight max-w-35 truncate">
                {varInfo.badgeText}
              </span>

              {/* Edit Pencil Icon on Hover */}
              <span className="opacity-0 group-hover/var:opacity-100 transition-opacity text-slate-400 hover:text-sky-400 pl-0.5">
                <Pencil size={9} />
              </span>
            </div>
          )}
        </div>
      )}

      {/* Component Vector Graphic */}
      <div
        className="w-full h-full flex items-center justify-center pointer-events-auto"
        onMouseDown={(e) => {
          if (node.type === 'BUTTON') {
            e.stopPropagation();
            onButtonPress?.(node.id, true);
          }
        }}
        onMouseUp={(e) => {
          if (node.type === 'BUTTON') {
            e.stopPropagation();
            onButtonPress?.(node.id, false);
          }
        }}
        onTouchStart={(e) => {
          if (node.type === 'BUTTON') {
            e.stopPropagation();
            onButtonPress?.(node.id, true);
          }
        }}
        onTouchEnd={(e) => {
          if (node.type === 'BUTTON') {
            e.stopPropagation();
            onButtonPress?.(node.id, false);
          }
        }}
      >
        <GateSymbol
          type={node.type}
          width={node.width}
          height={node.height}
          isActive={isOutputActive}
          state={node.state}
          inputs={inputValues}
          theme={theme}
        />
      </div>

      {/* Terminal Pins */}
      {node.inputs.map((pin) => renderPin(pin))}
      {node.outputs.map((pin) => renderPin(pin))}
    </div>
  );
};

export const NodeComponent = React.memo(NodeComponentBase);

