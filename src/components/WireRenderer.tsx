import React from 'react';
import { CircuitNode, DraggingWire, Wire } from '../types';

interface WireRendererProps {
  wires: Wire[];
  nodes: CircuitNode[];
  selectedWireId: string | null;
  draggingWire: DraggingWire | null;
  wireStyle: 'curved' | 'orthogonal';
  theme?: 'dark' | 'light';
  showWireExpressions?: boolean;
  onSelectWire: (wireId: string | null) => void;
  onDeleteWire: (wireId: string) => void;
  onDoubleClickWire?: (wireId: string) => void;
  onContextMenuWire?: (wireId: string, clientX: number, clientY: number) => void;
  editingWireId?: string | null;
}

// Compute smooth filleted orthogonal path
function computeOrthogonalPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;

  // Straight horizontal connection
  if (Math.abs(dy) < 2) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  // Standard forward left-to-right routing with smooth rounded corners
  if (dx >= 20) {
    const midX = Math.round(x1 + dx / 2);
    const r = Math.min(8, Math.abs(dx) / 2, Math.abs(dy) / 2);
    const s = dy > 0 ? 1 : -1;

    if (r < 2) {
      return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
    }

    return [
      `M ${x1} ${y1}`,
      `L ${midX - r} ${y1}`,
      `Q ${midX} ${y1} ${midX} ${y1 + s * r}`,
      `L ${midX} ${y2 - s * r}`,
      `Q ${midX} ${y2} ${midX + r} ${y2}`,
      `L ${x2} ${y2}`,
    ].join(' ');
  }

  // Reverse / feedback loop routing
  const clearDist = 24;
  const r = 6;
  const outX = x1 + clearDist;
  const inX = x2 - clearDist;
  const corridorY = dy >= 0 ? Math.min(y1, y2) - 36 : Math.max(y1, y2) + 36;
  const sOut = corridorY > y1 ? 1 : -1;
  const sIn = y2 > corridorY ? 1 : -1;

  return [
    `M ${x1} ${y1}`,
    `L ${outX - r} ${y1}`,
    `Q ${outX} ${y1} ${outX} ${y1 + sOut * r}`,
    `L ${outX} ${corridorY - sOut * r}`,
    `Q ${outX} ${corridorY} ${outX - r} ${corridorY}`,
    `L ${inX + r} ${corridorY}`,
    `Q ${inX} ${corridorY} ${inX} ${corridorY + sIn * r}`,
    `L ${inX} ${y2 - sIn * r}`,
    `Q ${inX} ${y2} ${inX + r} ${y2}`,
    `L ${x2} ${y2}`,
  ].join(' ');
}

// Compute smooth natural bezier curve
function computeCurvedPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  if (dx >= 20) {
    const cp = Math.max(35, Math.min(160, dx * 0.5));
    return `M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`;
  }
  // Reverse / feedback curve
  const loopOffset = Math.max(50, Math.min(180, Math.abs(dx) * 0.6 + 40));
  return `M ${x1} ${y1} C ${x1 + loopOffset} ${y1}, ${x2 - loopOffset} ${y2}, ${x2} ${y2}`;
}

const WireRendererBase: React.FC<WireRendererProps> = ({
  wires,
  nodes,
  selectedWireId,
  draggingWire,
  wireStyle,
  theme = 'light',
  showWireExpressions = false,
  onSelectWire,
  onDeleteWire,
  onDoubleClickWire,
  onContextMenuWire,
  editingWireId,
}) => {
  // Fast node lookup
  const nodeMap = React.useMemo(() => {
    const map = new Map<string, CircuitNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const computePath = (x1: number, y1: number, x2: number, y2: number) => {
    if (wireStyle === 'curved') {
      return computeCurvedPath(x1, y1, x2, y2);
    }
    return computeOrthogonalPath(x1, y1, x2, y2);
  };

  const isDark = theme === 'dark';
  const highColor = isDark ? '#38bdf8' : '#0284c7';
  const lowColor = isDark ? '#64748b' : '#475569';
  const selectedColor = '#0ea5e9';

  return (
    <g className="wires-layer pointer-events-auto">
      <defs>
        {/* Crisp subtle bloom for energized high conductors */}
        <filter id="wire-active-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Directional flow chevron markers */}
        <marker
          id="flow-arrow-high"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M 1 2 L 7 5 L 1 8 Z" fill={highColor} />
        </marker>
        <marker
          id="flow-arrow-low"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M 1 2 L 7 5 L 1 8 Z" fill={lowColor} />
        </marker>
      </defs>

      {/* Render all established wires */}
      {wires.map((wire) => {
        const sourceNode = nodeMap.get(wire.fromNodeId);
        const targetNode = nodeMap.get(wire.toNodeId);
        if (!sourceNode || !targetNode) return null;

        const sourcePin = sourceNode.outputs.find((p) => p.id === wire.fromPinId);
        const targetPin = targetNode.inputs.find((p) => p.id === wire.toPinId);
        if (!sourcePin || !targetPin) return null;

        const x1 = sourceNode.x + sourcePin.offsetX;
        const y1 = sourceNode.y + sourcePin.offsetY;
        const x2 = targetNode.x + targetPin.offsetX;
        const y2 = targetNode.y + targetPin.offsetY;

        const isSelected = selectedWireId === wire.id;
        const isHigh = wire.value;
        const pathData = computePath(x1, y1, x2, y2);

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        // Accurate tangent angle along the conductor flow
        let angleDeg = 0;
        if (wireStyle === 'orthogonal') {
          if (Math.abs(y2 - y1) < 4) {
            angleDeg = x2 >= x1 ? 0 : 180;
          } else if (x2 - x1 >= 20) {
            angleDeg = y2 > y1 ? 90 : -90;
          } else {
            angleDeg = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
          }
        } else {
          // Curved Bezier tangent sample at center
          const dx = x2 - x1;
          const cp = dx >= 20 ? Math.max(35, Math.min(160, dx * 0.5)) : Math.max(50, Math.min(180, Math.abs(dx) * 0.6 + 40));
          const t1 = 0.48;
          const t2 = 0.52;
          const cp1x = x1 + cp;
          const cp2x = x2 - (dx >= 20 ? cp : -cp);
          const px1 = Math.pow(1-t1, 3)*x1 + 3*Math.pow(1-t1, 2)*t1*cp1x + 3*(1-t1)*t1*t1*cp2x + Math.pow(t1, 3)*x2;
          const py1 = Math.pow(1-t1, 3)*y1 + 3*Math.pow(1-t1, 2)*t1*y1 + 3*(1-t1)*t1*t1*y2 + Math.pow(t1, 3)*y2;
          const px2 = Math.pow(1-t2, 3)*x1 + 3*Math.pow(1-t2, 2)*t2*cp1x + 3*(1-t2)*t2*t2*cp2x + Math.pow(t2, 3)*x2;
          const py2 = Math.pow(1-t2, 3)*y1 + 3*Math.pow(1-t2, 2)*t2*y1 + 3*(1-t2)*t2*t2*y2 + Math.pow(t2, 3)*y2;
          angleDeg = (Math.atan2(py2 - py1, px2 - px1) * 180) / Math.PI;
        }

        return (
          <g key={wire.id} className="wire-group cursor-pointer group" pointerEvents="all">
            {/* Generous hit area for clicking/tapping */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth="24"
              pointerEvents="stroke"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onSelectWire(wire.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onDoubleClickWire?.(wire.id);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectWire(wire.id);
                onContextMenuWire?.(wire.id, e.clientX, e.clientY);
              }}
            />

            {/* Selection highlight aura */}
            {isSelected && (
              <path
                d={pathData}
                fill="none"
                stroke={selectedColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.45"
              />
            )}

            {/* Base solid wire conductor */}
            <path
              d={pathData}
              fill="none"
              stroke={isSelected ? selectedColor : isHigh ? highColor : lowColor}
              strokeWidth={isHigh ? 3.8 : 2.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={isHigh ? 'url(#wire-active-glow)' : undefined}
              className="transition-colors duration-150"
              onClick={(e) => {
                e.stopPropagation();
                onSelectWire(wire.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onDoubleClickWire?.(wire.id);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectWire(wire.id);
                onContextMenuWire?.(wire.id, e.clientX, e.clientY);
              }}
            />

            {/* Dynamic Signal Flow Animation (moving pulses indicating flow direction) */}
            {isHigh && (
              <path
                d={pathData}
                fill="none"
                stroke={isDark ? '#e0f2fe' : '#ffffff'}
                strokeWidth="1.6"
                strokeLinecap="round"
                className="wire-signal-flow-active pointer-events-none"
                opacity="0.9"
              />
            )}

            {/* Directional Flow Chevron Indicator along the wire */}
            <g
              transform={`translate(${midX}, ${midY}) rotate(${angleDeg})`}
              className="pointer-events-none select-none"
            >
              <circle
                r="7"
                fill={isHigh ? (isDark ? '#082f49' : '#0369a1') : (isDark ? '#1e293b' : '#475569')}
                stroke={isHigh ? highColor : '#64748b'}
                strokeWidth="1"
              />
              <path
                d="M -2.5 -3 L 2.5 0 L -2.5 3"
                fill="none"
                stroke={isHigh ? '#38bdf8' : '#cbd5e1'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* User-Defined Wire Net Label Display (Always visible when label exists) */}
            {wire.label && wire.label.trim() && wire.id !== editingWireId && (() => {
              const labelText = wire.label.trim();
              const badgeWidth = Math.max(42, labelText.length * 7.5 + 24);
              const halfW = badgeWidth / 2;
              const hasExpression = Boolean(showWireExpressions || isSelected);
              const labelY = hasExpression ? midY - 32 : midY - 16;

              return (
                <g
                  transform={`translate(${midX}, ${labelY})`}
                  className="cursor-pointer select-none filter drop-shadow-sm transition-transform hover:scale-105 group/wirelabel"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectWire(wire.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onDoubleClickWire?.(wire.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectWire(wire.id);
                    onContextMenuWire?.(wire.id, e.clientX, e.clientY);
                  }}
                >
                  <title>{`Wire: ${labelText} (Double-click to rename)`}</title>
                  {/* Background Tag Pill */}
                  <rect
                    x={-halfW}
                    y="-11"
                    width={badgeWidth}
                    height="22"
                    rx="6"
                    fill={isDark ? '#090d16' : '#ffffff'}
                    fillOpacity="0.96"
                    stroke={
                      isSelected
                        ? selectedColor
                        : isHigh
                        ? highColor
                        : isDark
                        ? '#334155'
                        : '#cbd5e1'
                    }
                    strokeWidth={isSelected ? '2' : isHigh ? '1.5' : '1'}
                    className="transition-colors"
                  />
                  {/* Signal indicator dot */}
                  <circle
                    cx={-halfW + 9}
                    cy="0"
                    r="3.5"
                    fill={isHigh ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#64748b' : '#94a3b8')}
                  />
                  {/* Wire Label Text */}
                  <text
                    x={4}
                    y="3.5"
                    textAnchor="middle"
                    fill={
                      isSelected
                        ? (isDark ? '#38bdf8' : '#0284c7')
                        : isHigh
                        ? (isDark ? '#7dd3fc' : '#0369a1')
                        : (isDark ? '#e2e8f0' : '#1e293b')
                    }
                    fontSize="11"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                    fontWeight="700"
                    letterSpacing="0.02em"
                  >
                    {labelText}
                  </text>
                </g>
              );
            })()}

            {/* Quick "+ Name" tag when wire is selected and has no label yet */}
            {isSelected && !wire.label && wire.id !== editingWireId && (
              <g
                transform={`translate(${midX}, ${showWireExpressions ? midY - 32 : midY - 18})`}
                className="cursor-pointer select-none transition-transform hover:scale-105"
                onClick={(e) => {
                  e.stopPropagation();
                  onDoubleClickWire?.(wire.id);
                }}
              >
                <title>Double-click wire to name it</title>
                <rect
                  x="-38"
                  y="-9"
                  width="76"
                  height="18"
                  rx="9"
                  fill={isDark ? '#0f172a' : '#ffffff'}
                  fillOpacity="0.92"
                  stroke={isDark ? '#38bdf8' : '#0284c7'}
                  strokeWidth="1"
                  strokeDasharray="2.5 2"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill={isDark ? '#38bdf8' : '#0284c7'}
                  fontSize="9.5"
                  fontFamily="sans-serif"
                  fontWeight="600"
                >
                  + Name Wire
                </text>
              </g>
            )}

            {/* Circuit Flow State Notation & Algebraic Formula Badge */}
            {(showWireExpressions || isSelected) && (() => {
              const labelText = wire.expression
                ? `${wire.expression} = ${isHigh ? '1' : '0'}`
                : (isHigh ? '1' : '0');
              const badgeWidth = Math.max(52, labelText.length * 7.5 + 24);
              const halfW = badgeWidth / 2;
              const hasLabel = Boolean(wire.label && wire.label.trim());
              const badgeY = hasLabel ? midY - 12 : midY - 18;

              return (
                <g
                  transform={`translate(${midX}, ${badgeY})`}
                  className="pointer-events-none select-none filter drop-shadow-sm"
                >
                  <rect
                    x={-halfW}
                    y="-11"
                    width={badgeWidth}
                    height="22"
                    rx="11"
                    fill={isDark ? '#0f172a' : '#ffffff'}
                    fillOpacity="0.96"
                    stroke={isSelected ? selectedColor : isHigh ? highColor : (isDark ? '#334155' : '#cbd5e1')}
                    strokeWidth={isHigh ? '1.5' : '1'}
                  />
                  <circle
                    cx={-halfW + 11}
                    cy="0"
                    r="3.5"
                    fill={isHigh ? (isDark ? '#38bdf8' : '#0284c7') : '#94a3b8'}
                  />
                  <text
                    x={6}
                    y="3.5"
                    textAnchor="middle"
                    fill={isHigh ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#cbd5e1' : '#334155')}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {labelText}
                  </text>
                </g>
              );
            })()}

            {/* Delete button when wire is explicitly selected */}
            {isSelected && (
              <g
                transform={`translate(${midX}, ${midY})`}
                className="wire-delete-btn cursor-pointer transition-transform hover:scale-110 drop-shadow-md"
                pointerEvents="all"
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteWire(wire.id);
                }}
              >
                <title>Delete Wire</title>
                {/* Generous invisible touch/click hit area */}
                <circle r="18" fill="transparent" />
                <circle r="11" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                <path
                  d="M -3.5 -3.5 L 3.5 3.5 M -3.5 3.5 L 3.5 -3.5"
                  stroke="#ffffff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </g>
            )}
          </g>
        );
      })}

      {/* Dragging wire in progress */}
      {draggingWire && (
        <g pointerEvents="none">
          <path
            d={computePath(
              draggingWire.startX,
              draggingWire.startY,
              draggingWire.currentX,
              draggingWire.currentY
            )}
            fill="none"
            stroke={highColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
            filter="url(#wire-active-glow)"
          />
          <path
            d={computePath(
              draggingWire.startX,
              draggingWire.startY,
              draggingWire.currentX,
              draggingWire.currentY
            )}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="wire-signal-flow-fast"
            opacity="0.8"
          />
          <circle
            cx={draggingWire.currentX}
            cy={draggingWire.currentY}
            r="6"
            fill={highColor}
            stroke="#ffffff"
            strokeWidth="2.5"
          />
          <circle
            cx={draggingWire.currentX}
            cy={draggingWire.currentY}
            r="12"
            fill="none"
            stroke={draggingWire.isSnapped ? '#22c55e' : highColor}
            strokeWidth={draggingWire.isSnapped ? '2.5' : '1.5'}
            opacity={draggingWire.isSnapped ? '0.9' : '0.6'}
            className="pin-magnetic-target"
          />
          {draggingWire.isSnapped && (
            <circle
              cx={draggingWire.currentX}
              cy={draggingWire.currentY}
              r="18"
              fill="#22c55e"
              fillOpacity="0.2"
              stroke="#22c55e"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}
        </g>
      )}
    </g>
  );
};

export const WireRenderer = React.memo(WireRendererBase);
