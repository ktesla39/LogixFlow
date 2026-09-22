import { useState, useEffect, useRef, useCallback } from 'react';
import { CircuitNode, DesignFolder, NodeType, Project, Sheet, SimulationSettings, Wire, Pin } from './types';
import { createPresetSheets } from './utils/presets';
import { evaluateCircuit, createDefaultNode } from './utils/circuitSolver';
import { sound } from './utils/sound';
import { TopBar } from './components/TopBar';
import { ComponentPalette } from './components/ComponentPalette';
import { Canvas } from './components/Canvas';
import { SheetTabs } from './components/SheetTabs';
import { TruthTableModal } from './components/TruthTableModal';
import { TimingDiagram, SignalHistory } from './components/TimingDiagram';
import { ExportImportModal } from './components/ExportImportModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { HomeDashboard } from './components/HomeDashboard';
import { FlowchartPanel } from './components/FlowchartPanel';
import { initFlowchartState, stepFlowchart, FlowchartExecutionState } from './utils/flowchartEngine';
import { createFlowchartPresets } from './utils/flowchartPresets';
import { createElectricPresets } from './utils/electricPresets';
import { toSvg } from 'html-to-image';
import { parseDesignDocument, serializeDesignDocument } from './core/designDocument';
import { getProjectDeletionOutcome } from './utils/projectDeletion';

const STORAGE_PROJECTS_KEY = 'LOGICFLOW_PROJECTS_V4';
const STORAGE_ACTIVE_PROJECT_KEY = 'LOGICFLOW_ACTIVE_PROJECT_V4';
const STORAGE_SETTINGS_KEY = 'LOGICFLOW_SETTINGS_V4';

const DEFAULT_SETTINGS: SimulationSettings = {
  running: true,
  clockHz: 1,
  speedMs: 50,
  showGrid: true,
  snapToGrid: true,
  wireStyle: 'curved',
  soundEnabled: true,
  showTimingDiagram: false,
  theme: 'light',
  showWireExpressions: true,
  showComponentVariables: true,
};

interface HistoryEntry {
  projects: Project[];
  activeProjectId: string | null;
}

function createBlankProject(
  name: string = 'Untitled Circuit',
  circuitType: 'logic' | 'flowchart' | 'electric' = 'logic'
): Project {
  const sheetId = `sheet_${Date.now()}`;
  return {
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    circuitType,
    sheets: [
      {
        id: sheetId,
        name:
          circuitType === 'flowchart'
            ? 'Algorithm 1'
            : circuitType === 'electric'
            ? 'Electric Circuit 1'
            : 'Main Circuit',
        circuitType,
        nodes: [],
        wires: [],
        pan: { x: 80, y: 80 },
        zoom: 1,
        updatedAt: Date.now(),
      },
    ],
    activeSheetId: sheetId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function createDefaultProjects(): Project[] {
  const presets = createPresetSheets();
  const flowchartPresets = createFlowchartPresets();
  const electricPresets = createElectricPresets();

  const now = Date.now();
  const proj1: Project = {
    id: 'proj_half_adder',
    name: 'Half Adder & Logic Gates',
    circuitType: 'logic',
    sheets: [presets[1], presets[0], presets[4]],
    activeSheetId: presets[1]?.id || 'sheet_half_adder',
    createdAt: now - 3600000,
    updatedAt: now - 1800000,
  };

  const proj2: Project = {
    id: 'proj_voltage_divider',
    name: 'Voltage Divider & RC Filter',
    circuitType: 'electric',
    sheets: [electricPresets[0]],
    activeSheetId: electricPresets[0]?.id || 'sheet_elec',
    createdAt: now - 7200000,
    updatedAt: now - 3600000,
  };

  const proj3: Project = {
    id: 'proj_counter_algo',
    name: 'Counter & Loop Algorithm',
    circuitType: 'flowchart',
    sheets: [flowchartPresets[0]],
    activeSheetId: flowchartPresets[0]?.id || 'sheet_flow',
    createdAt: now - 10800000,
    updatedAt: now - 5400000,
  };

  return [proj1, proj2, proj3];
}

export default function App() {
  const getRoute = () => {
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (segments[0] !== 'editor' || !segments[1]) {
      return { viewMode: 'home' as const, projectId: null, sheetId: null };
    }
    return {
      viewMode: 'editor' as const,
      projectId: decodeURIComponent(segments[1]),
      sheetId: segments[2] ? decodeURIComponent(segments[2]) : null,
    };
  };

  const initialRoute = getRoute();
  const initialRouteAppliedRef = useRef(false);
  const [viewMode, setViewMode] = useState<'home' | 'editor'>(initialRoute.viewMode);

  // Multi-project repository in localStorage
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROJECTS_KEY);
      if (saved) {
        const parsed = parseDesignDocument(saved);
        if (parsed) return parsed.projects;
      }
    } catch {
      // LocalStorage read error fallback
    }
    return createDefaultProjects();
  });

  const [folders, setFolders] = useState<DesignFolder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROJECTS_KEY);
      const parsed = saved ? parseDesignDocument(saved) : null;
      return parsed?.folders || [];
    } catch {
      return [];
    }
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROJECTS_KEY);
      const parsed = saved ? parseDesignDocument(saved) : null;

      if (initialRoute.projectId) {
        return initialRoute.projectId;
      }

      if (parsed) {
        if (parsed.projects.length === 0) return null;
        if (parsed.activeProjectId && parsed.projects.some((project) => project.id === parsed.activeProjectId)) {
          return parsed.activeProjectId;
        }
      }

      const storedActiveProjectId = localStorage.getItem(STORAGE_ACTIVE_PROJECT_KEY);
      if (storedActiveProjectId && parsed && parsed.projects.some((project) => project.id === storedActiveProjectId)) {
        return storedActiveProjectId;
      }
    } catch {
      // Fallback
    }

    return 'proj_half_adder';
  });

  const navigateTo = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const route = getRoute();
      setViewMode(route.viewMode);
      if (route.projectId) {
        setActiveProjectId(route.projectId);
        if (route.sheetId) {
          setProjects((previous) =>
            previous.map((project) =>
              project.id === route.projectId &&
              project.sheets.some((sheet) => sheet.id === route.sheetId)
                ? { ...project, activeSheetId: route.sheetId as string }
                : project
            )
          );
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [settings, setSettings] = useState<SimulationSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // Fallback
    }
    return DEFAULT_SETTINGS;
  });

  // UI state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isTruthTableOpen, setIsTruthTableOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Floating Toast notification for user actions (copy, paste, cut, duplicate, etc.)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  }, []);

  // Internal clipboard storing copied nodes and internal wires connecting them
  const clipboardRef = useRef<{
    nodes: CircuitNode[];
    wires: Wire[];
    pasteCount: number;
  } | null>(null);

  // Digital oscilloscope signal histories
  const [signals, setSignals] = useState<SignalHistory[]>([]);
  const historyRef = useRef<{ past: HistoryEntry[]; future: HistoryEntry[] }>({
    past: [],
    future: [],
  });
  const [historyRevision, setHistoryRevision] = useState(0);

  // Sound sync
  useEffect(() => {
    sound.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Dark/Light Theme class & Bootstrap data-bs-theme synchronization
  useEffect(() => {
    const isDark = settings.theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }
  }, [settings.theme]);

  // Active Project & Active Sheet resolution
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  const currentSheet: Sheet = (activeProject &&
    (activeProject.sheets.find((s) => s.id === activeProject.activeSheetId) ||
      activeProject.sheets[0])) || {
    id: 'sheet_fallback',
    name: 'Main Circuit',
    nodes: [],
    wires: [],
    pan: { x: 80, y: 80 },
    zoom: 1,
    updatedAt: Date.now(),
  };

  useEffect(() => {
    if (initialRouteAppliedRef.current) return;
    if (initialRoute.viewMode !== 'editor' || !initialRoute.sheetId) {
      initialRouteAppliedRef.current = true;
      return;
    }
    if (!activeProject) return;
    if (!activeProject.sheets.some((sheet) => sheet.id === initialRoute.sheetId)) {
      initialRouteAppliedRef.current = true;
      return;
    }
    if (activeProject.activeSheetId === initialRoute.sheetId) {
      initialRouteAppliedRef.current = true;
      return;
    }
    setProjects((previous) =>
      previous.map((project) =>
        project.id === activeProject.id
          ? { ...project, activeSheetId: initialRoute.sheetId as string }
          : project
      )
    );
      initialRouteAppliedRef.current = true;
  }, [activeProject]);

  useEffect(() => {
    if (viewMode === 'home') {
      if (window.location.pathname !== '/') window.history.replaceState({}, '', '/');
      return;
    }
    if (!activeProject) return;
    if (
      !initialRouteAppliedRef.current ||
      initialRoute.sheetId &&
      activeProject.sheets.some((sheet) => sheet.id === initialRoute.sheetId) &&
      activeProject.activeSheetId !== initialRoute.sheetId
    ) {
      return;
    }
    const sheetId = activeProject.activeSheetId;
    const path = `/editor/${encodeURIComponent(activeProject.id)}${sheetId ? `/${encodeURIComponent(sheetId)}` : ''}`;
    if (window.location.pathname !== path) window.history.replaceState({}, '', path);
  }, [viewMode, activeProject?.id, activeProject?.activeSheetId]);

  const recordHistory = useCallback(() => {
    historyRef.current.past.push({ projects, activeProjectId });
    historyRef.current.future = [];
    setHistoryRevision((revision) => revision + 1);
  }, [projects, activeProjectId]);

  const handleUndo = useCallback(() => {
    const previous = historyRef.current.past.pop();
    if (!previous) return;

    historyRef.current.future.push({ projects, activeProjectId });
    setProjects(previous.projects);
    setActiveProjectId(previous.activeProjectId);
    setSelectedNodeId(null);
    setSelectedWireId(null);
    setHistoryRevision((revision) => revision + 1);
  }, [projects, activeProjectId]);

  const handleRedo = useCallback(() => {
    const next = historyRef.current.future.pop();
    if (!next) return;

    historyRef.current.past.push({ projects, activeProjectId });
    setProjects(next.projects);
    setActiveProjectId(next.activeProjectId);
    setSelectedNodeId(null);
    setSelectedWireId(null);
    setHistoryRevision((revision) => revision + 1);
  }, [projects, activeProjectId]);

  const canUndo = historyRevision >= 0 && historyRef.current.past.length > 0;
  const canRedo = historyRevision >= 0 && historyRef.current.future.length > 0;

  // Debounced persistence keeps drag and simulation updates off the storage path.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_PROJECTS_KEY,
          serializeDesignDocument(projects, activeProjectId, folders)
        );
        if (activeProjectId) {
          localStorage.setItem(STORAGE_ACTIVE_PROJECT_KEY, activeProjectId);
        } else {
          localStorage.removeItem(STORAGE_ACTIVE_PROJECT_KEY);
        }
        localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [projects, activeProjectId, settings, folders]);

  // Update current active project & sheet
  const handleUpdateCurrentSheet = useCallback(
    (updated: Partial<Sheet>) => {
      if (!activeProject) return;

      recordHistory();

      setProjects((prevProjects) =>
        prevProjects.map((p) => {
          if (p.id !== activeProject.id) return p;

          const updatedSheets = p.sheets.map((s) => {
            if (s.id === currentSheet.id) {
              return { ...s, ...updated, updatedAt: Date.now() };
            }
            return s;
          });

          return {
            ...p,
            sheets: updatedSheets,
            updatedAt: Date.now(),
          };
        })
      );
    },
    [activeProject, currentSheet.id, recordHistory]
  );

  // Flowchart Circuit Mode detection
  const isFlowchartSheet =
    currentSheet.circuitType === 'flowchart' ||
    currentSheet.nodes.some((n) => n.type.startsWith('FLOW_'));

  // Flowchart execution engine state
  const [flowchartState, setFlowchartState] = useState<FlowchartExecutionState>(() =>
    initFlowchartState(currentSheet.nodes)
  );
  const [isFlowchartRunning, setIsFlowchartRunning] = useState<boolean>(false);
  const [flowchartSpeedMs, setFlowchartSpeedMs] = useState<number>(450);

  // Sync flowchart execution state when switching sheets or editing nodes
  useEffect(() => {
    if (isFlowchartSheet) {
      setFlowchartState((prev) => {
        const nodeExists = currentSheet.nodes.some((n) => n.id === prev.activeNodeId);
        if (!nodeExists || prev.status === 'idle') {
          return initFlowchartState(currentSheet.nodes);
        }
        return prev;
      });
    } else {
      setIsFlowchartRunning(false);
    }
  }, [currentSheet.id, isFlowchartSheet]);

  const handleStepFlowchart = useCallback(
    (inputValue?: string | number) => {
      setFlowchartState((prevState) => {
        const nextState = stepFlowchart(
          currentSheet.nodes,
          currentSheet.wires,
          prevState,
          inputValue
        );

        // Highlight active node in sheet
        handleUpdateCurrentSheet({
          nodes: currentSheet.nodes.map((n) => ({
            ...n,
            state: {
              ...n.state,
              isFlowActive: n.id === nextState.activeNodeId,
            },
          })),
        });

        if (nextState.status === 'completed' || nextState.status === 'error') {
          setIsFlowchartRunning(false);
          sound.playClick();
        }
        return nextState;
      });
    },
    [currentSheet.nodes, currentSheet.wires, handleUpdateCurrentSheet]
  );

  const handleToggleFlowchartRun = useCallback(() => {
    if (isFlowchartRunning) {
      setIsFlowchartRunning(false);
    } else {
      if (
        flowchartState.status === 'completed' ||
        flowchartState.status === 'error' ||
        !flowchartState.activeNodeId
      ) {
        const fresh = initFlowchartState(currentSheet.nodes);
        setFlowchartState(fresh);
        handleUpdateCurrentSheet({
          nodes: currentSheet.nodes.map((n) => ({
            ...n,
            state: {
              ...n.state,
              isFlowActive: n.id === fresh.activeNodeId,
            },
          })),
        });
      }
      setIsFlowchartRunning(true);
    }
    sound.playClick();
  }, [isFlowchartRunning, flowchartState, currentSheet.nodes, handleUpdateCurrentSheet]);

  const handleResetFlowchart = useCallback(() => {
    setIsFlowchartRunning(false);
    const fresh = initFlowchartState(currentSheet.nodes);
    setFlowchartState(fresh);
    handleUpdateCurrentSheet({
      nodes: currentSheet.nodes.map((n) => ({
        ...n,
        state: {
          ...n.state,
          isFlowActive: n.id === fresh.activeNodeId,
        },
      })),
    });
    sound.playClick();
  }, [currentSheet.nodes, handleUpdateCurrentSheet]);

  // Flowchart Auto-Runner effect
  useEffect(() => {
    if (!isFlowchartRunning || !isFlowchartSheet) return;
    if (
      flowchartState.status === 'waiting_input' ||
      flowchartState.status === 'completed' ||
      flowchartState.status === 'error'
    ) {
      setIsFlowchartRunning(false);
      return;
    }

    const timer = window.setTimeout(() => {
      handleStepFlowchart();
    }, flowchartSpeedMs);

    return () => window.clearTimeout(timer);
  }, [
    isFlowchartRunning,
    isFlowchartSheet,
    flowchartState.status,
    flowchartState.stepCount,
    flowchartSpeedMs,
    handleStepFlowchart,
  ]);

  const handleLoadFlowchartPreset = useCallback(
    (presetId: string) => {
      if (!activeProject) return;
      const presets = createFlowchartPresets();
      const found = presets.find((p) => p.id === presetId) || presets[0];
      if (!found) return;

      const newSheetId = `sheet_${Date.now()}`;
      const newSheet: Sheet = {
        ...found,
        id: newSheetId,
        circuitType: 'flowchart',
        updatedAt: Date.now(),
      };

      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProject.id
            ? {
                ...p,
                sheets: [...p.sheets, newSheet],
                activeSheetId: newSheetId,
                updatedAt: Date.now(),
              }
            : p
        )
      );
      setIsFlowchartRunning(false);
      setFlowchartState(initFlowchartState(newSheet.nodes));
      sound.playClick();
    },
    [activeProject]
  );

  const handleLoadElectricPreset = useCallback(
    (presetId: string) => {
      if (!activeProject) return;
      const presets = createElectricPresets();
      const found = presets.find((p) => p.id === presetId || p.id.includes(presetId) || presetId.includes(p.id)) || presets[0];
      if (!found) return;

      const newSheetId = `sheet_${Date.now()}`;
      const newSheet: Sheet = {
        ...found,
        id: newSheetId,
        circuitType: 'electric',
        updatedAt: Date.now(),
      };

      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProject.id
            ? {
                ...p,
                sheets: [...p.sheets, newSheet],
                activeSheetId: newSheetId,
                updatedAt: Date.now(),
              }
            : p
        )
      );
      sound.playClick();
    },
    [activeProject]
  );

  // Simulation tick logic
  const stepSimulation = useCallback(() => {
    if (!activeProject) return;

    // Evaluate before scheduling React state so waveform history never reads a deferred updater.
    const evaluated = evaluateCircuit(currentSheet.nodes, currentSheet.wires, Date.now());
    const { nodes: evaluatedNodes, wires: evaluatedWires, buzzerActive } = evaluated;

    setProjects((prevProjects) =>
      prevProjects.map((proj) => {
        if (proj.id !== activeProject.id) return proj;

        const updatedSheets = proj.sheets.map((sheet) => {
          if (sheet.id !== proj.activeSheetId) return sheet;

          return {
            ...sheet,
            nodes: evaluatedNodes,
            wires: evaluatedWires,
          };
        });

        return {
          ...proj,
          sheets: updatedSheets,
        };
      })
    );

    // Side effects AFTER state update (not inside updater)
    sound.playBuzzer(buzzerActive);

    // Update signals after projects state is committed
    if (evaluatedNodes.length > 0) {
      const monitoredNodes = evaluatedNodes.filter(
        (n) =>
          n.type === 'CLOCK' ||
          n.type === 'SWITCH' ||
          n.type === 'LED' ||
          n.type === 'PROBE' ||
          n.type === 'BUZZER'
      );

      if (monitoredNodes.length > 0) {
        setSignals((prevSignals) => {
          const newSignals = monitoredNodes.map((n) => {
            const existing = prevSignals.find((s) => s.id === n.id);
            const isHigh =
              n.type === 'LED' || n.type === 'PROBE' || n.type === 'BUZZER'
                ? Boolean(n.inputs[0]?.value)
                : Boolean(n.outputs[0]?.value);

            const history = existing ? [...existing.history, isHigh] : [isHigh];
            if (history.length > 36) history.shift();

            return {
              id: n.id,
              name: n.label,
              color: n.state.color || '#10b981',
              history,
            };
          });
          return newSignals;
        });
      }
    }
  }, [activeProject, currentSheet.nodes, currentSheet.wires]);

  const hasTimeDependentCircuit = currentSheet.nodes.some((node) =>
    ['CLOCK', 'D_FLIP_FLOP', 'T_FLIP_FLOP', 'JK_FLIP_FLOP', 'SR_FLIP_FLOP'].includes(node.type)
  );

  // Timer-based simulation avoids running JavaScript on every display frame.
  useEffect(() => {
    if (viewMode !== 'editor' || !settings.running || !hasTimeDependentCircuit) {
      sound.stopBuzzer();
      return;
    }

    const interval = Math.max(settings.speedMs, 30);

    const intervalId = window.setInterval(stepSimulation, interval);

    return () => {
      window.clearInterval(intervalId);
      sound.stopBuzzer();
    };
  }, [viewMode, settings.running, settings.speedMs, stepSimulation]);

  // PROJECT MANAGEMENT HANDLERS
  const handleCreateBlankProject = (
    name?: string,
    circuitType: 'logic' | 'flowchart' | 'electric' = 'logic'
  ) => {
    const defaultName =
      circuitType === 'flowchart'
        ? 'Untitled Algorithm'
        : circuitType === 'electric'
        ? 'Untitled Electric Circuit'
        : 'Untitled Circuit';
    const newProj = createBlankProject(name || defaultName, circuitType);
    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setViewMode('editor');
    navigateTo(`/editor/${encodeURIComponent(newProj.id)}`);
    setSelectedNodeId(null);
    setSelectedWireId(null);
    sound.playClick();
  };

  const handleOpenProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setViewMode('editor');
    navigateTo(`/editor/${encodeURIComponent(projectId)}`);
    setSelectedNodeId(null);
    setSelectedWireId(null);
    sound.playClick();
  };

  const handleDuplicateProject = (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;

    const clonedProject: Project = {
      ...JSON.parse(JSON.stringify(target)),
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${target.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setProjects((prev) => [clonedProject, ...prev]);
    sound.playClick();
  };

  const handleDeleteProject = (projectId: string) => {
    const outcome = getProjectDeletionOutcome(projects, projectId, activeProjectId);

    setProjects(outcome.projects);
    setActiveProjectId(outcome.nextActiveProjectId);

    if (viewMode === 'editor') {
      if (outcome.nextActiveProjectId) {
        navigateTo(`/editor/${encodeURIComponent(outcome.nextActiveProjectId)}`);
      } else {
        navigateTo('/');
      }
    }

    showToast('Project deleted successfully');
    sound.playClick();
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, name: newName, updatedAt: Date.now() } : p))
    );
  };

  const handleCreateFolder = (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const now = Date.now();
    setFolders((previous) => [
      ...previous,
      { id: `folder_${now}_${Math.random().toString(36).substring(2, 6)}`, name: cleanName, createdAt: now, updatedAt: now },
    ]);
  };

  const handleRenameFolder = (folderId: string, name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    setFolders((previous) => previous.map((folder) => folder.id === folderId ? { ...folder, name: cleanName, updatedAt: Date.now() } : folder));
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders((previous) => previous.filter((folder) => folder.id !== folderId));
    setProjects((previous) => previous.map((project) => project.folderId === folderId ? { ...project, folderId: undefined, updatedAt: Date.now() } : project));
  };

  const handleAssignProjectFolder = (projectId: string, folderId: string | undefined) => {
    setProjects((previous) => previous.map((project) => project.id === projectId ? { ...project, folderId, updatedAt: Date.now() } : project));
  };

  const handleImportProject = (importedData: any) => {
    let importedProject: Project;

    if (importedData.sheets && Array.isArray(importedData.sheets)) {
      // Full Project format
      importedProject = {
        ...importedData,
        id: `proj_${Date.now()}`,
        name: importedData.name || 'Imported Circuit',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } else if (Array.isArray(importedData)) {
      // Sheets array format
      const sheetId = `sheet_${Date.now()}`;
      importedProject = {
        id: `proj_${Date.now()}`,
        name: 'Imported Project',
        sheets: importedData,
        activeSheetId: importedData[0]?.id || sheetId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } else {
      showToast('Unrecognized circuit data format. Please provide a valid LogixFlow file.');
      return;
    }

    setProjects((prev) => [importedProject, ...prev]);
    setActiveProjectId(importedProject.id);
    setViewMode('editor');
    sound.playClick();
  };

  const handleLoadPresetAsProject = (
    presetType: 'half_adder' | 'sr_latch' | 'all_gates' | 'd_flipflop' | 'mux_routing' | 'clock_7seg'
  ) => {
    const presets = createPresetSheets();
    let selectedSheet: Sheet;
    let title: string;

    if (presetType === 'half_adder') {
      selectedSheet = presets[1];
      title = 'Half Adder Circuit';
    } else if (presetType === 'sr_latch') {
      selectedSheet = presets[2];
      title = 'SR Latch Circuit';
    } else if (presetType === 'clock_7seg') {
      selectedSheet = presets[3];
      title = 'Clock & 7-Segment Circuit';
    } else if (presetType === 'd_flipflop') {
      selectedSheet = presets[4];
      title = 'D Flip-Flop Circuit';
    } else if (presetType === 'mux_routing') {
      selectedSheet = presets[5];
      title = '2:1 Multiplexer Router';
    } else {
      selectedSheet = presets[0];
      title = 'All Logic Gates Interactive';
    }

    const newProj: Project = {
      id: `proj_${Date.now()}`,
      name: title,
      sheets: [
        {
          ...selectedSheet,
          id: `sheet_${Date.now()}`,
          name: 'Circuit',
          updatedAt: Date.now(),
        },
      ],
      activeSheetId: `sheet_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Ensure activeSheetId matches
    newProj.activeSheetId = newProj.sheets[0].id;

    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setViewMode('editor');
    sound.playClick();
  };

  const handleLoadFlowchartPresetAsProject = (presetId: string) => {
    const presets = createFlowchartPresets();
    const found = presets.find((p) => p.id === presetId) || presets[0];

    const newSheetId = `sheet_${Date.now()}`;
    const newProjId = `proj_${Date.now()}`;
    const newProj: Project = {
      id: newProjId,
      name: found.name,
      sheets: [
        {
          ...found,
          id: newSheetId,
          circuitType: 'flowchart',
          updatedAt: Date.now(),
        },
      ],
      activeSheetId: newSheetId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setViewMode('editor');
    setIsFlowchartRunning(false);
    setFlowchartState(initFlowchartState(newProj.sheets[0].nodes));
    sound.playClick();
  };

  const handleLoadElectricPresetAsProject = (presetId: string) => {
    const presets = createElectricPresets();
    const found = presets.find((p) => p.id === presetId || p.id.includes(presetId) || presetId.includes(p.id)) || presets[0];

    const newSheetId = `sheet_${Date.now()}`;
    const newProjId = `proj_${Date.now()}`;
    const newProj: Project = {
      id: newProjId,
      name: found.name,
      circuitType: 'electric',
      sheets: [
        {
          ...found,
          id: newSheetId,
          circuitType: 'electric',
          updatedAt: Date.now(),
        },
      ],
      activeSheetId: newSheetId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setViewMode('editor');
    sound.playClick();
  };

  // MULTI-SHEET OPERATIONS WITHIN ACTIVE PROJECT
  const handleCreateSheet = (type: 'logic' | 'flowchart' | 'electric' = 'logic') => {
    if (!activeProject) return;
    const newSheetId = `sheet_${Date.now()}`;
    const newSheet: Sheet = {
      id: newSheetId,
      name:
        type === 'flowchart'
          ? `Algorithm ${activeProject.sheets.length + 1}`
          : type === 'electric'
          ? `Electric ${activeProject.sheets.length + 1}`
          : `Sheet ${activeProject.sheets.length + 1}`,
      circuitType: type,
      nodes: [],
      wires: [],
      pan: { x: 80, y: 80 },
      zoom: 1,
      updatedAt: Date.now(),
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === activeProject.id) {
          return {
            ...p,
            sheets: [...p.sheets, newSheet],
            activeSheetId: newSheetId,
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
    setSelectedNodeId(null);
    setSelectedWireId(null);
    navigateTo(`/editor/${encodeURIComponent(activeProject.id)}/${encodeURIComponent(newSheetId)}`);
    sound.playClick();
  };

  const handleSelectSheet = (sheetId: string) => {
    if (!activeProject) return;
    setProjects((prev) =>
      prev.map((p) => (p.id === activeProject.id ? { ...p, activeSheetId: sheetId } : p))
    );
    setSelectedNodeId(null);
    setSelectedWireId(null);
    navigateTo(`/editor/${encodeURIComponent(activeProject.id)}/${encodeURIComponent(sheetId)}`);
    sound.playClick();
  };

  const handleRenameSheet = (id: string, newName: string) => {
    if (!activeProject) return;
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === activeProject.id) {
          return {
            ...p,
            sheets: p.sheets.map((s) => (s.id === id ? { ...s, name: newName } : s)),
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
  };

  const handleDuplicateSheet = (id: string) => {
    if (!activeProject) return;
    const target = activeProject.sheets.find((s) => s.id === id);
    if (!target) return;

    const idMap = new Map<string, string>();
    const clonedNodes = target.nodes.map((node) => {
      const newNodeId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      idMap.set(node.id, newNodeId);

      const newInputs = node.inputs.map((pin, i) => {
        const newPinId = `${newNodeId}_in_${i}`;
        idMap.set(pin.id, newPinId);
        return { ...pin, id: newPinId, nodeId: newNodeId };
      });

      const newOutputs = node.outputs.map((pin, i) => {
        const newPinId = `${newNodeId}_out_${i}`;
        idMap.set(pin.id, newPinId);
        return { ...pin, id: newPinId, nodeId: newNodeId };
      });

      return {
        ...node,
        id: newNodeId,
        inputs: newInputs,
        outputs: newOutputs,
        state: { ...node.state },
      };
    });

    const clonedWires = target.wires.map((wire) => ({
      ...wire,
      id: `wire_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fromNodeId: idMap.get(wire.fromNodeId) || wire.fromNodeId,
      fromPinId: idMap.get(wire.fromPinId) || wire.fromPinId,
      toNodeId: idMap.get(wire.toNodeId) || wire.toNodeId,
      toPinId: idMap.get(wire.toPinId) || wire.toPinId,
    }));

    const newSheetId = `sheet_${Date.now()}`;
    const newSheet: Sheet = {
      ...target,
      id: newSheetId,
      name: `${target.name} (Copy)`,
      nodes: clonedNodes,
      wires: clonedWires,
      updatedAt: Date.now(),
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === activeProject.id) {
          return {
            ...p,
            sheets: [...p.sheets, newSheet],
            activeSheetId: newSheetId,
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
    sound.playClick();
  };

  const handleDeleteSheet = (id: string) => {
    if (!activeProject || activeProject.sheets.length <= 1) return;
    const remaining = activeProject.sheets.filter((s) => s.id !== id);
    if (remaining.length === 0) return;

    const deletedWasActive = activeProject.activeSheetId === id;
    const newActiveId = deletedWasActive ? remaining[0].id : activeProject.activeSheetId;

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== activeProject.id) return p;
        return {
          ...p,
          sheets: remaining,
          activeSheetId: newActiveId,
          updatedAt: Date.now(),
        };
      })
    );
    sound.playClick();
  };

  const handleSelectAdjacentSheet = (direction: -1 | 1) => {
    if (!activeProject || activeProject.sheets.length < 2) return;
    const currentIndex = activeProject.sheets.findIndex((sheet) => sheet.id === currentSheet.id);
    const nextIndex = (currentIndex + direction + activeProject.sheets.length) % activeProject.sheets.length;
    handleSelectSheet(activeProject.sheets[nextIndex].id);
  };

  // NODE OPERATIONS WITH INTELLIGENT VARIABLE NAMING
  const handleAddComponent = (type: NodeType, coords?: { x: number; y: number }) => {
    let spawnX: number;
    let spawnY: number;

    if (coords) {
      spawnX = coords.x;
      spawnY = coords.y;
    } else {
      const canvasEl = document.getElementById('logicflow-canvas');
      const width = canvasEl?.clientWidth || 800;
      const height = canvasEl?.clientHeight || 600;

      const centerX = (width / 2 - currentSheet.pan.x) / currentSheet.zoom;
      const centerY = (height / 2 - currentSheet.pan.y) / currentSheet.zoom;

      const jitterX = (Math.random() - 0.5) * 40;
      const jitterY = (Math.random() - 0.5) * 40;
      spawnX = Math.round(centerX + jitterX);
      spawnY = Math.round(centerY + jitterY);
    }

    // Smart variable assignment for inputs (A, B, C...) and probes (Y, Z, F...)
    let customLabel: string | undefined;
    let varName: string | undefined;

    if (type === 'SWITCH' || type === 'BUTTON') {
      const usedVars = new Set(
        currentSheet.nodes
          .filter((n) => n.type === 'SWITCH' || n.type === 'BUTTON')
          .map((n) => n.state.variableName || n.label)
      );
      const varCandidates = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      varName = varCandidates.find((v) => !usedVars.has(v)) || `IN${currentSheet.nodes.length + 1}`;
      customLabel = varName;
    } else if (type === 'PROBE') {
      const usedVars = new Set(
        currentSheet.nodes
          .filter((n) => n.type === 'PROBE')
          .map((n) => n.state.variableName || n.label)
      );
      const varCandidates = ['Y', 'Z', 'F', 'Q', 'OUT1', 'OUT2'];
      varName = varCandidates.find((v) => !usedVars.has(v)) || `OUT${currentSheet.nodes.length + 1}`;
      customLabel = varName;
    }

    const newNode = createDefaultNode(
      type,
      spawnX,
      spawnY,
      undefined,
      varName ? { variableName: varName } : undefined,
      customLabel
    );

    handleUpdateCurrentSheet({
      nodes: [...currentSheet.nodes, newNode],
    });
    setSelectedNodeId(newNode.id);
    sound.playClick();
  };

  const handleDeleteNode = (nodeId: string) => {
    const remainingNodes = currentSheet.nodes.filter((n) => n.id !== nodeId);
    const remainingWires = currentSheet.wires.filter(
      (w) => w.fromNodeId !== nodeId && w.toNodeId !== nodeId
    );

    handleUpdateCurrentSheet({
      nodes: remainingNodes,
      wires: remainingWires,
    });
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
    setSelectedNodeIds((prev) => prev.filter((id) => id !== nodeId));
    sound.playClick();
  };

  const handleDeleteNodes = useCallback(
    (nodeIds: string[]) => {
      if (!nodeIds || nodeIds.length === 0) return;
      const nodeSet = new Set(nodeIds);
      const remainingNodes = currentSheet.nodes.filter((n) => !nodeSet.has(n.id));
      const remainingWires = currentSheet.wires.filter(
        (w) => !nodeSet.has(w.fromNodeId) && !nodeSet.has(w.toNodeId)
      );

      handleUpdateCurrentSheet({
        nodes: remainingNodes,
        wires: remainingWires,
      });
      setSelectedNodeId(null);
      setSelectedNodeIds([]);
      sound.playClick();
    },
    [currentSheet.nodes, currentSheet.wires, handleUpdateCurrentSheet]
  );

  const handleDuplicateNodes = useCallback(
    (nodeIds: string[]) => {
      if (!nodeIds || nodeIds.length === 0) return;
      recordHistory();
      const idMap = new Map<string, string>();
      const pinMap = new Map<string, string>();

      const nodesToDup = currentSheet.nodes.filter((n) => nodeIds.includes(n.id));
      const newNodes: CircuitNode[] = nodesToDup.map((node) => {
        const newId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        idMap.set(node.id, newId);

        const newInputs = node.inputs.map((pin, idx) => {
          const newPinId = `${newId}_in_${idx}`;
          pinMap.set(pin.id, newPinId);
          return {
            ...pin,
            id: newPinId,
            nodeId: newId,
          };
        });

        const newOutputs = node.outputs.map((pin, idx) => {
          const newPinId = `${newId}_out_${idx}`;
          pinMap.set(pin.id, newPinId);
          return {
            ...pin,
            id: newPinId,
            nodeId: newId,
          };
        });

        return {
          ...node,
          id: newId,
          x: node.x + 40,
          y: node.y + 40,
          inputs: newInputs,
          outputs: newOutputs,
          state: { ...node.state },
        };
      });

      const newWires: Wire[] = [];
      currentSheet.wires.forEach((wire) => {
        if (idMap.has(wire.fromNodeId) && idMap.has(wire.toNodeId)) {
          const newWireId = `wire_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          newWires.push({
            id: newWireId,
            fromNodeId: idMap.get(wire.fromNodeId)!,
            fromPinId: pinMap.get(wire.fromPinId) || wire.fromPinId,
            toNodeId: idMap.get(wire.toNodeId)!,
            toPinId: pinMap.get(wire.toPinId) || wire.toPinId,
            value: false,
          });
        }
      });

      handleUpdateCurrentSheet({
        nodes: [...currentSheet.nodes, ...newNodes],
        wires: [...currentSheet.wires, ...newWires],
      });

      const newIds = newNodes.map((n) => n.id);
      setSelectedNodeIds(newIds);
      setSelectedNodeId(newIds[0]);
      sound.playClick();
      showToast(`Duplicated ${newNodes.length} component${newNodes.length > 1 ? 's' : ''}`);
    },
    [currentSheet, handleUpdateCurrentSheet, recordHistory, showToast]
  );

  const handleCopy = useCallback(() => {
    const ids = selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
    if (ids.length === 0) return;

    const nodesToCopy = currentSheet.nodes.filter((n) => ids.includes(n.id));
    if (nodesToCopy.length === 0) return;

    const idSet = new Set(ids);
    const internalWires = currentSheet.wires.filter(
      (w) => idSet.has(w.fromNodeId) && idSet.has(w.toNodeId)
    );

    clipboardRef.current = {
      nodes: JSON.parse(JSON.stringify(nodesToCopy)),
      wires: JSON.parse(JSON.stringify(internalWires)),
      pasteCount: 0,
    };

    sound.playClick();
    showToast(`Copied ${nodesToCopy.length} component${nodesToCopy.length > 1 ? 's' : ''}`);
  }, [selectedNodeIds, selectedNodeId, currentSheet.nodes, currentSheet.wires, showToast]);

  const handleCut = useCallback(() => {
    const ids = selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
    if (ids.length === 0) return;

    handleCopy();
    recordHistory();
    handleDeleteNodes(ids);
    showToast(`Cut ${ids.length} component${ids.length > 1 ? 's' : ''}`);
  }, [selectedNodeIds, selectedNodeId, handleCopy, recordHistory, handleDeleteNodes, showToast]);

  const handlePaste = useCallback(() => {
    if (!clipboardRef.current || clipboardRef.current.nodes.length === 0) {
      showToast('Clipboard is empty');
      return;
    }

    recordHistory();
    clipboardRef.current.pasteCount += 1;
    const offset = clipboardRef.current.pasteCount * 30;

    const idMap = new Map<string, string>();
    const pinMap = new Map<string, string>();

    const newNodes: CircuitNode[] = clipboardRef.current.nodes.map((node) => {
      const newId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      idMap.set(node.id, newId);

      const newInputs = (node.inputs || []).map((pin, idx) => {
        const newPinId = `${newId}_in_${idx}`;
        pinMap.set(pin.id, newPinId);
        return {
          ...pin,
          id: newPinId,
          nodeId: newId,
        };
      });

      const newOutputs = (node.outputs || []).map((pin, idx) => {
        const newPinId = `${newId}_out_${idx}`;
        pinMap.set(pin.id, newPinId);
        return {
          ...pin,
          id: newPinId,
          nodeId: newId,
        };
      });

      return {
        ...node,
        id: newId,
        x: node.x + offset,
        y: node.y + offset,
        inputs: newInputs,
        outputs: newOutputs,
        state: { ...node.state },
      };
    });

    const newWires: Wire[] = [];
    clipboardRef.current.wires.forEach((wire) => {
      if (idMap.has(wire.fromNodeId) && idMap.has(wire.toNodeId)) {
        const newWireId = `wire_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        newWires.push({
          id: newWireId,
          fromNodeId: idMap.get(wire.fromNodeId)!,
          fromPinId: pinMap.get(wire.fromPinId) || wire.fromPinId,
          toNodeId: idMap.get(wire.toNodeId)!,
          toPinId: pinMap.get(wire.toPinId) || wire.toPinId,
          value: false,
        });
      }
    });

    handleUpdateCurrentSheet({
      nodes: [...currentSheet.nodes, ...newNodes],
      wires: [...currentSheet.wires, ...newWires],
    });

    const newIds = newNodes.map((n) => n.id);
    setSelectedNodeIds(newIds);
    setSelectedNodeId(newIds[0] || null);
    sound.playClick();
    showToast(`Pasted ${newNodes.length} component${newNodes.length > 1 ? 's' : ''}`);
  }, [currentSheet.nodes, currentSheet.wires, handleUpdateCurrentSheet, recordHistory, showToast]);

  const handleSelectAll = useCallback(() => {
    if (currentSheet.nodes.length === 0) return;
    const allIds = currentSheet.nodes.map((n) => n.id);
    setSelectedNodeIds(allIds);
    setSelectedNodeId(allIds[0]);
    sound.playClick();
    showToast(`Selected all ${allIds.length} components`);
  }, [currentSheet.nodes, showToast]);

  const handleGroupSubcircuit = useCallback(
    (nodeIds: string[], subcircuitName: string) => {
      if (!nodeIds || nodeIds.length < 2 || !activeProject) return;
      recordHistory();
      const name = subcircuitName.trim() || 'Sub-Circuit';

      const selectedNodes = currentSheet.nodes.filter((n) => nodeIds.includes(n.id));
      const remainingNodes = currentSheet.nodes.filter((n) => !nodeIds.includes(n.id));

      const internalWires: Wire[] = [];
      const externalIncomingWires: Wire[] = [];
      const externalOutgoingWires: Wire[] = [];
      const untouchedWires: Wire[] = [];

      for (const wire of currentSheet.wires) {
        const fromIn = nodeIds.includes(wire.fromNodeId);
        const toIn = nodeIds.includes(wire.toNodeId);

        if (fromIn && toIn) {
          internalWires.push(wire);
        } else if (!fromIn && toIn) {
          externalIncomingWires.push(wire);
        } else if (fromIn && !toIn) {
          externalOutgoingWires.push(wire);
        } else {
          untouchedWires.push(wire);
        }
      }

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      selectedNodes.forEach((n) => {
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x + n.width);
        maxY = Math.max(maxY, n.y + n.height);
      });
      const centerX = Math.round((minX + maxX) / 2);
      const centerY = Math.round((minY + maxY) / 2);

      // Determine input pin mappings
      const inputPinMappings: {
        pinId: string;
        name: string;
        internalNodeId: string;
        internalPinId: string;
        externalWires: Wire[];
      }[] = [];

      const handledDestPins = new Set<string>();
      externalIncomingWires.forEach((wire) => {
        if (handledDestPins.has(wire.toPinId)) return;
        handledDestPins.add(wire.toPinId);
        const targetNode = selectedNodes.find((n) => n.id === wire.toNodeId);
        const targetPin = targetNode?.inputs.find((p) => p.id === wire.toPinId);
        const pinName = targetPin?.name ? targetPin.name : `IN${inputPinMappings.length + 1}`;
        const wiresForPin = externalIncomingWires.filter((w) => w.toPinId === wire.toPinId);
        inputPinMappings.push({
          pinId: `sub_in_${inputPinMappings.length}`,
          name: pinName,
          internalNodeId: wire.toNodeId,
          internalPinId: wire.toPinId,
          externalWires: wiresForPin,
        });
      });

      if (inputPinMappings.length === 0) {
        selectedNodes.forEach((node) => {
          if (node.type === 'SWITCH' || node.type === 'BUTTON') {
            inputPinMappings.push({
              pinId: `sub_in_${inputPinMappings.length}`,
              name: node.state?.variableName || node.label || `IN${inputPinMappings.length + 1}`,
              internalNodeId: node.id,
              internalPinId: node.outputs[0]?.id || `${node.id}_out_0`,
              externalWires: [],
            });
          } else {
            node.inputs.forEach((pin) => {
              const isDriven = internalWires.some((w) => w.toPinId === pin.id);
              if (!isDriven) {
                inputPinMappings.push({
                  pinId: `sub_in_${inputPinMappings.length}`,
                  name: pin.name || `IN${inputPinMappings.length + 1}`,
                  internalNodeId: node.id,
                  internalPinId: pin.id,
                  externalWires: [],
                });
              }
            });
          }
        });
      }

      // Determine output pin mappings
      const outputPinMappings: {
        pinId: string;
        name: string;
        internalNodeId: string;
        internalPinId: string;
        externalWires: Wire[];
      }[] = [];

      const handledSrcPins = new Set<string>();
      externalOutgoingWires.forEach((wire) => {
        if (handledSrcPins.has(wire.fromPinId)) return;
        handledSrcPins.add(wire.fromPinId);
        const srcNode = selectedNodes.find((n) => n.id === wire.fromNodeId);
        const srcPin = srcNode?.outputs.find((p) => p.id === wire.fromPinId);
        const pinName = srcPin?.name ? srcPin.name : `OUT${outputPinMappings.length + 1}`;
        const wiresForPin = externalOutgoingWires.filter((w) => w.fromPinId === wire.fromPinId);
        outputPinMappings.push({
          pinId: `sub_out_${outputPinMappings.length}`,
          name: pinName,
          internalNodeId: wire.fromNodeId,
          internalPinId: wire.fromPinId,
          externalWires: wiresForPin,
        });
      });

      if (outputPinMappings.length === 0) {
        selectedNodes.forEach((node) => {
          node.outputs.forEach((pin) => {
            const drivesInternal = internalWires.some((w) => w.fromPinId === pin.id);
            if (!drivesInternal) {
              outputPinMappings.push({
                pinId: `sub_out_${outputPinMappings.length}`,
                name: pin.name || `OUT${outputPinMappings.length + 1}`,
                internalNodeId: node.id,
                internalPinId: pin.id,
                externalWires: [],
              });
            }
          });
        });
      }

      if (inputPinMappings.length === 0) {
        inputPinMappings.push({
          pinId: 'sub_in_0',
          name: 'IN',
          internalNodeId: selectedNodes[0].id,
          internalPinId: selectedNodes[0].inputs[0]?.id || `${selectedNodes[0].id}_in_0`,
          externalWires: [],
        });
      }
      if (outputPinMappings.length === 0) {
        const lastNode = selectedNodes[selectedNodes.length - 1];
        outputPinMappings.push({
          pinId: 'sub_out_0',
          name: 'OUT',
          internalNodeId: lastNode.id,
          internalPinId: lastNode.outputs[0]?.id || `${lastNode.id}_out_0`,
          externalWires: [],
        });
      }

      const subcircuitSheetId = `sheet_sub_${Date.now()}`;
      const subSheetNodes: CircuitNode[] = selectedNodes.map((n) => ({
        ...n,
        x: n.x - minX + 120,
        y: n.y - minY + 120,
      }));

      const newSubSheet: Sheet = {
        id: subcircuitSheetId,
        name: `Sub: ${name}`,
        circuitType: currentSheet.circuitType || 'logic',
        nodes: subSheetNodes,
        wires: internalWires,
        pan: { x: 0, y: 0 },
        zoom: 1.0,
        updatedAt: Date.now(),
      };

      const subcircuitNodeId = `node_sub_${Date.now()}`;
      const maxPins = Math.max(inputPinMappings.length, outputPinMappings.length);
      const subHeight = Math.max(88, maxPins * 24 + 32);
      const subWidth = 140;

      const subInputs: Pin[] = inputPinMappings.map((m, idx) => ({
        id: `${subcircuitNodeId}_in_${idx}`,
        nodeId: subcircuitNodeId,
        type: 'input',
        name: m.name,
        index: idx,
        offsetX: 2,
        offsetY: Math.round(24 + idx * 22),
        value: false,
      }));

      const subOutputs: Pin[] = outputPinMappings.map((m, idx) => ({
        id: `${subcircuitNodeId}_out_${idx}`,
        nodeId: subcircuitNodeId,
        type: 'output',
        name: m.name,
        index: idx,
        offsetX: subWidth - 2,
        offsetY: Math.round(24 + idx * 22),
        value: false,
      }));

      const subNode: CircuitNode = {
        id: subcircuitNodeId,
        type: 'SUBCIRCUIT',
        label: name,
        x: centerX - Math.round(subWidth / 2),
        y: centerY - Math.round(subHeight / 2),
        width: subWidth,
        height: subHeight,
        inputs: subInputs,
        outputs: subOutputs,
        state: {
          subcircuitSheetId,
          subcircuitName: name,
          subcircuitNodes: subSheetNodes,
          subcircuitWires: internalWires,
          subcircuitInputMap: inputPinMappings.map((m, idx) => ({
            pinId: subInputs[idx].id,
            internalNodeId: m.internalNodeId,
            internalPinId: m.internalPinId,
          })),
          subcircuitOutputMap: outputPinMappings.map((m, idx) => ({
            pinId: subOutputs[idx].id,
            internalNodeId: m.internalNodeId,
            internalPinId: m.internalPinId,
          })),
        },
      };

      const reconnectedWires: Wire[] = [...untouchedWires];

      inputPinMappings.forEach((m, idx) => {
        const subPin = subInputs[idx];
        m.externalWires.forEach((wire) => {
          reconnectedWires.push({
            ...wire,
            toNodeId: subcircuitNodeId,
            toPinId: subPin.id,
          });
        });
      });

      outputPinMappings.forEach((m, idx) => {
        const subPin = subOutputs[idx];
        m.externalWires.forEach((wire) => {
          reconnectedWires.push({
            ...wire,
            fromNodeId: subcircuitNodeId,
            fromPinId: subPin.id,
          });
        });
      });

      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== activeProject.id) return p;
          const updatedSheets = p.sheets.map((sheet) => {
            if (sheet.id === currentSheet.id) {
              return {
                ...sheet,
                nodes: [...remainingNodes, subNode],
                wires: reconnectedWires,
                updatedAt: Date.now(),
              };
            }
            return sheet;
          });
          return {
            ...p,
            sheets: [...updatedSheets, newSubSheet],
            updatedAt: Date.now(),
          };
        })
      );

      setSelectedNodeId(subcircuitNodeId);
      setSelectedNodeIds([subcircuitNodeId]);
      sound.playClick();
    },
    [activeProject, currentSheet, recordHistory]
  );

  const handleDeleteWire = (wireId: string) => {
    const remainingWires = currentSheet.wires.filter((w) => w.id !== wireId);
    handleUpdateCurrentSheet({ wires: remainingWires });
    if (selectedWireId === wireId) setSelectedWireId(null);
    sound.playClick();
  };

  const handleUpdateWireLabel = (wireId: string, label: string) => {
    const cleanLabel = label.trim();
    const updatedWires = currentSheet.wires.map((w) =>
      w.id === wireId ? { ...w, label: cleanLabel || undefined } : w
    );
    recordHistory();
    handleUpdateCurrentSheet({ wires: updatedWires });
    if (cleanLabel) {
      showToast(`Labeled wire "${cleanLabel}"`);
    } else {
      showToast('Cleared wire label');
    }
  };

  // Interactive node events
  const handleToggleSwitch = (nodeId: string) => {
    const updatedNodes = currentSheet.nodes.map((node) => {
      if (node.id === nodeId && (node.type === 'SWITCH' || node.type === 'ELEC_SWITCH')) {
        const nextState = !node.state.isOn;
        return {
          ...node,
          state: { ...node.state, isOn: nextState },
          outputs: node.outputs.map((p) => ({ ...p, value: nextState })),
        };
      }
      if (node.id === nodeId && node.type === 'ELEC_SPDT_SWITCH') {
        const nextPos: 'A' | 'B' = node.state.switchPosition === 'B' ? 'A' : 'B';
        return {
          ...node,
          state: { ...node.state, switchPosition: nextPos },
        };
      }
      return node;
    });

    sound.playClick();
    const evaluated = evaluateCircuit(updatedNodes, currentSheet.wires, Date.now());
    handleUpdateCurrentSheet({ nodes: evaluated.nodes, wires: evaluated.wires });
  };

  const handleButtonPress = (nodeId: string, pressed: boolean) => {
    const updatedNodes = currentSheet.nodes.map((node) => {
      if (node.id === nodeId && node.type === 'BUTTON') {
        return {
          ...node,
          state: { ...node.state, isOn: pressed },
          outputs: node.outputs.map((p) => ({ ...p, value: pressed })),
        };
      }
      return node;
    });

    if (pressed) sound.playClick();
    const evaluated = evaluateCircuit(updatedNodes, currentSheet.wires, Date.now());
    handleUpdateCurrentSheet({ nodes: evaluated.nodes, wires: evaluated.wires });
  };

  const handleUpdateNodeState = (nodeId: string, partial: Partial<CircuitNode['state']>) => {
    const updatedNodes = currentSheet.nodes.map((n) =>
      n.id === nodeId ? { ...n, state: { ...n.state, ...partial } } : n
    );
    handleUpdateCurrentSheet({ nodes: updatedNodes });
  };

  // Zoom controls
  const handleZoomIn = () => {
    const newZoom = Math.min(currentSheet.zoom * 1.2, 3.0);
    handleUpdateCurrentSheet({ zoom: newZoom });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(currentSheet.zoom / 1.2, 0.3);
    handleUpdateCurrentSheet({ zoom: newZoom });
  };

  const handleResetView = () => {
    handleUpdateCurrentSheet({ zoom: 1.0, pan: { x: 80, y: 80 } });
  };

  const handleExportSvg = async () => {
    const canvas = document.getElementById('logicflow-canvas');
    if (!canvas) return;

    try {
      const svgDataUrl = await toSvg(canvas, {
        backgroundColor: settings.theme === 'dark' ? '#0b0f19' : '#e4e7ec',
        filter: (node) => !node.classList?.contains('logicflow-export-ignore'),
      });
      const link = document.createElement('a');
      link.href = svgDataUrl;
      link.download = `logixflow-circuit-${Date.now()}.svg`;
      link.click();
    } catch (error) {
      console.warn('Failed to export SVG:', error);
    }
  };

  // Apply truth table row test directly to canvas
  const handleApplyTruthTableRow = (rowInputs: Record<string, boolean>) => {
    const inputNodes = currentSheet.nodes.filter(
      (n) => n.type === 'SWITCH' || n.type === 'BUTTON'
    );
    const selectedInputs = inputNodes.slice(0, 6);

    const labelCounts = new Map<string, number>();
    selectedInputs.forEach((n) => {
      const lbl = n.state.variableName || n.label || n.type;
      labelCounts.set(lbl, (labelCounts.get(lbl) || 0) + 1);
    });

    const currentCounts = new Map<string, number>();
    const nodeToName = new Map<string, string>();
    selectedInputs.forEach((n) => {
      const lbl = n.state.variableName || n.label || n.type;
      if ((labelCounts.get(lbl) || 0) > 1) {
        const c = (currentCounts.get(lbl) || 0) + 1;
        currentCounts.set(lbl, c);
        nodeToName.set(n.id, `${lbl} #${c}`);
      } else {
        nodeToName.set(n.id, lbl);
      }
    });

    const updatedNodes = currentSheet.nodes.map((node) => {
      const uniqueName = nodeToName.get(node.id);
      const val =
        uniqueName && rowInputs[uniqueName] !== undefined
          ? rowInputs[uniqueName]
          : rowInputs[node.state.variableName || node.label];

      if ((node.type === 'SWITCH' || node.type === 'BUTTON') && val !== undefined) {
        return {
          ...node,
          state: { ...node.state, isOn: val },
          outputs: node.outputs.map((p) => ({ ...p, value: val })),
        };
      }
      return node;
    });

    const evaluated = evaluateCircuit(updatedNodes, currentSheet.wires, Date.now());
    handleUpdateCurrentSheet({ nodes: evaluated.nodes, wires: evaluated.wires });
  };

  // Load preset circuit directly into active project
  const handleLoadPresetIntoProject = (index: number) => {
    if (!activeProject) return;
    const presets = createPresetSheets();
    if (presets[index]) {
      const preset = presets[index];
      const newSheet: Sheet = {
        ...preset,
        id: `sheet_${Date.now()}`,
        name: preset.name,
        updatedAt: Date.now(),
      };
      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProject.id
            ? { ...p, sheets: [...p.sheets, newSheet], activeSheetId: newSheet.id }
            : p
        )
      );
      sound.playClick();
    }
  };

  // Central keyboard command layer. Text fields keep their native editing shortcuts.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;
      if (isEditable) return;

      const key = event.key.toLowerCase();
      const hasModifier = event.ctrlKey || event.metaKey;

      if (hasModifier && key === 'z') {
        event.preventDefault();
        event.shiftKey ? handleRedo() : handleUndo();
        return;
      }

      if (hasModifier && key === 'y') {
        event.preventDefault();
        handleRedo();
        return;
      }

      if (event.key === 'Escape') {
        setIsMobileDrawerOpen(false);
        setIsTruthTableOpen(false);
        setIsExportModalOpen(false);
        setIsHelpModalOpen(false);
        return;
      }

      if (viewMode !== 'editor') return;

      if (hasModifier && key === 's') {
        event.preventDefault();
        if (event.shiftKey) {
          void handleExportSvg();
        } else {
          setIsExportModalOpen(true);
        }
        return;
      }

      if (hasModifier && key === 'o') {
        event.preventDefault();
        setIsExportModalOpen(true);
        return;
      }

      // Clipboard operations: Copy, Cut, Paste, Select All, Duplicate
      if (hasModifier && key === 'c') {
        event.preventDefault();
        handleCopy();
        return;
      }

      if (hasModifier && key === 'x') {
        event.preventDefault();
        handleCut();
        return;
      }

      if (hasModifier && key === 'v') {
        event.preventDefault();
        handlePaste();
        return;
      }

      if (hasModifier && key === 'a') {
        event.preventDefault();
        handleSelectAll();
        return;
      }

      if (hasModifier && key === 'd') {
        event.preventDefault();
        const ids = selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
        if (ids.length > 0) {
          handleDuplicateNodes(ids);
        }
        return;
      }

      // Delete components or wire
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        if (selectedNodeIds.length > 0) handleDeleteNodes(selectedNodeIds);
        else if (selectedNodeId) handleDeleteNode(selectedNodeId);
        else if (selectedWireId) handleDeleteWire(selectedWireId);
        return;
      }

      // Arrow keys for precise positioning / nudging selected nodes
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        const ids = selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
        if (ids.length > 0) {
          event.preventDefault();
          const step = event.shiftKey ? 40 : (settings.snapToGrid ? 20 : 10);
          let dx = 0;
          let dy = 0;
          if (key === 'arrowup') dy = -step;
          else if (key === 'arrowdown') dy = step;
          else if (key === 'arrowleft') dx = -step;
          else if (key === 'arrowright') dx = step;

          const idSet = new Set(ids);
          const updatedNodes = currentSheet.nodes.map((node) => {
            if (idSet.has(node.id)) {
              return {
                ...node,
                x: Math.max(0, node.x + dx),
                y: Math.max(0, node.y + dy),
              };
            }
            return node;
          });
          handleUpdateCurrentSheet({ nodes: updatedNodes });
          return;
        }
      }

      if (event.key === 'Escape') {
        setSelectedNodeId(null);
        setSelectedNodeIds([]);
        setSelectedWireId(null);
        return;
      }

      if (event.key === ' ') {
        event.preventDefault();
        setSettings((previous) => ({ ...previous, running: !previous.running }));
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        stepSimulation();
        return;
      }

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        handleZoomIn();
        return;
      }

      if (event.key === '-') {
        event.preventDefault();
        handleZoomOut();
        return;
      }

      if (event.key === '0') {
        event.preventDefault();
        handleResetView();
        return;
      }

      if (key === 'g') {
        setSettings((previous) => ({ ...previous, showGrid: !previous.showGrid }));
      } else if (key === 's') {
        setSettings((previous) => ({ ...previous, snapToGrid: !previous.snapToGrid }));
      } else if (key === '?' || key === 'h') {
        setIsHelpModalOpen(true);
      } else if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        handleSelectAdjacentSheet(-1);
      } else if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        handleSelectAdjacentSheet(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    viewMode,
    selectedNodeId,
    selectedNodeIds,
    selectedWireId,
    activeProject,
    currentSheet,
    settings.snapToGrid,
    handleUndo,
    handleRedo,
    handleCopy,
    handleCut,
    handlePaste,
    handleSelectAll,
    handleDuplicateNodes,
    handleDeleteNode,
    handleDeleteNodes,
    handleDeleteWire,
    handleUpdateCurrentSheet,
    handleExportSvg,
    stepSimulation,
  ]);

  // If in Home Tab (Main Menu), render the Home Dashboard
  if (viewMode === 'home') {
    return (
      <HomeDashboard
        theme={settings.theme || 'light'}
        onThemeChange={(theme) => setSettings((previous) => ({ ...previous, theme }))}
        folders={folders}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onAssignProjectFolder={handleAssignProjectFolder}
        projects={projects}
        onOpenProject={handleOpenProject}
        onCreateBlankProject={handleCreateBlankProject}
        onDuplicateProject={handleDuplicateProject}
        onDeleteProject={handleDeleteProject}
        onRenameProject={handleRenameProject}
        onImportProject={handleImportProject}
        onLoadPresetAsProject={handleLoadPresetAsProject}
        onLoadFlowchartPresetAsProject={handleLoadFlowchartPresetAsProject}
        onLoadElectricPresetAsProject={handleLoadElectricPresetAsProject}
        settings={settings}
        onUpdateSettings={(updated) => setSettings((prev) => ({ ...prev, ...updated }))}
        onResetWorkspace={() => {
          const defaults = createDefaultProjects();
          setProjects(defaults);
          setActiveProjectId(defaults[0].id);
          setFolders([]);
          try {
            localStorage.removeItem(STORAGE_PROJECTS_KEY);
            localStorage.removeItem(STORAGE_ACTIVE_PROJECT_KEY);
          } catch (e) {
            console.warn('Storage reset error:', e);
          }
          showToast('Workspace reset to factory defaults');
          sound.playClick();
        }}
      />
    );
  }

  // Otherwise, render the Circuit Editor Workspace
  return (
    <div
      className={`flex flex-col h-dvh min-h-screen w-screen overflow-hidden antialiased font-sans transition-colors ${
        settings.theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Top Application Bar with Navigation to Home & Project Title */}
      <TopBar
        settings={settings}
        projectName={activeProject?.name || 'Untitled Circuit'}
        onNavigateHome={() => {
          setViewMode('home');
          navigateTo('/');
        }}
        onRenameProject={(newName) => activeProject && handleRenameProject(activeProject.id, newName)}
        onNewCircuit={() => handleCreateBlankProject()}
        onUpdateSettings={(partial) => setSettings({ ...settings, ...partial })}
        onStepSimulation={stepSimulation}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onOpenTruthTable={() => setIsTruthTableOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onExportSvg={handleExportSvg}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        onLoadPreset={handleLoadPresetIntoProject}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
      />

      {/* Main Workspace Area (Component Palette Sidebar + Canvas) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Component Palette Sidebar (Features ANSI/IEEE Gate Symbols & Flowchart Blocks) */}
        <ComponentPalette
          onAddComponent={handleAddComponent}
          isMobileDrawerOpen={isMobileDrawerOpen}
          onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          theme={settings.theme || 'light'}
          circuitMode={currentSheet.circuitType || (isFlowchartSheet ? 'flowchart' : 'logic')}
          onCircuitModeChange={(mode) => handleUpdateCurrentSheet({ circuitType: mode })}
          onLoadFlowchartPreset={handleLoadFlowchartPreset}
          onLoadElectricPreset={handleLoadElectricPreset}
        />

        {/* Center Interactive Circuit Canvas (Direct Terminal Wiring & Variable Output Displays) */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <Canvas
            sheet={currentSheet}
            selectedNodeId={selectedNodeId}
            selectedWireId={selectedWireId}
            showGrid={settings.showGrid}
            snapToGrid={settings.snapToGrid}
            wireStyle={settings.wireStyle}
            simulationRunning={settings.running}
            theme={settings.theme || 'light'}
            showWireExpressions={settings.showWireExpressions || false}
            showComponentVariables={settings.showComponentVariables !== false}
            onTogglePlayPause={() => setSettings({ ...settings, running: !settings.running })}
            onStepSimulation={stepSimulation}
            onUpdateSheet={handleUpdateCurrentSheet}
            onSelectNode={(id) => {
              setSelectedNodeId(id);
              if (id === null) {
                setSelectedNodeIds([]);
              }
            }}
            selectedNodeIds={selectedNodeIds}
            onSelectNodes={(ids) => {
              setSelectedNodeIds(ids);
              if (ids.length === 0) {
                setSelectedNodeId(null);
              } else if (!selectedNodeId || !ids.includes(selectedNodeId)) {
                setSelectedNodeId(ids[0]);
              }
            }}
            onDeleteNode={handleDeleteNode}
            onDeleteNodes={handleDeleteNodes}
            onDuplicateNodes={handleDuplicateNodes}
            onGroupSubcircuit={handleGroupSubcircuit}
            onNavigateToSheet={handleSelectSheet}
            onSelectWire={setSelectedWireId}
            onDeleteWire={handleDeleteWire}
            onUpdateWireLabel={handleUpdateWireLabel}
            onToggleSwitch={handleToggleSwitch}
            onButtonPress={handleButtonPress}
            onUpdateNodeState={handleUpdateNodeState}
            onCopy={handleCopy}
            onCut={handleCut}
            onPaste={handlePaste}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            onToggleGrid={() => setSettings((prev) => ({ ...prev, showGrid: !prev.showGrid }))}
            onToggleSnap={() => setSettings((prev) => ({ ...prev, snapToGrid: !prev.snapToGrid }))}
            onToggleWireStyle={() => setSettings((prev) => ({ ...prev, wireStyle: prev.wireStyle === 'curved' ? 'orthogonal' : 'curved' }))}
            onAddComponent={handleAddComponent}
            onCreateSheet={() => handleCreateSheet('logic')}
          />

          {/* Interactive Flowchart Execution & Variable Watch Panel */}
          {isFlowchartSheet && (
            <FlowchartPanel
              executionState={flowchartState}
              onStep={handleStepFlowchart}
              onRunToggle={handleToggleFlowchartRun}
              onReset={handleResetFlowchart}
              onSelectPreset={handleLoadFlowchartPreset}
              isRunning={isFlowchartRunning}
              speedMs={flowchartSpeedMs}
              onSpeedChange={setFlowchartSpeedMs}
              onClearLogs={() =>
                setFlowchartState((prev) => ({
                  ...prev,
                  logs: [],
                }))
              }
              theme={settings.theme || 'light'}
            />
          )}

          {/* Collapsible Digital Timing Waveform Scope */}
          <TimingDiagram
            signals={signals}
            isOpen={settings.showTimingDiagram}
            onToggle={() =>
              setSettings({ ...settings, showTimingDiagram: !settings.showTimingDiagram })
            }
            onClear={() => setSignals([])}
            theme={settings.theme || 'light'}
          />

          {/* Multi-Sheet Tabs Bar */}
          <SheetTabs
            sheets={activeProject?.sheets || [currentSheet]}
            activeSheetId={activeProject?.activeSheetId || currentSheet.id}
            onSelectSheet={handleSelectSheet}
            onCreateSheet={handleCreateSheet}
            onRenameSheet={handleRenameSheet}
            onDuplicateSheet={handleDuplicateSheet}
            onDeleteSheet={handleDeleteSheet}
            theme={settings.theme || 'light'}
          />
        </div>
      </div>

      {/* Dialog Modals */}
      <TruthTableModal
        theme={settings.theme || 'light'}
        nodes={currentSheet.nodes}
        wires={currentSheet.wires}
        isOpen={isTruthTableOpen}
        onClose={() => setIsTruthTableOpen(false)}
        onApplyRowInputs={handleApplyTruthTableRow}
      />

      <ExportImportModal
          theme={settings.theme || 'light'}
        isOpen={isExportModalOpen}
        sheets={activeProject?.sheets || [currentSheet]}
        activeSheetId={activeProject?.activeSheetId || currentSheet.id}
        onClose={() => setIsExportModalOpen(false)}
        onImportSheets={(imported) => {
          if (!activeProject) return;
          if (imported.length === 0) return;
          setProjects((prev) =>
            prev.map((p) => (p.id === activeProject.id ? { ...p, sheets: imported } : p))
          );
        }}
        onResetToDefaults={() => {
          if (!activeProject) return;
          const defaults = createPresetSheets();
          setProjects((prev) =>
            prev.map((p) => (p.id === activeProject.id ? { ...p, sheets: defaults } : p))
          );
        }}
      />

      {/* Action Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-900/95 border border-sky-500/40 text-sky-300 shadow-xl text-xs font-medium flex items-center gap-2 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <ShortcutsModal
        theme={settings.theme || 'light'}
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}
