import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CircuitNode, DraggingWire, Pin, Sheet, Wire } from '../types';
import { WireRenderer } from './WireRenderer';
import { NodeComponent } from './NodeComponent';
import { createDefaultNode, updateGateInputCount } from '../utils/circuitSolver';
import { formatUserVariableInput } from '../utils/booleanAlgebra';
import { sound } from '../utils/sound';
import {
  Play,
  Pause,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Trash2,
  Minus,
  Plus,
  Maximize2,
  X,
  MousePointer,
  Hand,
  Layers,
  Copy,
  ExternalLink,
  Tag,
  Pencil,
  Check,
  Scissors,
  ToggleRight,
  PlusCircle,
  MinusCircle,
  Package,
  Unplug,
  ArrowUp,
  ArrowDown,
  Grid,
  Magnet,
  Undo2,
  Redo2,
  FilePlus,
  Zap,
  GitFork,
  Cpu,
  Activity,
} from 'lucide-react';
import { ContextMenu, ContextMenuItem } from './ContextMenu';

interface CanvasProps {
  sheet: Sheet;
  selectedNodeId: string | null;
  selectedNodeIds?: string[];
  selectedWireId: string | null;
  showGrid: boolean;
  snapToGrid: boolean;
  wireStyle: 'curved' | 'orthogonal';
  simulationRunning: boolean;
  theme?: 'dark' | 'light';
  showWireExpressions?: boolean;
  showComponentVariables?: boolean;
  onTogglePlayPause: () => void;
  onStepSimulation: () => void;
  onUpdateSheet: (updated: Partial<Sheet>) => void;
  onSelectNode: (nodeId: string | null) => void;
  onSelectNodes?: (nodeIds: string[]) => void;
  onSelectWire: (wireId: string | null) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteNodes?: (nodeIds: string[]) => void;
  onDeleteWire: (wireId: string) => void;
  onUpdateWireLabel?: (wireId: string, label: string) => void;
  onDuplicateNodes?: (nodeIds: string[]) => void;
  onGroupSubcircuit?: (nodeIds: string[], name: string) => void;
  onNavigateToSheet?: (sheetId: string) => void;
  onToggleSwitch: (nodeId: string) => void;
  onButtonPress: (nodeId: string, pressed: boolean) => void;
  onUpdateNodeState: (nodeId: string, state: Partial<CircuitNode['state']>) => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: (atCoords?: { x: number; y: number }) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onToggleGrid?: () => void;
  onToggleSnap?: () => void;
  onToggleWireStyle?: () => void;
  onAddComponent?: (type: any, coords?: { x: number; y: number }) => void;
  onCreateSheet?: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  sheet,
  selectedNodeId,
  selectedNodeIds = [],
  selectedWireId,
  showGrid,
  snapToGrid,
  wireStyle,
  simulationRunning,
  theme = 'light',
  showWireExpressions = false,
  showComponentVariables = true,
  onTogglePlayPause,
  onStepSimulation,
  onUpdateSheet,
  onSelectNode,
  onSelectNodes,
  onSelectWire,
  onDeleteNode,
  onDeleteNodes,
  onDeleteWire,
  onUpdateWireLabel,
  onDuplicateNodes,
  onGroupSubcircuit,
  onNavigateToSheet,
  onToggleSwitch,
  onButtonPress,
  onUpdateNodeState,
  onCopy,
  onCut,
  onPaste,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onToggleGrid,
  onToggleSnap,
  onToggleWireStyle,
  onAddComponent,
  onCreateSheet,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Wire inline labeling state (double click to name wire)
  const [editingWireId, setEditingWireId] = useState<string | null>(null);
  const [editingWireText, setEditingWireText] = useState('');
  const wireInputRef = useRef<HTMLInputElement>(null);

  // Global right-click context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    title?: string;
    items: ContextMenuItem[];
  } | null>(null);

  const handleStartEditWire = useCallback((wireId: string) => {
    const wire = sheet.wires.find((w) => w.id === wireId);
    if (!wire) return;
    setEditingWireId(wireId);
    setEditingWireText(wire.label || '');
    onSelectWire(wireId);
    sound.playClick();
    setTimeout(() => {
      wireInputRef.current?.focus();
      wireInputRef.current?.select();
    }, 50);
  }, [sheet.wires, onSelectWire]);

  const handleSaveWireLabel = useCallback((wireId: string, text: string) => {
    const clean = text.trim();
    if (onUpdateWireLabel) {
      onUpdateWireLabel(wireId, clean);
    } else {
      const updatedWires = sheet.wires.map((w) =>
        w.id === wireId ? { ...w, label: clean || undefined } : w
      );
      onUpdateSheet({ wires: updatedWires });
    }
    setEditingWireId(null);
    sound.playClick();
  }, [sheet.wires, onUpdateSheet, onUpdateWireLabel]);

  const handleCancelEditWire = useCallback(() => {
    setEditingWireId(null);
  }, []);

  // Selection and Canvas Tool modes
  const [canvasTool, setCanvasTool] = useState<'select' | 'pan'>('select');
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [marqueePreviewIds, setMarqueePreviewIds] = useState<string[]>([]);
  const selectedNodeIdsRef = useRef<string[]>(selectedNodeIds);
  selectedNodeIdsRef.current = selectedNodeIds;

  // Sub-circuit grouping modal state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [subcircuitModalName, setSubcircuitModalName] = useState('Sub-Circuit');

  // Track initial positions of all dragged nodes during multi-selection drag
  const initialDragPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const dragAnchorInitialPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Keyboard shortcut listener for Canvas tools (V = Select, H = Pan)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement;
      if (isInput) return;

      if (e.key === 'v' || e.key === 'V' || e.key === 's' || e.key === 'S') {
        setCanvasTool('select');
      } else if (e.key === 'h' || e.key === 'H') {
        setCanvasTool('pan');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Pan and drag states
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Node drag state
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragNodeOffset, setDragNodeOffset] = useState({ x: 0, y: 0 });

  // Wire drawing state
  const [draggingWire, setDraggingWire] = useState<DraggingWire | null>(null);

  // Inspector visibility toggle (only opened on right-click desktop or double-tap mobile)
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Multi-touch tracking for pinch-to-zoom
  const touchDistanceRef = useRef<number | null>(null);

  // Selected Node reference
  const selectedNode = sheet.nodes.find((n) => n.id === selectedNodeId) || null;

  // Convert screen coordinates to canvas world coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = screenX - rect.left;
      const clientY = screenY - rect.top;
      return {
        x: (clientX - sheet.pan.x) / sheet.zoom,
        y: (clientY - sheet.pan.y) / sheet.zoom,
      };
    },
    [sheet.pan, sheet.zoom]
  );

  // Snapping helper
  const snapCoord = useCallback(
    (val: number, step: number = 16) => {
      if (!snapToGrid) return val;
      return Math.round(val / step) * step;
    },
    [snapToGrid]
  );

  const pendingSheetUpdateRef = useRef<Partial<Sheet> | null>(null);
  const sheetUpdateFrameRef = useRef<number | null>(null);
  const scheduleSheetUpdate = useCallback(
    (updated: Partial<Sheet>) => {
      pendingSheetUpdateRef.current = {
        ...pendingSheetUpdateRef.current,
        ...updated,
      };
      if (sheetUpdateFrameRef.current !== null) return;

      sheetUpdateFrameRef.current = window.requestAnimationFrame(() => {
        sheetUpdateFrameRef.current = null;
        const nextUpdate = pendingSheetUpdateRef.current;
        pendingSheetUpdateRef.current = null;
        if (nextUpdate) onUpdateSheet(nextUpdate);
      });
    },
    [onUpdateSheet]
  );

  useEffect(() => {
    return () => {
      if (sheetUpdateFrameRef.current !== null) {
        window.cancelAnimationFrame(sheetUpdateFrameRef.current);
      }
    };
  }, []);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const zoomFactor = 1.1;
    const newZoom = e.deltaY < 0 ? sheet.zoom * zoomFactor : sheet.zoom / zoomFactor;
    const clampedZoom = Math.min(Math.max(newZoom, 0.3), 3.0);

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newPanX = mouseX - (mouseX - sheet.pan.x) * (clampedZoom / sheet.zoom);
    const newPanY = mouseY - (mouseY - sheet.pan.y) * (clampedZoom / sheet.zoom);

    onUpdateSheet({
      zoom: clampedZoom,
      pan: { x: newPanX, y: newPanY },
    });
  };

  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.min(Math.max(newZoom, 0.3), 3.0);
    onUpdateSheet({ zoom: clamped });
  };

  // Canvas background mouse down
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent deselecting or panning when clicking inside inspector, floating controls, wire controls, or interactive elements
    const target = e.target as HTMLElement | null;
    if (target?.closest?.('#logicflow-inspector, .logicflow-export-ignore, [data-export-ignore], .wire-delete-btn, .wire-group, .wire-label, button, input, select, textarea')) {
      return;
    }

    if (e.button === 1 || (canvasTool === 'pan' && !e.shiftKey)) {
      // Pan mode or middle mouse click
      if (!e.shiftKey) {
        onSelectNode(null);
        onSelectNodes?.([]);
        onSelectWire(null);
        setIsInspectorOpen(false);
      }
      setIsPanning(true);
      setPanStart({ x: e.clientX - sheet.pan.x, y: e.clientY - sheet.pan.y });
    } else if (e.button === 0) {
      // Left-click in select mode: start marquee selection box
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        onSelectNode(null);
        onSelectNodes?.([]);
        onSelectWire(null);
        setIsInspectorOpen(false);
      }

      setMarquee({
        startX: clientX,
        startY: clientY,
        currentX: clientX,
        currentY: clientY,
      });
    }
  };

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent) => {
    if (marquee) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      setMarquee((prev) => (prev ? { ...prev, currentX: clientX, currentY: clientY } : null));

      const rectLeft = Math.min(marquee.startX, clientX);
      const rectTop = Math.min(marquee.startY, clientY);
      const rectWidth = Math.abs(clientX - marquee.startX);
      const rectHeight = Math.abs(clientY - marquee.startY);

      if (rectWidth > 5 || rectHeight > 5) {
        const worldMinX = (rectLeft - sheet.pan.x) / sheet.zoom;
        const worldMinY = (rectTop - sheet.pan.y) / sheet.zoom;
        const worldMaxX = (rectLeft + rectWidth - sheet.pan.x) / sheet.zoom;
        const worldMaxY = (rectTop + rectHeight - sheet.pan.y) / sheet.zoom;

        const previewIds = sheet.nodes
          .filter((node) => {
            const w = node.width || 100;
            const h = node.height || 60;
            const nodeMaxX = node.x + w;
            const nodeMaxY = node.y + h;
            return (
              node.x < worldMaxX &&
              nodeMaxX > worldMinX &&
              node.y < worldMaxY &&
              nodeMaxY > worldMinY
            );
          })
          .map((n) => n.id);

        setMarqueePreviewIds(previewIds);
      } else {
        setMarqueePreviewIds([]);
      }
      return;
    }

    if (isPanning) {
      scheduleSheetUpdate({
        pan: {
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        },
      });
      return;
    }

    if (draggedNodeId) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      const targetX = snapCoord(worldPos.x - dragNodeOffset.x);
      const targetY = snapCoord(worldPos.y - dragNodeOffset.y);

      const anchorInitial = dragAnchorInitialPosRef.current;
      const deltaX = targetX - anchorInitial.x;
      const deltaY = targetY - anchorInitial.y;

      const updatedNodes = sheet.nodes.map((node) => {
        const initialPos = initialDragPositionsRef.current.get(node.id);
        if (initialPos) {
          return {
            ...node,
            x: initialPos.x + deltaX,
            y: initialPos.y + deltaY,
          };
        }
        if (node.id === draggedNodeId) {
          return { ...node, x: targetX, y: targetY };
        }
        return node;
      });

      scheduleSheetUpdate({ nodes: updatedNodes });
      return;
    }

    if (draggingWire) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      const nearest = getNearestTargetPin(worldPos.x, worldPos.y, draggingWire, 32);
      setDraggingWire({
        ...draggingWire,
        currentX: nearest ? nearest.x : worldPos.x,
        currentY: nearest ? nearest.y : worldPos.y,
        hoverPinId: nearest ? nearest.pin.id : undefined,
        isSnapped: !!nearest,
      });
    }
  };

  // Helper to connect a wire between source and destination pins
  const connectWire = (
    sourcePinId: string,
    destPinId: string,
    sourceNodeId: string,
    destNodeId: string
  ) => {
    // Check if identical wire already exists
    const wireExists = sheet.wires.some(
      (w) => w.fromPinId === sourcePinId && w.toPinId === destPinId
    );

    if (!wireExists) {
      // In digital schematic rules, an input terminal can only accept one driver signal wire
      const filteredWires = sheet.wires.filter((w) => w.toPinId !== destPinId);
      const newWire: Wire = {
        id: `wire_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        fromNodeId: sourceNodeId,
        fromPinId: sourcePinId,
        toNodeId: destNodeId,
        toPinId: destPinId,
        value: false,
      };

      onUpdateSheet({ wires: [...filteredWires, newWire] });
      sound.playClick();
    }
  };

  // Find nearest compatible pin for magnetic snapping
  const getNearestTargetPin = useCallback(
    (
      worldX: number,
      worldY: number,
      activeWire: DraggingWire,
      maxDistance: number = 32
    ) => {
      const targetType = activeWire.fromPinType === 'output' ? 'input' : 'output';
      let closest: { pin: Pin; distance: number; x: number; y: number } | null = null;

      for (const n of sheet.nodes) {
        if (n.id === activeWire.fromNodeId) continue;
        const pins = targetType === 'input' ? n.inputs : n.outputs;
        for (const p of pins) {
          if (p.id === activeWire.fromPinId) continue;
          const px = n.x + p.offsetX;
          const py = n.y + p.offsetY;
          const dist = Math.hypot(worldX - px, worldY - py);
          if (dist <= maxDistance) {
            if (!closest || dist < closest.distance) {
              closest = { pin: p, distance: dist, x: px, y: py };
            }
          }
        }
      }
      return closest;
    },
    [sheet.nodes]
  );

  // Mouse up handler
  const handleMouseUp = (e?: React.MouseEvent | MouseEvent) => {
    if (isPanning) setIsPanning(false);
    if (draggedNodeId) setDraggedNodeId(null);

    if (marquee) {
      const rectLeft = Math.min(marquee.startX, marquee.currentX);
      const rectTop = Math.min(marquee.startY, marquee.currentY);
      const rectWidth = Math.abs(marquee.currentX - marquee.startX);
      const rectHeight = Math.abs(marquee.currentY - marquee.startY);

      if (rectWidth > 5 || rectHeight > 5) {
        // Convert screen rect bounds into world coordinates
        const worldMinX = (rectLeft - sheet.pan.x) / sheet.zoom;
        const worldMinY = (rectTop - sheet.pan.y) / sheet.zoom;
        const worldMaxX = (rectLeft + rectWidth - sheet.pan.x) / sheet.zoom;
        const worldMaxY = (rectTop + rectHeight - sheet.pan.y) / sheet.zoom;

        const intersectedNodes = sheet.nodes.filter((node) => {
          const w = node.width || 100;
          const h = node.height || 60;
          const nodeMaxX = node.x + w;
          const nodeMaxY = node.y + h;
          return (
            node.x < worldMaxX &&
            nodeMaxX > worldMinX &&
            node.y < worldMaxY &&
            nodeMaxY > worldMinY
          );
        });

        const intersectedIds = intersectedNodes.map((n) => n.id);
        const isShift = e?.shiftKey;
        if (intersectedIds.length > 0) {
          const nextSelected = isShift
            ? Array.from(new Set([...selectedNodeIdsRef.current, ...intersectedIds]))
            : intersectedIds;

          onSelectNodes?.(nextSelected);
          onSelectNode(nextSelected[0] || null);
          sound.playClick();
        } else if (!isShift) {
          onSelectNodes?.([]);
          onSelectNode(null);
        }
      }
      setMarquee(null);
      setMarqueePreviewIds([]);
    }

    if (draggingWire) {
      // If releasing over a magnetically snapped or hovered compatible pin
      if (draggingWire.hoverPinId) {
        let foundPin: Pin | null = null;
        for (const n of sheet.nodes) {
          const p = [...n.inputs, ...n.outputs].find((x) => x.id === draggingWire.hoverPinId);
          if (p) {
            foundPin = p;
            break;
          }
        }

        if (foundPin) {
          const isStartOutput = draggingWire.fromPinType === 'output';
          const sourceNodeId = isStartOutput ? draggingWire.fromNodeId : foundPin.nodeId;
          const sourcePinId = isStartOutput ? draggingWire.fromPinId : foundPin.id;
          const destNodeId = isStartOutput ? foundPin.nodeId : draggingWire.fromNodeId;
          const destPinId = isStartOutput ? foundPin.id : draggingWire.fromPinId;
          connectWire(sourcePinId, destPinId, sourceNodeId, destNodeId);
        }
      }
      setDraggingWire(null);
    }
  };

  // Global window mouse listener during active drag / marquee / pan so pointer events are never trapped or lost
  useEffect(() => {
    if (!marquee && !draggedNodeId && !isPanning) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      if (marquee) {
        setMarquee((prev) => (prev ? { ...prev, currentX: clientX, currentY: clientY } : null));

        const rectLeft = Math.min(marquee.startX, clientX);
        const rectTop = Math.min(marquee.startY, clientY);
        const rectWidth = Math.abs(clientX - marquee.startX);
        const rectHeight = Math.abs(clientY - marquee.startY);

        if (rectWidth > 5 || rectHeight > 5) {
          const worldMinX = (rectLeft - sheet.pan.x) / sheet.zoom;
          const worldMinY = (rectTop - sheet.pan.y) / sheet.zoom;
          const worldMaxX = (rectLeft + rectWidth - sheet.pan.x) / sheet.zoom;
          const worldMaxY = (rectTop + rectHeight - sheet.pan.y) / sheet.zoom;

          const previewIds = sheet.nodes
            .filter((node) => {
              const w = node.width || 100;
              const h = node.height || 60;
              const nodeMaxX = node.x + w;
              const nodeMaxY = node.y + h;
              return (
                node.x < worldMaxX &&
                nodeMaxX > worldMinX &&
                node.y < worldMaxY &&
                nodeMaxY > worldMinY
              );
            })
            .map((n) => n.id);

          setMarqueePreviewIds(previewIds);
        } else {
          setMarqueePreviewIds([]);
        }
        return;
      }

      if (isPanning) {
        scheduleSheetUpdate({
          pan: {
            x: e.clientX - panStart.x,
            y: e.clientY - panStart.y,
          },
        });
        return;
      }

      if (draggedNodeId) {
        const worldPos = screenToWorld(e.clientX, e.clientY);
        const targetX = snapCoord(worldPos.x - dragNodeOffset.x);
        const targetY = snapCoord(worldPos.y - dragNodeOffset.y);

        const anchorInitial = dragAnchorInitialPosRef.current;
        const deltaX = targetX - anchorInitial.x;
        const deltaY = targetY - anchorInitial.y;

        const updatedNodes = sheet.nodes.map((node) => {
          const initialPos = initialDragPositionsRef.current.get(node.id);
          if (initialPos) {
            return {
              ...node,
              x: initialPos.x + deltaX,
              y: initialPos.y + deltaY,
            };
          }
          if (node.id === draggedNodeId) {
            return { ...node, x: targetX, y: targetY };
          }
          return node;
        });

        scheduleSheetUpdate({ nodes: updatedNodes });
        return;
      }
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      handleMouseUp(e);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [
    marquee,
    draggedNodeId,
    isPanning,
    panStart,
    dragNodeOffset,
    sheet.pan,
    sheet.zoom,
    sheet.nodes,
    snapCoord,
    screenToWorld,
    scheduleSheetUpdate,
  ]);

  // Node selection and start drag
  const handleNodeSelect = (nodeId: string, e: React.MouseEvent | React.TouchEvent) => {
    const isShiftOrCtrl = 'shiftKey' in e && (e.shiftKey || e.ctrlKey || e.metaKey);

    let nextSelected: string[];
    if (isShiftOrCtrl) {
      if (selectedNodeIds.includes(nodeId)) {
        nextSelected = selectedNodeIds.filter((id) => id !== nodeId);
      } else {
        nextSelected = [...selectedNodeIds, nodeId];
      }
    } else {
      if (selectedNodeIds.includes(nodeId)) {
        nextSelected = selectedNodeIds;
      } else {
        nextSelected = [nodeId];
      }
    }

    onSelectNodes?.(nextSelected);
    onSelectNode(nextSelected.length > 0 ? (nextSelected.includes(nodeId) ? nodeId : nextSelected[0]) : null);
    onSelectWire(null);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const node = sheet.nodes.find((n) => n.id === nodeId);
    if (node) {
      const worldPos = screenToWorld(clientX, clientY);
      setDragNodeOffset({
        x: worldPos.x - node.x,
        y: worldPos.y - node.y,
      });

      // Populate initial positions for all selected nodes for multi-node drag
      initialDragPositionsRef.current.clear();
      nextSelected.forEach((id) => {
        const item = sheet.nodes.find((n) => n.id === id);
        if (item) {
          initialDragPositionsRef.current.set(id, { x: item.x, y: item.y });
        }
      });
      dragAnchorInitialPosRef.current = { x: node.x, y: node.y };

      setDraggedNodeId(nodeId);
    }
  };

  // Inspect node properties (called on right-click desktop or double-click/tap mobile)
  const handleInspectNode = (nodeId: string) => {
    onSelectNode(nodeId);
    onSelectWire(null);
    setIsInspectorOpen(true);
    sound.playClick();
  };

  // Right-click context menu handler for Nodes / Components
  const handleNodeContextMenu = useCallback(
    (nodeId: string, clientX: number, clientY: number) => {
      const node = sheet.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const isAlreadyInSelection = selectedNodeIds.includes(nodeId);
      const activeIds = isAlreadyInSelection ? selectedNodeIds : [nodeId];
      if (!isAlreadyInSelection) {
        onSelectNode(nodeId);
        onSelectNodes?.([nodeId]);
      }
      onSelectWire(null);

      const isMulti = activeIds.length > 1;
      const isSwitchOrButton =
        node.type === 'SWITCH' ||
        node.type === 'BUTTON' ||
        node.type === 'CLOCK' ||
        node.type === 'ELEC_SWITCH' ||
        node.type === 'ELEC_SPDT_SWITCH';
      const isMultiInputGate = [
        'AND',
        'OR',
        'NAND',
        'NOR',
        'XOR',
        'XNOR',
      ].includes(node.type);

      const items: ContextMenuItem[] = [
        {
          id: 'inspect',
          label: isMulti ? `Inspect Properties (${activeIds.length})` : 'Inspect & Properties',
          icon: Pencil,
          shortcut: 'Enter',
          onClick: () => handleInspectNode(nodeId),
        },
        {
          id: 'div-edit',
          label: '',
          divider: true,
        },
        {
          id: 'copy',
          label: 'Copy Component',
          icon: Copy,
          shortcut: 'Ctrl+C',
          onClick: () => onCopy?.(),
        },
        {
          id: 'duplicate',
          label: isMulti ? `Duplicate (${activeIds.length})` : 'Duplicate',
          icon: Copy,
          shortcut: 'Ctrl+D',
          onClick: () => onDuplicateNodes?.(activeIds),
        },
        {
          id: 'cut',
          label: 'Cut Component',
          icon: Scissors,
          shortcut: 'Ctrl+X',
          onClick: () => onCut?.(),
        },
        {
          id: 'delete',
          label: isMulti ? `Delete (${activeIds.length}) Components` : 'Delete Component',
          icon: Trash2,
          shortcut: 'Del',
          danger: true,
          onClick: () => {
            if (isMulti && onDeleteNodes) {
              onDeleteNodes(activeIds);
            } else {
              onDeleteNode(nodeId);
            }
          },
        },
      ];

      if (!isMulti) {
        items.push({ id: 'div-actions', label: '', divider: true });

        if (isSwitchOrButton) {
          items.push({
            id: 'toggle',
            label: 'Toggle State',
            icon: ToggleRight,
            shortcut: 'Click',
            onClick: () => onToggleSwitch(nodeId),
          });
        }

        if (isMultiInputGate) {
          items.push(
            {
              id: 'add-pin',
              label: 'Add Input Pin (+1)',
              icon: PlusCircle,
              onClick: () => {
                const currentCount = node.inputs.length;
                if (currentCount < 8) {
                  const updated = updateGateInputCount(node, currentCount + 1);
                  onUpdateSheet({
                    nodes: sheet.nodes.map((n) => (n.id === nodeId ? updated : n)),
                  });
                }
              },
            },
            {
              id: 'remove-pin',
              label: 'Remove Input Pin (-1)',
              icon: MinusCircle,
              disabled: node.inputs.length <= 2,
              onClick: () => {
                const currentCount = node.inputs.length;
                if (currentCount > 2) {
                  const updated = updateGateInputCount(node, currentCount - 1);
                  const removedPinId = node.inputs[node.inputs.length - 1]?.id;
                  const filteredWires = sheet.wires.filter(
                    (w) => w.toPinId !== removedPinId
                  );
                  onUpdateSheet({
                    nodes: sheet.nodes.map((n) => (n.id === nodeId ? updated : n)),
                    wires: filteredWires,
                  });
                }
              },
            }
          );
        }

        const connectedWires = sheet.wires.filter(
          (w) => w.fromNodeId === nodeId || w.toNodeId === nodeId
        );
        if (connectedWires.length > 0) {
          items.push({
            id: 'disconnect',
            label: `Disconnect All Wires (${connectedWires.length})`,
            icon: Unplug,
            onClick: () => {
              onUpdateSheet({
                wires: sheet.wires.filter(
                  (w) => w.fromNodeId !== nodeId && w.toNodeId !== nodeId
                ),
              });
            },
          });
        }

        items.push(
          { id: 'div-order', label: '', divider: true },
          {
            id: 'bring-front',
            label: 'Bring to Front',
            icon: ArrowUp,
            onClick: () => {
              const target = sheet.nodes.find((n) => n.id === nodeId);
              if (!target) return;
              const rest = sheet.nodes.filter((n) => n.id !== nodeId);
              onUpdateSheet({ nodes: [...rest, target] });
            },
          },
          {
            id: 'send-back',
            label: 'Send to Back',
            icon: ArrowDown,
            onClick: () => {
              const target = sheet.nodes.find((n) => n.id === nodeId);
              if (!target) return;
              const rest = sheet.nodes.filter((n) => n.id !== nodeId);
              onUpdateSheet({ nodes: [target, ...rest] });
            },
          }
        );
      }

      if (activeIds.length >= 2) {
        items.push({
          id: 'subcircuit',
          label: `Group as Sub-Circuit (${activeIds.length})`,
          icon: Package,
          onClick: () => {
            setIsGroupModalOpen(true);
          },
        });
      }

      setContextMenu({
        x: clientX,
        y: clientY,
        title: isMulti
          ? `${activeIds.length} Selected Components`
          : `${node.label || node.type.toUpperCase()}`,
        items,
      });
    },
    [
      sheet.nodes,
      sheet.wires,
      selectedNodeIds,
      onSelectNode,
      onSelectNodes,
      onSelectWire,
      handleInspectNode,
      onCopy,
      onDuplicateNodes,
      onCut,
      onDeleteNodes,
      onDeleteNode,
      onToggleSwitch,
      onUpdateSheet,
    ]
  );

  // Right-click context menu handler for Wires
  const handleWireContextMenu = useCallback(
    (wireId: string, clientX: number, clientY: number) => {
      const wire = sheet.wires.find((w) => w.id === wireId);
      if (!wire) return;
      onSelectWire(wireId);
      onSelectNode(null);
      onSelectNodes?.([]);

      const sourceNode = sheet.nodes.find((n) => n.id === wire.fromNodeId);
      const targetNode = sheet.nodes.find((n) => n.id === wire.toNodeId);

      const items: ContextMenuItem[] = [
        {
          id: 'rename-wire',
          label: wire.label ? `Rename Wire (${wire.label})` : 'Name / Label Wire Net',
          icon: Pencil,
          shortcut: 'Double-click',
          onClick: () => handleStartEditWire(wireId),
        },
        {
          id: 'toggle-style',
          label: `Switch to ${wireStyle === 'curved' ? 'Orthogonal' : 'Curved'} Style`,
          icon: GitFork,
          onClick: () => onToggleWireStyle?.(),
        },
        {
          id: 'div-w-del',
          label: '',
          divider: true,
        },
        {
          id: 'delete-wire',
          label: 'Delete Wire',
          icon: Trash2,
          shortcut: 'Del',
          danger: true,
          onClick: () => onDeleteWire(wireId),
        },
      ];

      setContextMenu({
        x: clientX,
        y: clientY,
        title: `Net: ${wire.label || `${sourceNode?.label || wire.fromNodeId} → ${targetNode?.label || wire.toNodeId}`}`,
        items,
      });
    },
    [sheet.wires, sheet.nodes, onSelectWire, onSelectNode, onSelectNodes, handleStartEditWire, wireStyle, onToggleWireStyle, onDeleteWire]
  );

  // Right-click context menu handler for Canvas empty background
  const handleCanvasContextMenu = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest?.(
          '#logicflow-inspector, .logicflow-export-ignore, [data-export-ignore], button, input, select, textarea, .wire-group'
        )
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const rect = containerRef.current?.getBoundingClientRect();
      const worldX = rect
        ? Math.round((e.clientX - rect.left - sheet.pan.x) / sheet.zoom)
        : 100;
      const worldY = rect
        ? Math.round((e.clientY - rect.top - sheet.pan.y) / sheet.zoom)
        : 100;

      const addAtPos = (type: any) => {
        if (onAddComponent) {
          onAddComponent(type, { x: worldX, y: worldY });
        } else {
          const newNode = createDefaultNode(type, worldX, worldY);
          onUpdateSheet({ nodes: [...sheet.nodes, newNode] });
        }
      };

      const items: ContextMenuItem[] = [
        {
          id: 'paste',
          label: 'Paste Here',
          icon: Copy,
          shortcut: 'Ctrl+V',
          onClick: () => onPaste?.({ x: worldX, y: worldY }),
        },
        {
          id: 'div-add',
          label: '',
          divider: true,
        },
        {
          id: 'add-logic',
          label: 'Add Logic Gate',
          icon: Cpu,
          submenu: [
            { id: 'gate-and', label: 'AND Gate', onClick: () => addAtPos('AND') },
            { id: 'gate-or', label: 'OR Gate', onClick: () => addAtPos('OR') },
            { id: 'gate-not', label: 'NOT (Inverter)', onClick: () => addAtPos('NOT') },
            { id: 'gate-nand', label: 'NAND Gate', onClick: () => addAtPos('NAND') },
            { id: 'gate-nor', label: 'NOR Gate', onClick: () => addAtPos('NOR') },
            { id: 'gate-xor', label: 'XOR Gate', onClick: () => addAtPos('XOR') },
            { id: 'gate-xnor', label: 'XNOR Gate', onClick: () => addAtPos('XNOR') },
            { id: 'gate-buf', label: 'Buffer', onClick: () => addAtPos('BUFFER') },
            { id: 'gate-tri', label: 'Tri-State Buffer', onClick: () => addAtPos('TRI_STATE') },
          ],
        },
        {
          id: 'add-sequential',
          label: 'Add Flip-Flop / Latch',
          icon: Layers,
          submenu: [
            { id: 'ff-d', label: 'D Flip-Flop', onClick: () => addAtPos('D_FLIP_FLOP') },
            { id: 'ff-t', label: 'T Flip-Flop', onClick: () => addAtPos('T_FLIP_FLOP') },
            { id: 'ff-jk', label: 'JK Flip-Flop', onClick: () => addAtPos('JK_FLIP_FLOP') },
            { id: 'ff-sr', label: 'SR Flip-Flop', onClick: () => addAtPos('SR_FLIP_FLOP') },
          ],
        },
        {
          id: 'add-combinational',
          label: 'Add Combinational IC',
          icon: Cpu,
          submenu: [
            { id: 'comb-ha', label: 'Half Adder', onClick: () => addAtPos('HALF_ADDER') },
            { id: 'comb-fa', label: 'Full Adder', onClick: () => addAtPos('FULL_ADDER') },
            { id: 'comb-mux', label: '2:1 Multiplexer (MUX)', onClick: () => addAtPos('MUX_2TO1') },
            { id: 'comb-demux', label: '1:2 Demultiplexer (DEMUX)', onClick: () => addAtPos('DEMUX_1TO2') },
          ],
        },
        {
          id: 'add-io',
          label: 'Add Input / Display',
          icon: Activity,
          submenu: [
            { id: 'io-sw', label: 'Toggle Switch', onClick: () => addAtPos('SWITCH') },
            { id: 'io-btn', label: 'Push Button', onClick: () => addAtPos('BUTTON') },
            { id: 'io-clk', label: 'Clock Pulse', onClick: () => addAtPos('CLOCK') },
            { id: 'io-hi', label: 'Constant HIGH (1)', onClick: () => addAtPos('HIGH_CONST') },
            { id: 'io-lo', label: 'Constant LOW (0)', onClick: () => addAtPos('LOW_CONST') },
            { id: 'io-led', label: 'LED Lamp', onClick: () => addAtPos('LED') },
            { id: 'io-probe', label: 'Digital Probe', onClick: () => addAtPos('PROBE') },
            { id: 'io-7seg', label: '7-Segment Display', onClick: () => addAtPos('SEVEN_SEG') },
            { id: 'io-buzzer', label: 'Piezo Buzzer', onClick: () => addAtPos('BUZZER') },
          ],
        },
        {
          id: 'add-electric',
          label: 'Add Electric Part',
          icon: Zap,
          submenu: [
            { id: 'el-res', label: 'Resistor (1kΩ)', onClick: () => addAtPos('ELEC_RESISTOR') },
            { id: 'el-pot', label: 'Potentiometer (10kΩ)', onClick: () => addAtPos('ELEC_POTENTIOMETER') },
            { id: 'el-cap', label: 'Capacitor (10µF)', onClick: () => addAtPos('ELEC_CAPACITOR') },
            { id: 'el-ind', label: 'Inductor (1mH)', onClick: () => addAtPos('ELEC_INDUCTOR') },
            { id: 'el-bat', label: 'DC Battery (+9V)', onClick: () => addAtPos('ELEC_BATTERY') },
            { id: 'el-ac', label: 'AC Source (60Hz)', onClick: () => addAtPos('ELEC_AC_SOURCE') },
            { id: 'el-diode', label: 'PN Diode (1N4007)', onClick: () => addAtPos('ELEC_DIODE') },
            { id: 'el-zener', label: 'Zener Diode (5.1V)', onClick: () => addAtPos('ELEC_ZENER') },
            { id: 'el-led', label: 'LED Indicator', onClick: () => addAtPos('ELEC_LED') },
            { id: 'el-bjt-npn', label: 'BJT NPN Transistor', onClick: () => addAtPos('ELEC_NPN') },
            { id: 'el-bjt-pnp', label: 'BJT PNP Transistor', onClick: () => addAtPos('ELEC_PNP') },
            { id: 'el-opamp', label: 'Op-Amp Amplifier (741)', onClick: () => addAtPos('ELEC_OPAMP') },
            { id: 'el-xfrmr', label: 'AC Transformer', onClick: () => addAtPos('ELEC_TRANSFORMER') },
            { id: 'el-fuse', label: 'Safety Fuse', onClick: () => addAtPos('ELEC_FUSE') },
            { id: 'el-sw', label: 'SPST Knife Switch', onClick: () => addAtPos('ELEC_SWITCH') },
            { id: 'el-spdt', label: 'SPDT Selector Switch', onClick: () => addAtPos('ELEC_SPDT_SWITCH') },
            { id: 'el-vm', label: 'DC Voltmeter', onClick: () => addAtPos('ELEC_VOLTMETER') },
            { id: 'el-am', label: 'DC Ammeter', onClick: () => addAtPos('ELEC_AMMETER') },
            { id: 'el-ohm', label: 'Digital Ohmmeter', onClick: () => addAtPos('ELEC_OHMMETER') },
            { id: 'el-gnd', label: 'Earth Ground (0V)', onClick: () => addAtPos('ELEC_GROUND') },
          ],
        },
        {
          id: 'add-flowchart',
          label: 'Add Flowchart Block',
          icon: GitFork,
          submenu: [
            { id: 'fc-start', label: 'Start Terminator', onClick: () => addAtPos('FLOW_START') },
            { id: 'fc-end', label: 'End / Stop Terminal', onClick: () => addAtPos('FLOW_END') },
            { id: 'fc-proc', label: 'Process / Action Block', onClick: () => addAtPos('FLOW_PROCESS') },
            { id: 'fc-dec', label: 'Decision (Diamond IF)', onClick: () => addAtPos('FLOW_DECISION') },
            { id: 'fc-in', label: 'Input Block (Read)', onClick: () => addAtPos('FLOW_INPUT') },
            { id: 'fc-out', label: 'Output Block (Print)', onClick: () => addAtPos('FLOW_OUTPUT') },
            { id: 'fc-conn', label: 'Junction Connector', onClick: () => addAtPos('FLOW_CONNECTOR') },
            { id: 'fc-sub', label: 'Subroutine / Procedure Call', onClick: () => addAtPos('FLOW_SUBROUTINE') },
          ],
        },
        {
          id: 'div-canvas-ctrl',
          label: '',
          divider: true,
        },
        {
          id: 'zoom-in',
          label: 'Zoom In (+15%)',
          icon: ZoomIn,
          shortcut: '+',
          onClick: () => handleZoomChange(sheet.zoom + 0.15),
        },
        {
          id: 'zoom-out',
          label: 'Zoom Out (-15%)',
          icon: ZoomOut,
          shortcut: '-',
          onClick: () => handleZoomChange(sheet.zoom - 0.15),
        },
        {
          id: 'reset-view',
          label: 'Reset View / Fit (100%)',
          icon: Maximize2,
          shortcut: '0',
          onClick: () => onUpdateSheet({ zoom: 1.0, pan: { x: 80, y: 80 } }),
        },
        {
          id: 'toggle-grid',
          label: `${showGrid ? 'Hide' : 'Show'} Canvas Grid`,
          icon: Grid,
          shortcut: 'G',
          onClick: () => onToggleGrid?.(),
        },
        {
          id: 'toggle-snap',
          label: `${snapToGrid ? 'Disable' : 'Enable'} Snap to Grid`,
          icon: Magnet,
          onClick: () => onToggleSnap?.(),
        },
        {
          id: 'div-sim',
          label: '',
          divider: true,
        },
        {
          id: 'toggle-sim',
          label: simulationRunning ? 'Pause Simulation' : 'Run Simulation',
          icon: simulationRunning ? Pause : Play,
          shortcut: 'Space',
          onClick: () => onTogglePlayPause(),
        },
        {
          id: 'step-sim',
          label: 'Single Step Tick',
          icon: SkipForward,
          shortcut: 'T',
          onClick: () => onStepSimulation(),
        },
        {
          id: 'undo',
          label: 'Undo Action',
          icon: Undo2,
          shortcut: 'Ctrl+Z',
          disabled: !canUndo,
          onClick: () => onUndo?.(),
        },
        {
          id: 'redo',
          label: 'Redo Action',
          icon: Redo2,
          shortcut: 'Ctrl+Y',
          disabled: !canRedo,
          onClick: () => onRedo?.(),
        },
        {
          id: 'div-sheet',
          label: '',
          divider: true,
        },
        {
          id: 'new-sheet',
          label: 'New Sheet in Project',
          icon: FilePlus,
          onClick: () => onCreateSheet?.(),
        },
      ];

      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        title: 'Canvas Workspace',
        items,
      });
    },
    [
      sheet.pan,
      sheet.zoom,
      sheet.nodes,
      onPaste,
      onAddComponent,
      onUpdateSheet,
      handleZoomChange,
      showGrid,
      onToggleGrid,
      snapToGrid,
      onToggleSnap,
      simulationRunning,
      onTogglePlayPause,
      onStepSimulation,
      canUndo,
      onUndo,
      canRedo,
      onRedo,
      onCreateSheet,
    ]
  );

  // Start wire creation from a pin
  const handleStartWire = (pin: Pin, e: React.MouseEvent | React.TouchEvent) => {
    const node = sheet.nodes.find((n) => n.id === pin.nodeId);
    if (!node) return;

    const startX = node.x + pin.offsetX;
    const startY = node.y + pin.offsetY;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const worldPos = screenToWorld(clientX, clientY);

    setDraggingWire({
      fromNodeId: pin.nodeId,
      fromPinId: pin.id,
      fromPinType: pin.type,
      startX,
      startY,
      currentX: worldPos.x,
      currentY: worldPos.y,
    });
  };

  // Connect wire on destination pin (direct target release or click)
  const handleEndWire = (targetPin: Pin, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!draggingWire) return;

    if (draggingWire.fromPinId === targetPin.id) {
      setDraggingWire(null);
      return;
    }

    if (draggingWire.fromPinType === targetPin.type) {
      setDraggingWire(null);
      return;
    }

    const isStartOutput = draggingWire.fromPinType === 'output';
    const sourceNodeId = isStartOutput ? draggingWire.fromNodeId : targetPin.nodeId;
    const sourcePinId = isStartOutput ? draggingWire.fromPinId : targetPin.id;
    const destNodeId = isStartOutput ? targetPin.nodeId : draggingWire.fromNodeId;
    const destPinId = isStartOutput ? targetPin.id : draggingWire.fromPinId;

    connectWire(sourcePinId, destPinId, sourceNodeId, destNodeId);
    setDraggingWire(null);
  };

  // Drag & drop from component palette
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/logicflow-type');
    if (!type) return;

    const worldPos = screenToWorld(e.clientX, e.clientY);

    let customLabel: string | undefined;
    let varName: string | undefined;

    if (type === 'SWITCH' || type === 'BUTTON') {
      const usedVars = new Set(
        sheet.nodes
          .filter((n) => n.type === 'SWITCH' || n.type === 'BUTTON')
          .map((n) => n.state.variableName || n.label)
      );
      const varCandidates = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      varName = varCandidates.find((v) => !usedVars.has(v)) || `IN${sheet.nodes.length + 1}`;
      customLabel = varName;
    } else if (type === 'PROBE') {
      const usedVars = new Set(
        sheet.nodes
          .filter((n) => n.type === 'PROBE')
          .map((n) => n.state.variableName || n.label)
      );
      const varCandidates = ['Y', 'Z', 'F', 'Q', 'OUT1', 'OUT2'];
      varName = varCandidates.find((v) => !usedVars.has(v)) || `OUT${sheet.nodes.length + 1}`;
      customLabel = varName;
    }

    const newNode = createDefaultNode(
      type as any,
      snapCoord(worldPos.x - 45),
      snapCoord(worldPos.y - 30),
      undefined,
      varName ? { variableName: varName } : undefined,
      customLabel
    );

    onUpdateSheet({ nodes: [...sheet.nodes, newNode] });
    onSelectNode(newNode.id);
    sound.playClick();
  };

  // Handle gate input count adjustment from Inspector [-] [+]
  const handleInputCountChange = (delta: number) => {
    if (!selectedNode) return;
    const currentCount = selectedNode.inputs.length || 2;
    const newCount = Math.max(2, Math.min(8, currentCount + delta));
    if (newCount === currentCount) return;

    const reconfiguredNode = updateGateInputCount(selectedNode, newCount);
    const validPinIds = new Set(reconfiguredNode.inputs.map((p) => p.id));

    // Remove any wires whose pins are no longer present
    const validWires = sheet.wires.filter(
      (w) => w.toNodeId !== reconfiguredNode.id || validPinIds.has(w.toPinId)
    );

    const updatedNodes = sheet.nodes.map((n) =>
      n.id === reconfiguredNode.id ? reconfiguredNode : n
    );

    onUpdateSheet({ nodes: updatedNodes, wires: validWires });
    sound.playClick();
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent deselecting or panning when touching inside inspector or interactive overlays
    const target = e.target as HTMLElement | null;
    if (target?.closest?.('#logicflow-inspector, .logicflow-export-ignore, [data-export-ignore], .wire-delete-btn, .wire-group, .wire-label, button, input, select, textarea')) {
      return;
    }

    if (e.touches.length === 1) {
      onSelectNode(null);
      onSelectWire(null);
      setIsPanning(true);
      setPanStart({
        x: e.touches[0].clientX - sheet.pan.x,
        y: e.touches[0].clientY - sheet.pan.y,
      });
      touchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      setIsPanning(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistanceRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      if (isPanning) {
        scheduleSheetUpdate({
          pan: {
            x: e.touches[0].clientX - panStart.x,
            y: e.touches[0].clientY - panStart.y,
          },
        });
      } else if (draggedNodeId) {
        const worldPos = screenToWorld(e.touches[0].clientX, e.touches[0].clientY);
        const targetX = snapCoord(worldPos.x - dragNodeOffset.x);
        const targetY = snapCoord(worldPos.y - dragNodeOffset.y);

        const anchorInitial = dragAnchorInitialPosRef.current;
        const deltaX = targetX - anchorInitial.x;
        const deltaY = targetY - anchorInitial.y;

        const updatedNodes = sheet.nodes.map((node) => {
          const initialPos = initialDragPositionsRef.current.get(node.id);
          if (initialPos) {
            return {
              ...node,
              x: initialPos.x + deltaX,
              y: initialPos.y + deltaY,
            };
          }
          if (node.id === draggedNodeId) {
            return { ...node, x: targetX, y: targetY };
          }
          return node;
        });
        scheduleSheetUpdate({ nodes: updatedNodes });
      } else if (draggingWire) {
        const worldPos = screenToWorld(e.touches[0].clientX, e.touches[0].clientY);
        const nearest = getNearestTargetPin(worldPos.x, worldPos.y, draggingWire, 36);
        setDraggingWire({
          ...draggingWire,
          currentX: nearest ? nearest.x : worldPos.x,
          currentY: nearest ? nearest.y : worldPos.y,
          hoverPinId: nearest ? nearest.pin.id : undefined,
          isSnapped: !!nearest,
        });
      }
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const factor = dist / touchDistanceRef.current;
      const newZoom = Math.min(Math.max(sheet.zoom * factor, 0.3), 3.0);
      touchDistanceRef.current = dist;
      onUpdateSheet({ zoom: newZoom });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setDraggedNodeId(null);

    if (draggingWire) {
      if (draggingWire.hoverPinId) {
        let foundPin: Pin | null = null;
        for (const n of sheet.nodes) {
          const p = [...n.inputs, ...n.outputs].find((x) => x.id === draggingWire.hoverPinId);
          if (p) {
            foundPin = p;
            break;
          }
        }

        if (foundPin) {
          const isStartOutput = draggingWire.fromPinType === 'output';
          const sourceNodeId = isStartOutput ? draggingWire.fromNodeId : foundPin.nodeId;
          const sourcePinId = isStartOutput ? draggingWire.fromPinId : foundPin.id;
          const destNodeId = isStartOutput ? foundPin.nodeId : draggingWire.fromNodeId;
          const destPinId = isStartOutput ? foundPin.id : draggingWire.fromPinId;
          connectWire(sourcePinId, destPinId, sourceNodeId, destNodeId);
        }
      }
      setDraggingWire(null);
    }
    touchDistanceRef.current = null;
  };

  // Is the selected node a configurable logic gate?
  const isConfigurableGate =
    selectedNode && ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR'].includes(selectedNode.type);

  const getComponentFriendlyName = (type?: string) => {
    switch (type) {
      case 'AND': return 'AND Gate';
      case 'OR': return 'OR Gate';
      case 'NAND': return 'NAND Gate';
      case 'NOR': return 'NOR Gate';
      case 'XOR': return 'XOR Gate';
      case 'XNOR': return 'XNOR Gate';
      case 'NOT': return 'NOT Gate (Inverter)';
      case 'BUFFER': return 'Buffer';
      case 'TRI_STATE': return 'Tri-State Buffer';
      case 'SWITCH': return 'Toggle Switch';
      case 'BUTTON': return 'Push Button';
      case 'CLOCK': return 'Clock Pulse Oscillator';
      case 'HIGH_CONST': return 'High Constant (1)';
      case 'LOW_CONST': return 'Low Constant (0)';
      case 'LED': return 'Light Bulb';
      case 'SEVEN_SEG': return '4-Bit Digit Display';
      case 'PROBE': return 'Digital Logic Probe';
      case 'BUZZER': return 'Piezo Buzzer Alarm';
      case 'D_FLIP_FLOP': return 'D Flip-Flop';
      case 'T_FLIP_FLOP': return 'T Flip-Flop';
      case 'JK_FLIP_FLOP': return 'JK Flip-Flop';
      case 'SR_FLIP_FLOP': return 'SR Flip-Flop';
      case 'HALF_ADDER': return 'Half Adder';
      case 'FULL_ADDER': return 'Full Adder';
      case 'MUX_2TO1': return '2:1 Multiplexer';
      case 'DEMUX_1TO2': return '1:2 Demultiplexer';
      case 'SUBCIRCUIT':
      case 'SUB_CIRCUIT': return 'Sub-Circuit IC Module';
      case 'ELEC_RESISTOR': return 'Precision Resistor';
      case 'ELEC_CAPACITOR': return 'Filter / Decoupling Capacitor';
      case 'ELEC_INDUCTOR': return 'Inductor Choke Coil';
      case 'ELEC_DIODE': return 'PN Junction Rectifier Diode';
      case 'ELEC_ZENER': return 'Zener Voltage Regulator Diode';
      case 'ELEC_LED': return 'Electric LED Indicator';
      case 'ELEC_BATTERY': return 'DC Battery Source';
      case 'ELEC_GROUND': return 'Circuit Ground Earth Reference (0V)';
      case 'ELEC_AC_SOURCE': return 'AC Alternating Voltage Generator';
      case 'ELEC_NPN': return 'NPN Bipolar Junction Transistor (BJT)';
      case 'ELEC_PNP': return 'PNP Bipolar Junction Transistor (BJT)';
      case 'ELEC_POTENTIOMETER': return 'Rotary Potentiometer / Rheostat';
      case 'ELEC_SWITCH': return 'SPST Toggle Power Switch';
      case 'ELEC_SPDT_SWITCH': return 'SPDT Selector Switch';
      case 'ELEC_FUSE': return 'Overcurrent Protection Fuse';
      case 'ELEC_TRANSFORMER': return 'AC Step-Down / Step-Up Transformer';
      case 'ELEC_OPAMP': return 'Operational Amplifier (Op-Amp)';
      case 'ELEC_VOLTMETER': return 'Digital DC Voltmeter';
      case 'ELEC_AMMETER': return 'Digital DC Ammeter';
      case 'ELEC_OHMMETER': return 'Digital Precision Ohmmeter';
      case 'FLOW_START': return 'Algorithm Start Terminal';
      case 'FLOW_END': return 'Algorithm End / Stop Terminal';
      case 'FLOW_PROCESS': return 'Process / Action Statement';
      case 'FLOW_DECISION': return 'Decision / Condition Diamond';
      case 'FLOW_INPUT': return 'Input Data Block (Read)';
      case 'FLOW_OUTPUT': return 'Output Data Block (Print)';
      case 'FLOW_CONNECTOR': return 'Flow Junction / Connector';
      case 'FLOW_SUBROUTINE': return 'Subroutine / Function Call';
      default: return 'Circuit Component';
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      ref={containerRef}
      id="logicflow-canvas"
      className={`relative flex-1 w-full h-full overflow-hidden ${
        isDark ? 'bg-[#0b0f19]' : 'bg-[#e4e7ec]'
      } ${
        canvasTool === 'select'
          ? marquee
            ? 'cursor-crosshair'
            : 'cursor-default'
          : isPanning
          ? 'cursor-grabbing'
          : 'cursor-grab'
      } select-none`}
      style={{ touchAction: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onContextMenu={handleCanvasContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchEndCapture={handleTouchEnd}
    >
      {/* Canvas Tool Switcher (Top-Left): Select (V) & Pan (H) */}
      <div
        data-export-ignore="true"
        className="logicflow-export-ignore absolute top-4 left-4 z-30"
      >
        <div className="btn-group shadow-md" role="group" aria-label="Canvas tools">
          <button
            type="button"
            onClick={() => setCanvasTool('select')}
            className={`btn btn-sm ${
              canvasTool === 'select'
                ? 'btn-primary'
                : 'btn-outline-secondary'
            }`}
            title="Selection Tool (V): Drag marquee box to select multiple components or move them together. Shift+Click to toggle."
          >
            <MousePointer size={14} />
            <span className="hidden sm:inline">Select</span>
          </button>

          <button
            type="button"
            onClick={() => setCanvasTool('pan')}
            className={`btn btn-sm ${
              canvasTool === 'pan'
                ? 'btn-primary'
                : 'btn-outline-secondary'
            }`}
            title="Pan Tool (H): Click & drag canvas to navigate. (Hold Space anytime to pan)."
          >
            <Hand size={14} />
            <span className="hidden sm:inline">Pan</span>
          </button>
        </div>
      </div>

      {/* Multi-Selection Floating Action Bar (Top-Center) */}
      {selectedNodeIds.length >= 2 && (
        <div
          data-export-ignore="true"
          className={`logicflow-export-ignore absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center rounded-xl shadow-2xl px-3.5 py-2 gap-2 border transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
            isDark
              ? 'bg-[#1b2026]/95 border-sky-500/40 text-slate-100 backdrop-blur-md shadow-sky-950/40'
              : 'bg-white/95 border-sky-400/60 text-slate-800 backdrop-blur-md shadow-xl'
          }`}
        >
          <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-300 dark:border-slate-700">
            <Layers size={15} className="text-sky-500" />
            <span className="text-xs font-bold whitespace-nowrap">
              {selectedNodeIds.length} components selected
            </span>
          </div>

          {onGroupSubcircuit && (
            <button
              type="button"
              onClick={() => {
                setSubcircuitModalName(
                  `Sub-Circuit ${
                    sheet.nodes.filter((n) => n.type === 'SUBCIRCUIT').length + 1
                  }`
                );
                setIsGroupModalOpen(true);
              }}
              className="btn btn-primary btn-sm flex items-center gap-1.5"
              title="Group selected components into a reusable Sub-Circuit IC module"
            >
              <Layers size={14} />
              <span>Group into Sub-Circuit</span>
            </button>
          )}

          {onDuplicateNodes && (
            <button
              type="button"
              onClick={() => onDuplicateNodes(selectedNodeIds)}
              className="btn btn-outline-secondary btn-sm flex items-center gap-1.5"
              title="Duplicate selected components (Ctrl+D)"
            >
              <Copy size={13} />
              <span className="hidden sm:inline">Duplicate</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (onDeleteNodes) {
                onDeleteNodes(selectedNodeIds);
              } else {
                selectedNodeIds.forEach((id) => onDeleteNode(id));
              }
            }}
            className="btn btn-outline-danger btn-sm flex items-center gap-1.5"
            title="Delete selected components (Del)"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Delete</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectNodes?.([]);
              onSelectNode(null);
            }}
            className="btn btn-sm btn-icon btn-outline-secondary ml-1"
            title="Clear Selection (Esc)"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Selected Wire Floating Action Bar (Top-Center) */}
      {selectedWireId && !selectedNode && (!selectedNodeIds || selectedNodeIds.length === 0) && (() => {
        const wire = sheet.wires.find((w) => w.id === selectedWireId);
        if (!wire) return null;
        return (
          <div
            data-export-ignore="true"
            className={`logicflow-export-ignore absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center rounded-xl shadow-xl px-3 py-1.5 gap-2.5 border transition-all animate-in fade-in slide-in-from-top-2 duration-150 ${
              isDark
                ? 'bg-[#1b2026]/95 border-sky-500/40 text-slate-100 backdrop-blur-md shadow-sky-950/40'
                : 'bg-white/95 border-sky-400/60 text-slate-800 backdrop-blur-md shadow-xl'
            }`}
          >
            <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-300 dark:border-slate-700 text-xs">
              <Tag size={14} className="text-sky-500" />
              <span className="font-semibold text-slate-400">Wire:</span>
              <span className="font-mono font-bold text-sky-400">
                {wire.label || '<unnamed>'}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  wire.value
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'bg-slate-700/30 text-slate-400 border border-slate-700/40'
                }`}
              >
                {wire.value ? 'HIGH (1)' : 'LOW (0)'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleStartEditWire(wire.id)}
              className="btn btn-primary btn-sm flex items-center gap-1.5"
              title="Double-click wire on canvas or click here to rename wire"
            >
              <Pencil size={12} />
              <span>{wire.label ? 'Rename Wire' : 'Name Wire'}</span>
            </button>

            <button
              type="button"
              onClick={() => onDeleteWire(wire.id)}
              className="btn btn-outline-danger btn-sm flex items-center gap-1.5"
              title="Delete Wire (Del / Backspace)"
            >
              <Trash2 size={12} />
              <span className="hidden sm:inline">Delete</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectWire(null)}
              className="btn btn-sm btn-icon btn-outline-secondary"
              title="Deselect Wire (Esc)"
            >
              <X size={14} />
            </button>
          </div>
        );
      })()}

      {/* Marquee Selection Rectangle Overlay */}
      {marquee && (
        <div
          data-export-ignore="true"
          className="logicflow-export-ignore absolute pointer-events-none z-40 border-2 border-dashed border-sky-500 bg-sky-500/15 rounded transition-none shadow-sm"
          style={{
            left: `${Math.min(marquee.startX, marquee.currentX)}px`,
            top: `${Math.min(marquee.startY, marquee.currentY)}px`,
            width: `${Math.abs(marquee.currentX - marquee.startX)}px`,
            height: `${Math.abs(marquee.currentY - marquee.startY)}px`,
          }}
        />
      )}

      {/* Sub-Circuit Grouping Modal */}
      {isGroupModalOpen && (
        <div
          data-export-ignore="true"
          className="logicflow-export-ignore fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setIsGroupModalOpen(false)}
        >
          <div
            className={`w-full max-w-md rounded-2xl p-5 shadow-2xl border ${
              isDark ? 'bg-[#1b2026] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-500/15 flex items-center justify-center">
                  <img src="/logo.png" alt="" className="w-5 h-5 object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Group into Sub-Circuit</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Package {selectedNodeIds.length} components into a reusable module
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Sub-Circuit IC Name
                </label>
                <input
                  type="text"
                  value={subcircuitModalName}
                  onChange={(e) => setSubcircuitModalName(e.target.value)}
                  placeholder="e.g., Half Adder, 1-bit ALU, Register"
                  className={`w-full px-3 py-2 text-xs rounded-lg border font-medium focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-sky-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'
                  }`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && onGroupSubcircuit) {
                      onGroupSubcircuit(selectedNodeIds, subcircuitModalName);
                      setIsGroupModalOpen(false);
                    }
                  }}
                />
              </div>

              <div
                className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                  isDark
                    ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex justify-between font-medium">
                  <span>Selected Components:</span>
                  <span className="font-bold text-sky-500">{selectedNodeIds.length}</span>
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Internal connections and states are encapsulated into a new schematic sheet, exposed on the current canvas as a unified multi-pin IC chip.
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="btn btn-outline-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onGroupSubcircuit) {
                    onGroupSubcircuit(selectedNodeIds, subcircuitModalName);
                  }
                  setIsGroupModalOpen(false);
                }}
                className="btn btn-primary btn-sm"
              >
                Create Sub-Circuit Module
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crisp Grid Lines */}
      {showGrid && (
        <svg id="logicflow-grid-svg" className="absolute inset-0 w-full h-full pointer-events-none opacity-80">
          <defs>
            <pattern
              id="logicflow-canvas-grid"
              x={sheet.pan.x % (20 * sheet.zoom)}
              y={sheet.pan.y % (20 * sheet.zoom)}
              width={20 * sheet.zoom}
              height={20 * sheet.zoom}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${20 * sheet.zoom} 0 L 0 0 0 ${20 * sheet.zoom}`}
                fill="none"
                stroke={isDark ? '#1e293b' : '#cbd5e1'}
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#logicflow-canvas-grid)" />
        </svg>
      )}

      {/* World Transform Container */}
      <div
        className="absolute origin-top-left will-change-transform"
        style={{
          transform: `translate(${sheet.pan.x}px, ${sheet.pan.y}px) scale(${sheet.zoom})`,
        }}
      >
        {/* SVG Wire Layer */}
        <svg
          className="absolute top-0 left-0 overflow-visible pointer-events-none"
          style={{ width: '1px', height: '1px' }}
        >
          <WireRenderer
            wires={sheet.wires}
            nodes={sheet.nodes}
            selectedWireId={selectedWireId}
            draggingWire={draggingWire}
            wireStyle={wireStyle}
            theme={theme}
            showWireExpressions={showWireExpressions}
            onSelectWire={onSelectWire}
            onDeleteWire={onDeleteWire}
            onDoubleClickWire={handleStartEditWire}
            editingWireId={editingWireId}
            onContextMenuWire={handleWireContextMenu}
          />
        </svg>

        {/* Active Inline Wire Label Editor */}
        {editingWireId && (() => {
          const wire = sheet.wires.find((w) => w.id === editingWireId);
          if (!wire) return null;
          const sourceNode = sheet.nodes.find((n) => n.id === wire.fromNodeId);
          const targetNode = sheet.nodes.find((n) => n.id === wire.toNodeId);
          if (!sourceNode || !targetNode) return null;
          const sourcePin = sourceNode.outputs.find((p) => p.id === wire.fromPinId);
          const targetPin = targetNode.inputs.find((p) => p.id === wire.toPinId);
          if (!sourcePin || !targetPin) return null;

          const x1 = sourceNode.x + sourcePin.offsetX;
          const y1 = sourceNode.y + sourcePin.offsetY;
          const x2 = targetNode.x + targetPin.offsetX;
          const y2 = targetNode.y + targetPin.offsetY;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const labelY = (showWireExpressions || selectedWireId === wire.id) ? midY - 32 : midY - 18;

          return (
            <div
              className="absolute z-50 pointer-events-auto transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${midX}px`, top: `${labelY}px` }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveWireLabel(wire.id, editingWireText);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border shadow-xl transition-all ${
                  isDark
                    ? 'bg-[#0f172a] border-sky-500 shadow-sky-950/70 text-white'
                    : 'bg-white border-sky-500 shadow-slate-300/80 text-slate-900'
                }`}
              >
                <Tag size={13} className="text-sky-400 shrink-0" />
                <input
                  ref={wireInputRef}
                  type="text"
                  value={editingWireText}
                  onChange={(e) => setEditingWireText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSaveWireLabel(wire.id, editingWireText);
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCancelEditWire();
                    }
                  }}
                  onBlur={() => {
                    handleSaveWireLabel(wire.id, editingWireText);
                  }}
                  placeholder="Wire name (e.g. CLK)..."
                  className={`w-36 px-2 py-1 text-xs font-mono font-bold rounded focus:outline-none border ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-sky-300 placeholder-slate-500 focus:border-sky-400'
                      : 'bg-slate-50 border-slate-200 text-sky-900 placeholder-slate-400 focus:border-sky-500'
                  }`}
                  maxLength={24}
                  autoFocus
                />
                <button
                  type="submit"
                  title="Save wire name (Enter)"
                  className="p-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <Check size={13} />
                </button>
                <button
                  type="button"
                  title="Cancel (Esc)"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelEditWire();
                  }}
                  className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X size={13} />
                </button>
              </form>
            </div>
          );
        })()}

        {/* HTML Components Layer */}
        <div className="absolute top-0 left-0 pointer-events-auto">
          {sheet.nodes.map((node) => (
            <NodeComponent
              key={node.id}
              node={node}
              isSelected={
                (selectedNodeIds && selectedNodeIds.length > 0
                  ? selectedNodeIds.includes(node.id)
                  : selectedNodeId === node.id) || marqueePreviewIds.includes(node.id)
              }
              theme={theme}
              showVariables={showComponentVariables}
              onSelect={handleNodeSelect}
              onInspect={handleInspectNode}
              onDelete={onDeleteNode}
              onStartWire={handleStartWire}
              onEndWire={handleEndWire}
              onToggleSwitch={onToggleSwitch}
              onButtonPress={onButtonPress}
              onUpdateState={onUpdateNodeState}
              onUpdateLabel={(nodeId, newLabel) =>
                onUpdateNodeState(nodeId, { variableName: newLabel })
              }
              onContextMenuNode={handleNodeContextMenu}
            />
          ))}
        </div>
      </div>

      {/* Bottom Simulation Controls (Bottom-Left) */}
      <div
        data-export-ignore="true"
        className={`logicflow-export-ignore absolute bottom-4 left-4 z-30 flex items-center rounded-lg shadow-xl overflow-hidden p-1 gap-1 select-none border transition-colors ${
          isDark ? 'bg-[#202428] border-[#33383f]' : 'bg-white/95 border-slate-300 shadow-md'
        }`}
      >
        <button
          type="button"
          onClick={onTogglePlayPause}
          className={`p-2 rounded flex items-center justify-center transition-colors ${
            simulationRunning
              ? 'bg-[#0284c7] text-white hover:bg-[#0369a1]'
              : isDark
              ? 'text-slate-300 hover:bg-[#2b3137]'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title={simulationRunning ? 'Pause Simulation' : 'Run Simulation'}
        >
          <Play size={16} fill={simulationRunning ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          onClick={onTogglePlayPause}
          className={`p-2 rounded flex items-center justify-center transition-colors ${
            !simulationRunning
              ? 'bg-[#f59e0b] text-white hover:bg-[#d97706]'
              : isDark
              ? 'text-slate-300 hover:bg-[#2b3137]'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Pause Simulation"
        >
          <Pause size={16} />
        </button>
        <button
          type="button"
          onClick={onStepSimulation}
          className={`p-2 rounded flex items-center justify-center transition-colors ${
            isDark
              ? 'text-slate-300 hover:bg-[#2b3137] hover:text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Single Step Simulation"
          aria-label="Single Step Simulation"
        >
          <SkipForward size={16} />
        </button>
        <div className={`h-5 w-px mx-1 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
        <span
          className={`text-[11px] font-mono px-2 font-medium ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          {simulationRunning ? 'Running (1.0 kHz)' : 'Paused'}
        </span>
      </div>

      {/* Bottom Zoom Controls (Bottom-Right) */}
      <div
        data-export-ignore="true"
        className={`logicflow-export-ignore absolute bottom-4 right-4 z-30 flex items-center rounded-lg shadow-xl px-3 py-1.5 gap-2.5 select-none border transition-colors ${
          isDark ? 'bg-[#202428] border-[#33383f] text-slate-300' : 'bg-white/95 border-slate-300 text-slate-700 shadow-md'
        }`}
      >
        <button
          type="button"
          onClick={() => handleZoomChange(sheet.zoom - 0.15)}
          className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-950'}`}
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>

        <input
          type="range"
          min="0.3"
          max="2.5"
          step="0.05"
          value={sheet.zoom}
          onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
          className="w-24 h-1.5 bg-slate-400/40 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
        />

        <button
          type="button"
          onClick={() => handleZoomChange(sheet.zoom + 0.15)}
          className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-950'}`}
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>

        <button
          type="button"
          onClick={() => onUpdateSheet({ zoom: 1.0, pan: { x: 80, y: 80 } })}
          className={`text-xs font-mono font-semibold transition-colors ml-1 ${
            isDark ? 'text-slate-200 hover:text-[#38bdf8]' : 'text-slate-800 hover:text-sky-600'
          }`}
          title="Reset to 100%"
        >
          {Math.round(sheet.zoom * 100)}%
        </button>
      </div>

      {/* Floating Inspector Panel (Bottom-Right corner) */}
      {isInspectorOpen && selectedNode && (
        <div
          id="logicflow-inspector"
          data-export-ignore="true"
          className={`logicflow-export-ignore absolute bottom-20 right-3 sm:right-4 z-40 w-[calc(100vw-1.5rem)] sm:w-72 md:w-80 max-h-[calc(100vh-7.5rem)] overflow-y-auto rounded-xl shadow-2xl border transition-colors overscroll-contain cursor-default ${
            isDark
              ? 'bg-[#1b2026] border-[#2e353f] text-slate-100 shadow-black/60'
              : 'bg-white border-slate-300 text-slate-800 shadow-xl'
          }`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Header with cyan logic gate icon + LogicFlow branding + close button */}
          <div
            className={`flex items-center justify-between px-3 py-2 border-b transition-colors ${
              isDark ? 'bg-[#22272e] border-[#2d333b]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="" className="w-4 h-4 object-contain" />
              <span
                className={`font-bold text-xs tracking-wider ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                LogixFlow
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsInspectorOpen(false)}
              className={`p-1 rounded transition-colors ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title="Close Inspector"
            >
              <X size={13} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-3.5 flex flex-col gap-3">
            {/* Component Title */}
            <div>
              <h3 className="text-sm font-bold text-[#0284c7] dark:text-[#38bdf8] leading-tight">
                {getComponentFriendlyName(selectedNode.type)}
              </h3>
              <p
                className={`text-[10px] font-mono mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                ID: {selectedNode.id.slice(0, 10)}
              </p>
            </div>

            {/* Input Count Stepper for multi-input logic gates ([-] 2 [+]) */}
            {isConfigurableGate && (
              <div
                className={`flex items-center justify-between p-2 rounded border transition-colors ${
                  isDark
                    ? 'bg-[#15191e] border-[#2b313a]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Input Count
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleInputCountChange(-1)}
                    disabled={selectedNode.inputs.length <= 2}
                    className="w-6 h-6 rounded bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-40 disabled:hover:bg-[#0284c7] flex items-center justify-center text-white text-xs font-bold transition-colors"
                    title="Decrease input count"
                  >
                    <Minus size={12} />
                  </button>
                  <span
                    className={`w-6 text-center text-xs font-mono font-bold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {selectedNode.inputs.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleInputCountChange(1)}
                    disabled={selectedNode.inputs.length >= 8}
                    className="w-6 h-6 rounded bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-40 disabled:hover:bg-[#0284c7] flex items-center justify-center text-white text-xs font-bold transition-colors"
                    title="Increase input count"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Flowchart Process / Subroutine Action Statement */}
            {(selectedNode.type === 'FLOW_PROCESS' || selectedNode.type === 'FLOW_SUBROUTINE') && (
              <div
                className={`flex flex-col gap-1 p-2 rounded border transition-colors ${
                  isDark ? 'bg-[#15191e] border-[#2b313a]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs font-semibold ${
                      isDark ? 'text-sky-300' : 'text-sky-700'
                    }`}
                  >
                    Action Statement
                  </span>
                  <span className="text-[10px] text-slate-400">e.g. sum = sum + i</span>
                </div>
                <input
                  type="text"
                  value={selectedNode.state?.flowAction ?? selectedNode.label ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateNodeState(selectedNode.id, {
                      flowAction: val,
                      customLabel: val,
                    });
                  }}
                  className={`w-full border rounded px-2 py-1 text-xs font-mono focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#22272e] border-slate-600 focus:border-[#38bdf8] text-white'
                      : 'bg-white border-slate-300 focus:border-sky-500 text-slate-900 shadow-2xs'
                  }`}
                  placeholder="x = x + 1, sum = 0"
                />
              </div>
            )}

            {/* Flowchart Decision Condition */}
            {selectedNode.type === 'FLOW_DECISION' && (
              <div
                className={`flex flex-col gap-1 p-2 rounded border transition-colors ${
                  isDark ? 'bg-[#15191e] border-[#2b313a]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs font-semibold ${
                      isDark ? 'text-amber-300' : 'text-amber-700'
                    }`}
                  >
                    Condition Expression
                  </span>
                  <span className="text-[10px] text-slate-400">e.g. i &lt;= N</span>
                </div>
                <input
                  type="text"
                  value={selectedNode.state?.flowCondition ?? selectedNode.label ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateNodeState(selectedNode.id, {
                      flowCondition: val,
                      customLabel: val,
                    });
                  }}
                  className={`w-full border rounded px-2 py-1 text-xs font-mono focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#22272e] border-slate-600 focus:border-[#38bdf8] text-white'
                      : 'bg-white border-slate-300 focus:border-sky-500 text-slate-900 shadow-2xs'
                  }`}
                  placeholder="i <= N"
                />
                <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
                  <span className="text-emerald-500 font-medium">Right Pin: YES</span>
                  <span className="text-rose-500 font-medium">Bottom Pin: NO</span>
                </div>
              </div>
            )}

            {/* Flowchart Input Configuration */}
            {selectedNode.type === 'FLOW_INPUT' && (
              <div
                className={`flex flex-col gap-2 p-2 rounded border transition-colors ${
                  isDark ? 'bg-[#15191e] border-[#2b313a]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span
                    className={`text-xs font-semibold ${
                      isDark ? 'text-purple-300' : 'text-purple-700'
                    }`}
                  >
                    Variable to Read
                  </span>
                  <input
                    type="text"
                    value={selectedNode.state?.flowVarName ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateNodeState(selectedNode.id, {
                        flowVarName: val,
                        flowAction: `Read ${val}`,
                        customLabel: `Read ${val}`,
                      });
                    }}
                    className={`w-full border rounded px-2 py-1 text-xs font-mono focus:outline-none transition-colors ${
                      isDark
                        ? 'bg-[#22272e] border-slate-600 focus:border-[#38bdf8] text-white'
                        : 'bg-white border-slate-300 focus:border-sky-500 text-slate-900 shadow-2xs'
                    }`}
                    placeholder="N"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span
                    className={`text-xs font-medium ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Default Test Value
                  </span>
                  <input
                    type="text"
                    value={selectedNode.state?.flowValue ?? ''}
                    onChange={(e) => {
                      onUpdateNodeState(selectedNode.id, {
                        flowValue: e.target.value,
                      });
                    }}
                    className={`w-full border rounded px-2 py-1 text-xs font-mono focus:outline-none transition-colors ${
                      isDark
                        ? 'bg-[#22272e] border-slate-600 focus:border-[#38bdf8] text-white'
                        : 'bg-white border-slate-300 focus:border-sky-500 text-slate-900 shadow-2xs'
                    }`}
                    placeholder="10"
                  />
                </div>
              </div>
            )}

            {/* Flowchart Output Configuration */}
            {selectedNode.type === 'FLOW_OUTPUT' && (
              <div
                className={`flex flex-col gap-1 p-2 rounded border transition-colors ${
                  isDark ? 'bg-[#15191e] border-[#2b313a]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs font-semibold ${
                      isDark ? 'text-cyan-300' : 'text-cyan-700'
                    }`}
                  >
                    Print Expression
                  </span>
                  <span className="text-[10px] text-slate-400">e.g. "Sum: " + sum</span>
                </div>
                <input
                  type="text"
                  value={selectedNode.state?.flowAction ?? selectedNode.label ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateNodeState(selectedNode.id, {
                      flowAction: val,
                      customLabel: val,
                    });
                  }}
                  className={`w-full border rounded px-2 py-1 text-xs font-mono focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#22272e] border-slate-600 focus:border-[#38bdf8] text-white'
                      : 'bg-white border-slate-300 focus:border-sky-500 text-slate-900 shadow-2xs'
                  }`}
                  placeholder='Print "Result = " + sum'
                />
              </div>
            )}

            {/* Sub-Circuit IC Module Details */}
            {selectedNode.type === 'SUBCIRCUIT' && (
              <div
                className={`flex flex-col gap-2 p-2.5 rounded-lg border transition-colors ${
                  isDark ? 'bg-[#15191e] border-[#2b313a]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
                    Sub-Circuit Module
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-500 font-bold">
                    IC CHIP
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">
                    IC Chip Label
                  </label>
                  <input
                    type="text"
                    value={selectedNode.state?.subcircuitName || selectedNode.label || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateNodeState(selectedNode.id, {
                        subcircuitName: val,
                        customLabel: val,
                      });
                    }}
                    className={`w-full border rounded px-2 py-1 text-xs font-semibold focus:outline-none transition-colors ${
                      isDark
                        ? 'bg-[#22272e] border-slate-600 focus:border-[#38bdf8] text-white'
                        : 'bg-white border-slate-300 focus:border-sky-500 text-slate-900 shadow-2xs'
                    }`}
                    placeholder="Sub-Circuit Name"
                  />
                </div>

                <div className="flex items-center justify-between text-xs py-1 px-1.5 rounded bg-black/10 dark:bg-black/20">
                  <span className="text-[11px] text-slate-400">Pins:</span>
                  <span className="font-mono text-[11px] font-semibold text-slate-300">
                    {selectedNode.inputs.length} IN / {selectedNode.outputs.length} OUT
                  </span>
                </div>
              </div>
            )}

            {/* Variable Name / Label Editing */}
            <div
              className={`flex items-center justify-between p-2 rounded border transition-colors ${
                isDark ? 'bg-[#15191e] border-[#2b313a]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex flex-col">
                <span
                  className={`text-xs font-medium ${
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  }`}
                >
                  Variable Name
                </span>
                <span className="text-[10px] text-slate-400">Shown above component</span>
              </div>
              <input
                type="text"
                value={selectedNode.state?.variableName ?? selectedNode.label ?? ''}
                onChange={(e) => {
                  const val = formatUserVariableInput(e.target.value);
                  onUpdateNodeState(selectedNode.id, { variableName: val });
                }}
                maxLength={10}
                className={`w-20 border rounded px-1.5 py-0.5 text-xs font-mono font-bold text-center focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-[#22272e] border-slate-600 focus:border-[#38bdf8] text-white'
                    : 'bg-white border-slate-300 focus:border-sky-500 text-slate-900 shadow-2xs'
                }`}
                placeholder="A"
              />
            </div>

            {/* Quick Toggle for Switch */}
            {selectedNode.type === 'SWITCH' && (
              <button
                type="button"
                onClick={() => onToggleSwitch(selectedNode.id)}
                className={`w-full py-1.5 px-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs ${
                  selectedNode.state?.isOn
                    ? 'bg-[#0284c7] text-white hover:bg-[#0369a1]'
                    : isDark
                    ? 'bg-[#282e37] text-slate-300 hover:bg-[#323944]'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                <span>State:</span>
                <span>{selectedNode.state?.isOn ? 'HIGH (1)' : 'LOW (0)'}</span>
              </button>
            )}

            {/* Electric SPST Switch Toggle */}
            {selectedNode.type === 'ELEC_SWITCH' && (
              <button
                type="button"
                onClick={() =>
                  onUpdateNodeState(selectedNode.id, {
                    isOn: !selectedNode.state?.isOn,
                  })
                }
                className={`w-full py-1.5 px-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs ${
                  selectedNode.state?.isOn
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : isDark
                    ? 'bg-[#282e37] text-slate-300 hover:bg-[#323944]'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                <span>Knife Switch:</span>
                <span>{selectedNode.state?.isOn ? 'CLOSED (Conducting)' : 'OPEN (Isolated)'}</span>
              </button>
            )}

            {/* Electric SPDT Switch Position */}
            {selectedNode.type === 'ELEC_SPDT_SWITCH' && (
              <div
                className={`flex flex-col gap-1.5 p-2 rounded border transition-colors ${
                  isDark ? 'bg-[#15191e] border-[#2b313a]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  SPDT Output Route
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateNodeState(selectedNode.id, { switchPosition: 'A' })}
                    className={`py-1 px-2 rounded text-xs font-bold transition-colors ${
                      (selectedNode.state?.switchPosition || 'A') === 'A'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : isDark
                        ? 'bg-slate-800 text-slate-400 hover:text-white'
                        : 'bg-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Route A (Top)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateNodeState(selectedNode.id, { switchPosition: 'B' })}
                    className={`py-1 px-2 rounded text-xs font-bold transition-colors ${
                      selectedNode.state?.switchPosition === 'B'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : isDark
                        ? 'bg-slate-800 text-slate-400 hover:text-white'
                        : 'bg-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Route B (Bottom)
                  </button>
                </div>
              </div>
            )}

            {/* Electric Fuse Controls */}
            {selectedNode.type === 'ELEC_FUSE' && (
              <div
                className={`flex flex-col gap-2 p-2 rounded border transition-colors ${
                  isDark ? 'bg-[#15191e] border-[#2b313a]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Fuse Status
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      selectedNode.state?.isFuseBlown
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {selectedNode.state?.isFuseBlown ? 'BLOWN' : 'INTACT'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Current Rating</span>
                  <select
                    value={selectedNode.state?.fuseCurrentRating || 1.0}
                    onChange={(e) =>
                      onUpdateNodeState(selectedNode.id, {
                        fuseCurrentRating: parseFloat(e.target.value),
                      })
                    }
                    className={`border rounded px-2 py-0.5 text-xs font-mono font-bold focus:outline-none transition-colors ${
                      isDark
                        ? 'bg-[#22272e] border-slate-600 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value={0.25}>0.25 A</option>
                    <option value={0.5}>0.5 A</option>
                    <option value={1.0}>1.0 A</option>
                    <option value={2.0}>2.0 A</option>
                    <option value={5.0}>5.0 A</option>
                    <option value={10.0}>10.0 A</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateNodeState(selectedNode.id, {
                      isFuseBlown: !selectedNode.state?.isFuseBlown,
                    })
                  }
                  className={`py-1 px-2 rounded text-xs font-bold transition-colors ${
                    selectedNode.state?.isFuseBlown
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : isDark
                      ? 'bg-slate-800 text-slate-400 hover:text-white'
                      : 'bg-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {selectedNode.state?.isFuseBlown ? 'Replace Blown Fuse' : 'Test Trip Fuse'}
                </button>
              </div>
            )}

            {/* Electric Potentiometer Wiper */}
            {selectedNode.type === 'ELEC_POTENTIOMETER' && (
              <div
                className={`flex flex-col gap-1.5 p-2 rounded border transition-colors ${
                  isDark ? 'bg-[#15191e] border-[#2b313a]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Wiper Position
                  </span>
                  <span className="text-xs font-mono font-bold text-sky-400">
                    {selectedNode.state?.wiperPercent ?? 50}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={selectedNode.state?.wiperPercent ?? 50}
                  onChange={(e) =>
                    onUpdateNodeState(selectedNode.id, {
                      wiperPercent: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>
            )}

            {/* Electric Resistor Value */}
            {selectedNode.type === 'ELEC_RESISTOR' && (
              <div
                className={`flex items-center justify-between p-2 rounded border transition-colors ${
                  isDark ? 'bg-[#15191e] border-[#2b313a]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Resistance
                </span>
                <select
                  value={selectedNode.state?.resistance || 1000}
                  onChange={(e) =>
                    onUpdateNodeState(selectedNode.id, {
                      resistance: parseFloat(e.target.value),
                    })
                  }
                  className={`border rounded px-2 py-0.5 text-xs font-mono font-bold focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#22272e] border-slate-600 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value={100}>100 Ω</option>
                  <option value={220}>220 Ω</option>
                  <option value={470}>470 Ω</option>
                  <option value={1000}>1.0 kΩ</option>
                  <option value={4700}>4.7 kΩ</option>
                  <option value={10000}>10 kΩ</option>
                  <option value={100000}>100 kΩ</option>
                </select>
              </div>
            )}

            {/* Electric Transformer Ratio */}
            {selectedNode.type === 'ELEC_TRANSFORMER' && (
              <div
                className={`flex items-center justify-between p-2 rounded border transition-colors ${
                  isDark ? 'bg-[#15191e] border-[#2b313a]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Turns Ratio (Np:Ns)
                </span>
                <select
                  value={selectedNode.state?.transformerRatio || 0.5}
                  onChange={(e) =>
                    onUpdateNodeState(selectedNode.id, {
                      transformerRatio: parseFloat(e.target.value),
                    })
                  }
                  className={`border rounded px-2 py-0.5 text-xs font-mono font-bold focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#22272e] border-slate-600 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value={10.0}>10:1 (Step Down)</option>
                  <option value={2.0}>2:1 (Step Down)</option>
                  <option value={1.0}>1:1 (Isolation)</option>
                  <option value={0.5}>1:2 (Step Up)</option>
                  <option value={0.1}>1:10 (Step Up)</option>
                </select>
              </div>
            )}

            {/* Electric Meters Measured Value display */}
            {(selectedNode.type === 'ELEC_VOLTMETER' ||
              selectedNode.type === 'ELEC_AMMETER' ||
              selectedNode.type === 'ELEC_OHMMETER') && (
              <div
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-300'
                }`}
              >
                <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Reading
                </span>
                <span className="font-mono text-sm font-bold text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-emerald-500/30">
                  {selectedNode.state?.measuredValue || '0.00'}
                </span>
              </div>
            )}

            {/* Clock Frequency Controller */}
            {selectedNode.type === 'CLOCK' && (
              <div
                className={`flex items-center justify-between p-2 rounded border transition-colors ${
                  isDark ? 'bg-[#15191e] border-[#2b313a]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Frequency
                </span>
                <select
                  value={selectedNode.state?.frequencyHz || 1}
                  onChange={(e) =>
                    onUpdateNodeState(selectedNode.id, {
                      frequencyHz: parseFloat(e.target.value),
                    })
                  }
                  className={`border rounded px-2 py-0.5 text-xs font-mono font-bold focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#22272e] border-slate-600 focus:border-[#38bdf8] text-white'
                      : 'bg-white border-slate-300 focus:border-sky-500 text-slate-900'
                  }`}
                >
                  <option value={0.5}>0.5 Hz</option>
                  <option value={1}>1 Hz</option>
                  <option value={2}>2 Hz</option>
                  <option value={4}>4 Hz</option>
                  <option value={8}>8 Hz</option>
                </select>
              </div>
            )}

            {/* LED Bulb Color Picker */}
            {selectedNode.type === 'LED' && (
              <div
                className={`flex items-center justify-between p-2 rounded border transition-colors ${
                  isDark ? 'bg-[#15191e] border-[#2b313a]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Color
                </span>
                <div className="flex items-center gap-1.5">
                  {[
                    { color: '#10b981', title: 'Green' },
                    { color: '#38bdf8', title: 'Sky Blue' },
                    { color: '#ef4444', title: 'Red' },
                    { color: '#f59e0b', title: 'Amber' },
                    { color: '#a855f7', title: 'Purple' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      title={c.title}
                      onClick={() => onUpdateNodeState(selectedNode.id, { color: c.color })}
                      className={`w-4 h-4 rounded-full transition-transform ${
                        (selectedNode.state?.color || '#10b981') === c.color
                          ? 'scale-125 ring-2 ring-sky-500'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Output State Indicator - Supports all multi-output components */}
            {selectedNode.outputs.length > 0 && (
              <div className="flex flex-col gap-1 py-0.5">
                <span
                  className={`text-xs ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {selectedNode.outputs.length === 1 ? 'Output Logic:' : 'Outputs:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.outputs.map((outPin) => (
                    <span
                      key={outPin.id}
                      className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                        outPin.value
                          ? isDark
                            ? 'bg-sky-950 text-[#38bdf8] border border-sky-800'
                            : 'bg-sky-100 text-sky-800 border border-sky-300'
                          : isDark
                          ? 'bg-slate-900 text-slate-400 border border-slate-700'
                          : 'bg-slate-100 text-slate-600 border border-slate-300'
                      }`}
                    >
                      {outPin.name}: {outPin.value ? '1 (HIGH)' : '0 (LOW)'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Boolean Algebra Expression (if available) */}
            {selectedNode.state?.computedExpression && (
              <div
                className={`flex flex-col gap-1 p-2 rounded border transition-colors ${
                  isDark ? 'bg-[#15191e] border-[#2b313a]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span
                  className={`text-[10px] uppercase font-semibold ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Boolean Formula
                </span>
                <span className="text-xs font-mono font-bold text-[#0284c7] dark:text-[#38bdf8] truncate">
                  {selectedNode.state.computedExpression}
                </span>
              </div>
            )}

            {/* Delete Component Button */}
            <button
              type="button"
              onClick={() => {
                onDeleteNode(selectedNode.id);
                setIsInspectorOpen(false);
              }}
              className="btn btn-outline-danger btn-sm w-full mt-2 flex items-center justify-center gap-1.5"
            >
              <Trash2 size={13} />
              <span>Delete Component</span>
            </button>
          </div>
        </div>
      )}

      {/* Empty State Help hint if canvas is empty */}
      {sheet.nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-slate-500">
          <div
            className={`p-5 sm:p-6 border border-dashed rounded-2xl flex flex-col items-center max-w-sm mx-4 text-center shadow-lg transition-colors backdrop-blur-sm ${
              isDark
                ? 'border-slate-700/80 bg-slate-900/85 text-slate-400'
                : 'border-slate-300 bg-white/90 text-slate-600'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-3 p-2">
              <img src="/logo.png" alt="LogixFlow" className="w-full h-full object-contain" />
            </div>
            <span className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              LogixFlow Circuit Canvas
            </span>
            <p className="text-xs mt-1.5 leading-relaxed">
              <span className="hidden sm:inline">Drag logic gates, switches, and bulbs from the sidebar to start creating your circuit. </span>
              <span className="sm:hidden">Tap the + button above to add your first component. </span>
              Right-click on desktop or double-tap on mobile to inspect properties.
            </p>
          </div>
        </div>
      )}
      {/* Global Right-Click Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          title={contextMenu.title}
          theme={theme}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
