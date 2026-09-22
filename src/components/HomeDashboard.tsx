import React, { useEffect, useState, useMemo } from 'react';
import { DesignFolder, Project, SimulationSettings } from '../types';
import { createPresetSheets } from '../utils/presets';
import { createElectricPresets } from '../utils/electricPresets';
import { parseDesignDocument } from '../core/designDocument';
import { ContextMenu, ContextMenuItem } from './ContextMenu';
import { sound } from '../utils/sound';
import {
  Plus,
  FolderOpen,
  Copy,
  Trash2,
  Upload,
  Download,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Edit2,
  Check,
  Github,
  GitFork,
  LayoutDashboard,
  Settings2,
  Search,
  Sun,
  Moon,
  FolderKanban,
  ChevronRight,
  ChevronDown,
  List,
  Grid2X2,
  ArrowUpDown,
  MoreHorizontal,
  Info,
  ExternalLink,
  FolderPlus,
  PanelLeft,
  PanelLeftClose,
  Zap,
  Menu,
  Volume2,
  VolumeX,
  Sliders,
  ShieldAlert,
  Cpu,
  HardDrive,
  RefreshCw,
  Key,
  HelpCircle,
  CheckCircle2,
  Split,
  Database,
  FileText,
  Activity,
  RotateCcw,
  AlertTriangle,
  X,
} from 'lucide-react';

interface HomeDashboardProps {
  theme?: 'dark' | 'light';
  onThemeChange?: (theme: 'dark' | 'light') => void;
  projects: Project[];
  folders: DesignFolder[];
  onOpenProject: (projectId: string) => void;
  onCreateBlankProject: (name?: string, circuitType?: 'logic' | 'flowchart' | 'electric') => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onImportProject: (importedData: any) => void;
  onLoadPresetAsProject: (presetType: 'half_adder' | 'sr_latch' | 'all_gates' | 'd_flipflop' | 'mux_routing' | 'clock_7seg') => void;
  onLoadFlowchartPresetAsProject?: (presetId: string) => void;
  onLoadElectricPresetAsProject?: (presetId: string) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onAssignProjectFolder: (projectId: string, folderId: string | undefined) => void;
  settings?: SimulationSettings;
  onUpdateSettings?: (settings: Partial<SimulationSettings>) => void;
  onResetWorkspace?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  theme = 'dark',
  onThemeChange,
  projects,
  folders,
  onOpenProject,
  onCreateBlankProject,
  onDuplicateProject,
  onDeleteProject,
  onRenameProject,
  onImportProject,
  onLoadPresetAsProject,
  onLoadFlowchartPresetAsProject,
  onLoadElectricPresetAsProject,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onAssignProjectFolder,
  settings,
  onUpdateSettings,
  onResetWorkspace,
}) => {
  const isDark = theme === 'dark';
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [presetCategory, setPresetCategory] = useState<'circuits' | 'electric' | 'flowcharts'>('circuits');
  const [projectTab, setProjectTab] = useState<'all' | 'circuits' | 'electric' | 'flowcharts'>('all');
  const [activeNav, setActiveNav] = useState<'projects' | 'settings'>('projects');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectLayout, setProjectLayout] = useState<'grid' | 'list'>('grid');
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isNewProjectMenuOpen, setIsNewProjectMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    title?: string;
    items: ContextMenuItem[];
  } | null>(null);

  // In-app modal states for safe deletion & folder operations (avoids iframe blocking of window.confirm / window.prompt)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<DesignFolder | null>(null);
  const [folderModalState, setFolderModalState] = useState<{
    mode: 'create' | 'rename';
    folderId?: string;
    name: string;
  } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importErrorMessage, setImportErrorMessage] = useState<string | null>(null);

  const handleExportProject = (project: Project, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${project.name.toLowerCase().replace(/\s+/g, '_')}.lgkx`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportAllWorkspace = () => {
    const backup = {
      version: '4.2',
      timestamp: Date.now(),
      projects,
      folders,
      settings,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `logixflow_workspace_backup_${new Date().toISOString().slice(0, 10)}.lgkx`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleProjectContextMenu = (project: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const folderItems: ContextMenuItem[] = [
      {
        id: 'no-folder',
        label: 'None (Unassigned)',
        onClick: () => onAssignProjectFolder(project.id, undefined),
      },
      ...folders.map((f) => ({
        id: `folder-${f.id}`,
        label: f.name,
        onClick: () => onAssignProjectFolder(project.id, f.id),
      })),
    ];

    const items: ContextMenuItem[] = [
      {
        id: 'open',
        label: 'Open Workspace',
        icon: FolderOpen,
        onClick: () => onOpenProject(project.id),
      },
      {
        id: 'duplicate',
        label: 'Duplicate Project',
        icon: Copy,
        shortcut: 'Ctrl+D',
        onClick: () => onDuplicateProject(project.id),
      },
      {
        id: 'rename',
        label: 'Rename Project',
        icon: Edit2,
        onClick: () => handleStartRename(project, e),
      },
      {
        id: 'move-folder',
        label: 'Move to Folder...',
        icon: FolderKanban,
        submenu: folderItems.length > 1 ? folderItems : undefined,
      },
      {
        id: 'export',
        label: 'Export File (.lgkx)',
        icon: Download,
        onClick: () => handleExportProject(project),
      },
      {
        id: 'div-del',
        label: '',
        divider: true,
      },
      {
        id: 'delete',
        label: 'Delete Project',
        icon: Trash2,
        danger: true,
        shortcut: 'Del',
        onClick: () => setProjectToDelete(project),
      },
    ];

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      title: `Project: ${project.name}`,
      items,
    });
  };

  const handleFolderContextMenu = (folder: DesignFolder, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const items: ContextMenuItem[] = [
      {
        id: 'select-folder',
        label: 'Filter to this Folder',
        icon: FolderOpen,
        onClick: () => setSelectedFolderId(folder.id),
      },
      {
        id: 'new-circuit-in-folder',
        label: 'New Circuit in Folder',
        icon: Plus,
        onClick: () => {
          onCreateBlankProject(undefined, 'logic');
        },
      },
      {
        id: 'rename-folder',
        label: 'Rename Folder',
        icon: Edit2,
        onClick: () => {
          setFolderModalState({ mode: 'rename', folderId: folder.id, name: folder.name });
        },
      },
      {
        id: 'div-del',
        label: '',
        divider: true,
      },
      {
        id: 'delete-folder',
        label: 'Delete Folder',
        icon: Trash2,
        danger: true,
        onClick: () => {
          setFolderToDelete(folder);
        },
      },
    ];

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      title: `Folder: ${folder.name}`,
      items,
    });
  };

  const handleDashboardContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, input, select, textarea, a, .context-menu-ignore')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const items: ContextMenuItem[] = [
      {
        id: 'new-logic',
        label: 'New Logic Circuit',
        icon: Layers,
        onClick: () => onCreateBlankProject(undefined, 'logic'),
      },
      {
        id: 'new-electric',
        label: 'New Electric Circuit',
        icon: Zap,
        onClick: () => onCreateBlankProject('Untitled Electric Circuit', 'electric'),
      },
      {
        id: 'new-flowchart',
        label: 'New Flowchart Algorithm',
        icon: GitFork,
        onClick: () => onCreateBlankProject('Untitled Algorithm', 'flowchart'),
      },
      {
        id: 'div-folder',
        label: '',
        divider: true,
      },
      {
        id: 'new-folder',
        label: 'New Folder...',
        icon: FolderPlus,
        onClick: () => {
          setFolderModalState({ mode: 'create', name: '' });
        },
      },
      {
        id: 'export-all',
        label: 'Export Workspace Backup (.lgkx)',
        icon: Download,
        onClick: handleExportAllWorkspace,
      },
      {
        id: 'div-nav',
        label: '',
        divider: true,
      },
      {
        id: 'nav-settings',
        label: 'Workspace Settings',
        icon: Settings2,
        onClick: () => setActiveNav('settings'),
      },
    ];

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      title: 'Workspace Actions',
      items,
    });
  };

  const newProjectOptions = [
    {
      key: 'logic',
      label: 'Logic Circuit',
      description: 'Digital logic schematic',
      icon: Layers,
      accent: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      create: () => onCreateBlankProject(undefined, 'logic')
    },
    {
      key: 'electric',
      label: 'Electric Circuit',
      description: 'Electrical schematic',
      icon: Zap,
      accent: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      create: () => onCreateBlankProject('Untitled Electric Circuit', 'electric')
    },
    {
      key: 'flowchart',
      label: 'Flowchart',
      description: 'Algorithmic process map',
      icon: GitFork,
      accent: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      create: () => onCreateBlankProject('Untitled Algorithm', 'flowchart')
    }
  ] as const;

  useEffect(() => {
    if (selectedProjectId && !projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(null);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (selectedFolderId && !folders.some((folder) => folder.id === selectedFolderId)) {
      setSelectedFolderId(null);
    }
  }, [folders, selectedFolderId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (projectToDelete) {
          setProjectToDelete(null);
          return;
        }
        if (folderToDelete) {
          setFolderToDelete(null);
          return;
        }
        if (folderModalState) {
          setFolderModalState(null);
          return;
        }
        if (showResetConfirm) {
          setShowResetConfirm(false);
          return;
        }
        if (selectedProjectId) {
          setSelectedProjectId(null);
          return;
        }
      }

      // Quick Delete key when a project is selected
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const activeEl = document.activeElement;
        const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
        if (!isInput && selectedProjectId && !projectToDelete && !folderToDelete && !folderModalState && !showResetConfirm) {
          const proj = projects.find((p) => p.id === selectedProjectId);
          if (proj) {
            setProjectToDelete(proj);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProjectId, projectToDelete, folderToDelete, folderModalState, showResetConfirm, projects]);

  const handleStartRename = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(project.id);
    setEditName(project.name);
  };

  const handleSaveRename = (projectId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editName.trim()) {
      onRenameProject(projectId, editName.trim());
    }
    setEditingId(null);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawContent = event.target?.result as string;
        let parsed: any;
        try {
          parsed = JSON.parse(rawContent);
        } catch {
          parsed = parseDesignDocument(rawContent);
        }
        onImportProject(parsed);
      } catch {
        setImportErrorMessage('Invalid circuit or workspace file format (.lgkx / .lgf / .json). Please check the file and try again.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Helper to determine if a project is an electric circuit
  const isProjectElectric = (project: Project): boolean => {
    if (project.circuitType === 'electric') return true;
    return project.sheets.some(
      (s) =>
        s.circuitType === 'electric' ||
        s.nodes?.some((n) => n.type.startsWith('ELEC_'))
    );
  };

  // Helper to determine if a project is a flowchart algorithm
  const isProjectFlowchart = (project: Project): boolean => {
    if (project.circuitType === 'flowchart') return true;
    return project.sheets.some(
      (s) =>
        s.circuitType === 'flowchart' ||
        s.nodes?.some((n) => n.type.startsWith('FLOW_'))
    );
  };

  const isProjectLogic = (project: Project): boolean => {
    return !isProjectFlowchart(project) && !isProjectElectric(project);
  };

  // Divide saved projects into circuits, electric, and flowcharts
  const scopedProjects = useMemo(
    () => selectedFolderId ? projects.filter((project) => project.folderId === selectedFolderId) : projects,
    [projects, selectedFolderId]
  );
  const circuitProjects = useMemo(
    () => scopedProjects.filter((p) => isProjectLogic(p)),
    [scopedProjects]
  );
  const electricProjects = useMemo(
    () => scopedProjects.filter((p) => isProjectElectric(p)),
    [scopedProjects]
  );
  const flowchartProjects = useMemo(
    () => scopedProjects.filter((p) => isProjectFlowchart(p)),
    [scopedProjects]
  );

  const recentProjects = useMemo(
    () => [...scopedProjects]
      .filter((project) => project.name.toLowerCase().includes(projectSearch.toLowerCase()))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 8),
    [scopedProjects, projectSearch]
  );

  const workspaceMetrics = useMemo(() => {
    const circuits = projects.filter((project) => isProjectLogic(project)).length;
    const electricCount = projects.filter((project) => isProjectElectric(project)).length;
    const flowcharts = projects.filter((project) => isProjectFlowchart(project)).length;
    const totalNodes = projects.reduce((sum, project) => sum + project.sheets.reduce((sheetSum, sheet) => sheetSum + (sheet.nodes?.length ?? 0), 0), 0);
    const totalWires = projects.reduce((sum, project) => sum + project.sheets.reduce((sheetSum, sheet) => sheetSum + (sheet.wires?.length ?? 0), 0), 0);
    const activeProjectCount = projects.filter((project) => project.updatedAt > Date.now() - 1000 * 60 * 60 * 24 * 7).length;

    return {
      totalProjects: projects.length,
      circuits,
      electricCount,
      flowcharts,
      totalNodes,
      totalWires,
      folders: folders.length,
      activeThisWeek: activeProjectCount,
    };
  }, [projects, folders]);

  const closeSelectedProject = () => setSelectedProjectId(null);
  const toggleSelectedProject = (projectId: string) => {
    setSelectedProjectId((current) => (current === projectId ? null : projectId));
  };

  const selectedProject = projects.find((project) => project.id === selectedProjectId) || null;
  const visibleCircuitProjects = useMemo(
    () => circuitProjects
      .filter((project) => project.name.toLowerCase().includes(projectSearch.toLowerCase()))
      .sort((a, b) => sortNewestFirst ? b.updatedAt - a.updatedAt : a.updatedAt - b.updatedAt),
    [circuitProjects, projectSearch, sortNewestFirst]
  );
  const visibleElectricProjects = useMemo(
    () => electricProjects
      .filter((project) => project.name.toLowerCase().includes(projectSearch.toLowerCase()))
      .sort((a, b) => sortNewestFirst ? b.updatedAt - a.updatedAt : a.updatedAt - b.updatedAt),
    [electricProjects, projectSearch, sortNewestFirst]
  );
  const visibleFlowchartProjects = useMemo(
    () => flowchartProjects
      .filter((project) => project.name.toLowerCase().includes(projectSearch.toLowerCase()))
      .sort((a, b) => sortNewestFirst ? b.updatedAt - a.updatedAt : a.updatedAt - b.updatedAt),
    [flowchartProjects, projectSearch, sortNewestFirst]
  );

  // Helper to count components across project sheets (Logic Circuits)
  const getProjectStats = (project: Project) => {
    let gateCount = 0;
    let inputCount = 0;
    let outputCount = 0;
    let wireCount = 0;

    project.sheets.forEach((sheet) => {
      wireCount += sheet.wires?.length || 0;
      sheet.nodes?.forEach((n) => {
        if (['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER', 'HALF_ADDER', 'FULL_ADDER', 'MUX_2TO1', 'DEMUX_1TO2'].includes(n.type)) {
          gateCount++;
        } else if (['SWITCH', 'BUTTON', 'CLOCK', 'HIGH_CONST', 'LOW_CONST'].includes(n.type)) {
          inputCount++;
        } else {
          outputCount++;
        }
      });
    });

    const totalNodes = gateCount + inputCount + outputCount;
    return { gateCount, inputCount, outputCount, wireCount, totalNodes };
  };

  // Helper to count components across electric circuit sheets
  const getElectricStats = (project: Project) => {
    let passiveCount = 0;
    let sourceCount = 0;
    let meterCount = 0;
    let wireCount = 0;

    project.sheets.forEach((sheet) => {
      wireCount += sheet.wires?.length || 0;
      sheet.nodes?.forEach((n) => {
        if (['ELEC_RESISTOR', 'ELEC_CAPACITOR', 'ELEC_INDUCTOR', 'ELEC_POTENTIOMETER', 'ELEC_DIODE', 'ELEC_LED'].includes(n.type)) {
          passiveCount++;
        } else if (['ELEC_BATTERY', 'ELEC_DC_SOURCE', 'ELEC_AC_SOURCE'].includes(n.type)) {
          sourceCount++;
        } else if (['ELEC_VOLTMETER', 'ELEC_AMMETER', 'ELEC_OHMMETER', 'ELEC_OSCILLOSCOPE'].includes(n.type)) {
          meterCount++;
        }
      });
    });

    const totalNodes = passiveCount + sourceCount + meterCount;
    return { passiveCount, sourceCount, meterCount, wireCount, totalNodes };
  };

  // Helper to count blocks across flowchart algorithm sheets
  const getFlowchartStats = (project: Project) => {
    let blockCount = 0;
    let decisionCount = 0;
    let ioCount = 0;
    let flowPaths = 0;

    project.sheets.forEach((sheet) => {
      flowPaths += sheet.wires?.length || 0;
      sheet.nodes?.forEach((n) => {
        if (n.type === 'FLOW_DECISION') {
          decisionCount++;
        } else if (n.type === 'FLOW_INPUT' || n.type === 'FLOW_OUTPUT') {
          ioCount++;
        } else if (n.type.startsWith('FLOW_')) {
          blockCount++;
        }
      });
    });

    const totalBlocks = blockCount + decisionCount + ioCount;
    return { blockCount, decisionCount, ioCount, flowPaths, totalBlocks };
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const renderSchematicSymbol = (
    node: any,
    x: number,
    y: number,
    w: number,
    h: number,
    variant: 'circuit' | 'flowchart'
  ) => {
    const type = node.type;
    const label = node.label || type;

    if (variant === 'flowchart') {
      if (type === 'FLOW_START' || type === 'FLOW_END') {
        return (
          <g key={node.id}>
            <rect x={x} y={y} width={w} height={h} rx={h / 2} fill="#1e293b" stroke="#f59e0b" strokeWidth="1.2" />
            <text x={x + w / 2} y={y + h / 2 + 1.5} textAnchor="middle" fontSize={Math.min(h * 0.35, 4.2)} fill="#fbbf24" fontWeight="bold">
              {type === 'FLOW_START' ? 'START' : 'END'}
            </text>
          </g>
        );
      }
      if (type === 'FLOW_DECISION') {
        return (
          <g key={node.id}>
            <polygon
              points={`${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}`}
              fill="#1e293b"
              stroke="#a855f7"
              strokeWidth="1.2"
            />
            <text x={x + w / 2} y={y + h / 2 + 1.5} textAnchor="middle" fontSize={Math.min(h * 0.3, 3.8)} fill="#c084fc" fontWeight="bold">
              {label.length > 5 ? `${label.slice(0, 5)}?` : label}
            </text>
          </g>
        );
      }
      if (type === 'FLOW_INPUT' || type === 'FLOW_OUTPUT') {
        const s = Math.min(w * 0.18, 5);
        return (
          <g key={node.id}>
            <polygon
              points={`${x + s},${y} ${x + w},${y} ${x + w - s},${y + h} ${x},${y + h}`}
              fill="#1e293b"
              stroke="#10b981"
              strokeWidth="1.2"
            />
            <text x={x + w / 2} y={y + h / 2 + 1.5} textAnchor="middle" fontSize={Math.min(h * 0.32, 4)} fill="#34d399" fontWeight="bold">
              {label.length > 5 ? `${label.slice(0, 5)}…` : label}
            </text>
          </g>
        );
      }
      return (
        <g key={node.id}>
          <rect x={x} y={y} width={w} height={h} rx="2" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.2" />
          <text x={x + w / 2} y={y + h / 2 + 1.5} textAnchor="middle" fontSize={Math.min(h * 0.32, 4)} fill="#fde68a" fontWeight="bold">
            {label.length > 5 ? `${label.slice(0, 5)}…` : label}
          </text>
        </g>
      );
    }

    // Electric Circuit Component Symbols
    if (type.startsWith('ELEC_')) {
      if (type === 'ELEC_RESISTOR' || type === 'ELEC_POTENTIOMETER') {
        return (
          <g key={node.id}>
            <title>{label}</title>
            <line x1={x} y1={y + h / 2} x2={x + w * 0.2} y2={y + h / 2} stroke="#10b981" strokeWidth="1" />
            <line x1={x + w * 0.8} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke="#10b981" strokeWidth="1" />
            <path
              d={`M ${x + w * 0.2} ${y + h / 2} L ${x + w * 0.3} ${y + h * 0.2} L ${x + w * 0.4} ${y + h * 0.8} L ${x + w * 0.5} ${y + h * 0.2} L ${x + w * 0.6} ${y + h * 0.8} L ${x + w * 0.7} ${y + h * 0.2} L ${x + w * 0.8} ${y + h / 2}`}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.2"
            />
          </g>
        );
      }
      if (type === 'ELEC_CAPACITOR') {
        return (
          <g key={node.id}>
            <title>{label}</title>
            <line x1={x} y1={y + h / 2} x2={x + w * 0.42} y2={y + h / 2} stroke="#06b6d4" strokeWidth="1" />
            <line x1={x + w * 0.58} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke="#06b6d4" strokeWidth="1" />
            <line x1={x + w * 0.42} y1={y + h * 0.15} x2={x + w * 0.42} y2={y + h * 0.85} stroke="#06b6d4" strokeWidth="1.5" />
            <line x1={x + w * 0.58} y1={y + h * 0.15} x2={x + w * 0.58} y2={y + h * 0.85} stroke="#06b6d4" strokeWidth="1.5" />
          </g>
        );
      }
      if (type === 'ELEC_INDUCTOR') {
        return (
          <g key={node.id}>
            <title>{label}</title>
            <line x1={x} y1={y + h / 2} x2={x + w * 0.15} y2={y + h / 2} stroke="#3b82f6" strokeWidth="1" />
            <line x1={x + w * 0.85} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke="#3b82f6" strokeWidth="1" />
            <path
              d={`M ${x + w * 0.15} ${y + h / 2} A 4 4 0 0 1 ${x + w * 0.38} ${y + h / 2} A 4 4 0 0 1 ${x + w * 0.62} ${y + h / 2} A 4 4 0 0 1 ${x + w * 0.85} ${y + h / 2}`}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.2"
            />
          </g>
        );
      }
      if (type === 'ELEC_BATTERY' || type === 'ELEC_DC_SOURCE') {
        return (
          <g key={node.id}>
            <title>{label}</title>
            <line x1={x} y1={y + h / 2} x2={x + w * 0.38} y2={y + h / 2} stroke="#f59e0b" strokeWidth="1" />
            <line x1={x + w * 0.62} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke="#f59e0b" strokeWidth="1" />
            <line x1={x + w * 0.38} y1={y + h * 0.1} x2={x + w * 0.38} y2={y + h * 0.9} stroke="#f59e0b" strokeWidth="2" />
            <line x1={x + w * 0.62} y1={y + h * 0.25} x2={x + w * 0.62} y2={y + h * 0.75} stroke="#f59e0b" strokeWidth="1.2" />
          </g>
        );
      }
      if (type === 'ELEC_GROUND') {
        return (
          <g key={node.id}>
            <title>{label}</title>
            <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h * 0.5} stroke="#64748b" strokeWidth="1" />
            <line x1={x + w * 0.2} y1={y + h * 0.5} x2={x + w * 0.8} y2={y + h * 0.5} stroke="#64748b" strokeWidth="1.5" />
            <line x1={x + w * 0.35} y1={y + h * 0.7} x2={x + w * 0.65} y2={y + h * 0.7} stroke="#64748b" strokeWidth="1.2" />
            <line x1={x + w * 0.45} y1={y + h * 0.9} x2={x + w * 0.55} y2={y + h * 0.9} stroke="#64748b" strokeWidth="1" />
          </g>
        );
      }
      if (type === 'ELEC_DIODE' || type === 'ELEC_ZENER' || type === 'ELEC_LED') {
        return (
          <g key={node.id}>
            <title>{label}</title>
            <line x1={x} y1={y + h / 2} x2={x + w * 0.3} y2={y + h / 2} stroke="#ec4899" strokeWidth="1" />
            <line x1={x + w * 0.7} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke="#ec4899" strokeWidth="1" />
            <polygon points={`${x + w * 0.3},${y + h * 0.15} ${x + w * 0.7},${y + h / 2} ${x + w * 0.3},${y + h * 0.85}`} fill="#ec4899" opacity="0.3" stroke="#ec4899" strokeWidth="1" />
            <line x1={x + w * 0.7} y1={y + h * 0.15} x2={x + w * 0.7} y2={y + h * 0.85} stroke="#ec4899" strokeWidth="1.5" />
          </g>
        );
      }
      return (
        <g key={node.id}>
          <title>{label}</title>
          <circle cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) * 0.4} fill="#0f172a" stroke="#10b981" strokeWidth="1.2" />
          <text x={x + w / 2} y={y + h / 2 + 1.5} textAnchor="middle" fontSize={Math.min(h * 0.35, 4.2)} fill="#34d399" fontWeight="bold">
            {type === 'ELEC_VOLTMETER' ? 'V' : type === 'ELEC_AMMETER' ? 'A' : '⚡'}
          </text>
        </g>
      );
    }

    // Circuit IEEE/ANSI Logic Symbols
    switch (type) {
      case 'AND': {
        const r = h * 0.38;
        return (
          <g key={node.id}>
            <title>{label}</title>
            <line x1={x} y1={y + h * 0.3} x2={x + w * 0.22} y2={y + h * 0.3} stroke="#64748b" strokeWidth="1" />
            <line x1={x} y1={y + h * 0.7} x2={x + w * 0.22} y2={y + h * 0.7} stroke="#64748b" strokeWidth="1" />
            <line x1={x + w * 0.85} y1={y + h * 0.5} x2={x + w} y2={y + h * 0.5} stroke="#38bdf8" strokeWidth="1" />
            <path
              d={`M ${x + w * 0.22} ${y + h * 0.15} L ${x + w * 0.52} ${y + h * 0.15} A ${r} ${r} 0 0 1 ${x + w * 0.52} ${y + h * 0.85} L ${x + w * 0.22} ${y + h * 0.85} Z`}
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />
            <text x={x + w * 0.42} y={y + h * 0.55} textAnchor="middle" fontSize={Math.min(h * 0.35, 4.5)} fill="#94a3b8" fontWeight="bold" fontFamily="monospace">
              &amp;
            </text>
          </g>
        );
      }
      case 'NAND': {
        const r = h * 0.36;
        return (
          <g key={node.id}>
            <title>{label}</title>
            <line x1={x} y1={y + h * 0.3} x2={x + w * 0.22} y2={y + h * 0.3} stroke="#64748b" strokeWidth="1" />
            <line x1={x} y1={y + h * 0.7} x2={x + w * 0.22} y2={y + h * 0.7} stroke="#64748b" strokeWidth="1" />
            <line x1={x + w * 0.9} y1={y + h * 0.5} x2={x + w} y2={y + h * 0.5} stroke="#38bdf8" strokeWidth="1" />
            <path
              d={`M ${x + w * 0.22} ${y + h * 0.15} L ${x + w * 0.48} ${y + h * 0.15} A ${r} ${r} 0 0 1 ${x + w * 0.48} ${y + h * 0.85} L ${x + w * 0.22} ${y + h * 0.85} Z`}
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />
            <circle cx={x + w * 0.8} cy={y + h * 0.5} r={Math.max(w * 0.05, 1.8)} fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
          </g>
        );
      }
      case 'OR': {
        return (
          <g key={node.id}>
            <title>{label}</title>
            <line x1={x} y1={y + h * 0.3} x2={x + w * 0.26} y2={y + h * 0.3} stroke="#64748b" strokeWidth="1" />
            <line x1={x} y1={y + h * 0.7} x2={x + w * 0.26} y2={y + h * 0.7} stroke="#64748b" strokeWidth="1" />
            <line x1={x + w * 0.85} y1={y + h * 0.5} x2={x + w} y2={y + h * 0.5} stroke="#38bdf8" strokeWidth="1" />
            <path
              d={`M ${x + w * 0.2} ${y + h * 0.15} Q ${x + w * 0.36} ${y + h * 0.5} ${x + w * 0.2} ${y + h * 0.85} Q ${x + w * 0.58} ${y + h * 0.85} ${x + w * 0.85} ${y + h * 0.5} Q ${x + w * 0.58} ${y + h * 0.15} ${x + w * 0.2} ${y + h * 0.15} Z`}
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />
            <text x={x + w * 0.46} y={y + h * 0.55} textAnchor="middle" fontSize={Math.min(h * 0.32, 4.5)} fill="#94a3b8" fontWeight="bold" fontFamily="monospace">
              &#8805;1
            </text>
          </g>
        );
      }
      case 'NOR': {
        return (
          <g key={node.id}>
            <title>{label}</title>
            <line x1={x} y1={y + h * 0.3} x2={x + w * 0.24} y2={y + h * 0.3} stroke="#64748b" strokeWidth="1" />
            <line x1={x} y1={y + h * 0.7} x2={x + w * 0.24} y2={y + h * 0.7} stroke="#64748b" strokeWidth="1" />
            <line x1={x + w * 0.9} y1={y + h * 0.5} x2={x + w} y2={y + h * 0.5} stroke="#38bdf8" strokeWidth="1" />
            <path
              d={`M ${x + w * 0.18} ${y + h * 0.15} Q ${x + w * 0.34} ${y + h * 0.5} ${x + w * 0.18} ${y + h * 0.85} Q ${x + w * 0.52} ${y + h * 0.85} ${x + w * 0.76} ${y + h * 0.5} Q ${x + w * 0.52} ${y + h * 0.15} ${x + w * 0.18} ${y + h * 0.15} Z`}
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />
            <circle cx={x + w * 0.83} cy={y + h * 0.5} r={Math.max(w * 0.05, 1.8)} fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
          </g>
        );
      }
      case 'XOR': {
        return (
          <g key={node.id}>
            <title>{label}</title>
            <line x1={x} y1={y + h * 0.3} x2={x + w * 0.22} y2={y + h * 0.3} stroke="#64748b" strokeWidth="1" />
            <line x1={x} y1={y + h * 0.7} x2={x + w * 0.22} y2={y + h * 0.7} stroke="#64748b" strokeWidth="1" />
            <line x1={x + w * 0.88} y1={y + h * 0.5} x2={x + w} y2={y + h * 0.5} stroke="#38bdf8" strokeWidth="1" />
            <path d={`M ${x + w * 0.14} ${y + h * 0.15} Q ${x + w * 0.3} ${y + h * 0.5} ${x + w * 0.14} ${y + h * 0.85}`} fill="none" stroke="#38bdf8" strokeWidth="1.2" />
            <path
              d={`M ${x + w * 0.24} ${y + h * 0.15} Q ${x + w * 0.38} ${y + h * 0.5} ${x + w * 0.24} ${y + h * 0.85} Q ${x + w * 0.58} ${y + h * 0.85} ${x + w * 0.88} ${y + h * 0.5} Q ${x + w * 0.58} ${y + h * 0.15} ${x + w * 0.24} ${y + h * 0.15} Z`}
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />
            <text x={x + w * 0.48} y={y + h * 0.55} textAnchor="middle" fontSize={Math.min(h * 0.32, 4.5)} fill="#94a3b8" fontWeight="bold" fontFamily="monospace">
              =1
            </text>
          </g>
        );
      }
      case 'XNOR': {
        return (
          <g key={node.id}>
            <title>{label}</title>
            <line x1={x} y1={y + h * 0.3} x2={x + w * 0.2} y2={y + h * 0.3} stroke="#64748b" strokeWidth="1" />
            <line x1={x} y1={y + h * 0.7} x2={x + w * 0.2} y2={y + h * 0.7} stroke="#64748b" strokeWidth="1" />
            <line x1={x + w * 0.9} y1={y + h * 0.5} x2={x + w} y2={y + h * 0.5} stroke="#38bdf8" strokeWidth="1" />
            <path d={`M ${x + w * 0.12} ${y + h * 0.15} Q ${x + w * 0.28} ${y + h * 0.5} ${x + w * 0.12} ${y + h * 0.85}`} fill="none" stroke="#38bdf8" strokeWidth="1.2" />
            <path
              d={`M ${x + w * 0.2} ${y + h * 0.15} Q ${x + w * 0.36} ${y + h * 0.5} ${x + w * 0.2} ${y + h * 0.85} Q ${x + w * 0.52} ${y + h * 0.85} ${x + w * 0.76} ${y + h * 0.5} Q ${x + w * 0.52} ${y + h * 0.15} ${x + w * 0.2} ${y + h * 0.15} Z`}
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />
            <circle cx={x + w * 0.83} cy={y + h * 0.5} r={Math.max(w * 0.05, 1.8)} fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
          </g>
        );
      }
      case 'NOT': {
        return (
          <g key={node.id}>
            <title>{label}</title>
            <line x1={x} y1={y + h * 0.5} x2={x + w * 0.25} y2={y + h * 0.5} stroke="#64748b" strokeWidth="1" />
            <line x1={x + w * 0.88} y1={y + h * 0.5} x2={x + w} y2={y + h * 0.5} stroke="#38bdf8" strokeWidth="1" />
            <polygon
              points={`${x + w * 0.25},${y + h * 0.18} ${x + w * 0.72},${y + h * 0.5} ${x + w * 0.25},${y + h * 0.82}`}
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />
            <circle cx={x + w * 0.8} cy={y + h * 0.5} r={Math.max(w * 0.05, 1.8)} fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
          </g>
        );
      }
      case 'BUFFER': {
        return (
          <g key={node.id}>
            <title>{label}</title>
            <line x1={x} y1={y + h * 0.5} x2={x + w * 0.25} y2={y + h * 0.5} stroke="#64748b" strokeWidth="1" />
            <line x1={x + w * 0.78} y1={y + h * 0.5} x2={x + w} y2={y + h * 0.5} stroke="#38bdf8" strokeWidth="1" />
            <polygon
              points={`${x + w * 0.25},${y + h * 0.18} ${x + w * 0.78},${y + h * 0.5} ${x + w * 0.25},${y + h * 0.82}`}
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />
          </g>
        );
      }
      case 'SWITCH': {
        const isOn = !!node.state?.isOn;
        return (
          <g key={node.id}>
            <title>{label}</title>
            <rect x={x} y={y} width={w} height={h} rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <rect x={x + w * 0.2} y={y + h * 0.3} width={w * 0.6} height={h * 0.4} rx="3" fill={isOn ? '#065f46' : '#1e293b'} stroke={isOn ? '#10b981' : '#475569'} strokeWidth="1" />
            <circle cx={isOn ? x + w * 0.65 : x + w * 0.35} cy={y + h * 0.5} r={h * 0.18} fill={isOn ? '#34d399' : '#94a3b8'} />
            <line x1={x + w} y1={y + h * 0.5} x2={x + w + 2} y2={y + h * 0.5} stroke={isOn ? '#34d399' : '#64748b'} strokeWidth="1.2" />
          </g>
        );
      }
      case 'CLOCK': {
        return (
          <g key={node.id}>
            <title>{label}</title>
            <rect x={x} y={y} width={w} height={h} rx="3" fill="#0f172a" stroke="#0ea5e9" strokeWidth="1" />
            <path d={`M ${x + w * 0.25} ${y + h * 0.65} L ${x + w * 0.38} ${y + h * 0.65} L ${x + w * 0.38} ${y + h * 0.35} L ${x + w * 0.62} ${y + h * 0.35} L ${x + w * 0.62} ${y + h * 0.65} L ${x + w * 0.75} ${y + h * 0.65}`} fill="none" stroke="#38bdf8" strokeWidth="1.2" />
            <line x1={x + w} y1={y + h * 0.5} x2={x + w + 2} y2={y + h * 0.5} stroke="#38bdf8" strokeWidth="1.2" />
          </g>
        );
      }
      case 'HIGH_CONST': {
        return (
          <g key={node.id}>
            <title>{label}</title>
            <circle cx={x + w * 0.5} cy={y + h * 0.5} r={h * 0.38} fill="#064e3b" stroke="#10b981" strokeWidth="1.2" />
            <text x={x + w * 0.5} y={y + h * 0.62} textAnchor="middle" fontSize={Math.min(h * 0.5, 7)} fill="#34d399" fontWeight="bold" fontFamily="monospace">1</text>
          </g>
        );
      }
      case 'LOW_CONST': {
        return (
          <g key={node.id}>
            <title>{label}</title>
            <circle cx={x + w * 0.5} cy={y + h * 0.5} r={h * 0.38} fill="#1e293b" stroke="#64748b" strokeWidth="1.2" />
            <text x={x + w * 0.5} y={y + h * 0.62} textAnchor="middle" fontSize={Math.min(h * 0.5, 7)} fill="#94a3b8" fontWeight="bold" fontFamily="monospace">0</text>
          </g>
        );
      }
      case 'LED': {
        const isOn = !!node.state?.isOn;
        return (
          <g key={node.id}>
            <title>{label}</title>
            <circle cx={x + w * 0.5} cy={y + h * 0.5} r={h * 0.38} fill={isOn ? '#dc2626' : '#1e293b'} stroke={isOn ? '#f87171' : '#64748b'} strokeWidth="1.2" />
            {isOn && <circle cx={x + w * 0.5} cy={y + h * 0.5} r={h * 0.52} fill="none" stroke="#ef4444" strokeWidth="0.8" opacity="0.5" />}
          </g>
        );
      }
      case 'SEVEN_SEG': {
        return (
          <g key={node.id}>
            <title>{label}</title>
            <rect x={x} y={y} width={w} height={h} rx="2" fill="#020617" stroke="#334155" strokeWidth="1" />
            <text x={x + w * 0.5} y={y + h * 0.65} textAnchor="middle" fontSize={Math.min(h * 0.6, 9)} fill="#ef4444" fontWeight="bold" fontFamily="monospace">8</text>
          </g>
        );
      }
      // Dual In-line IC Chips (Adders, Flip-Flops, MUX, etc.)
      default: {
        return (
          <g key={node.id}>
            <title>{label}</title>
            <line x1={x} y1={y + h * 0.3} x2={x + 3} y2={y + h * 0.3} stroke="#64748b" strokeWidth="1.2" />
            <line x1={x} y1={y + h * 0.7} x2={x + 3} y2={y + h * 0.7} stroke="#64748b" strokeWidth="1.2" />
            <line x1={x + w - 3} y1={y + h * 0.5} x2={x + w} y2={y + h * 0.5} stroke="#38bdf8" strokeWidth="1.2" />
            <rect x={x + 2} y={y} width={w - 4} height={h} rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
            <path d={`M ${x + w / 2 - 2} ${y} A 2 2 0 0 0 ${x + w / 2 + 2} ${y}`} fill="none" stroke="#64748b" strokeWidth="0.8" />
            <text x={x + w / 2} y={y + h / 2 + 1.5} textAnchor="middle" fontSize={Math.min(h * 0.3, 4.2)} fill="#e2e8f0" fontWeight="bold" fontFamily="monospace">
              {label.length > 5 ? `${label.slice(0, 5)}` : label}
            </text>
          </g>
        );
      }
    }
  };

  const getProjectPreview = (project: Project, variant: 'circuit' | 'flowchart' | 'electric') => {
    const sheet = project.sheets.find((entry) => entry.id === project.activeSheetId) ?? project.sheets[0];
    const nodes = sheet?.nodes ?? [];
    const wires = sheet?.wires ?? [];

    if (!nodes.length) {
      return (
        <div className={`mt-3 flex h-24 items-center justify-center rounded-xl border border-dashed ${isDark ? 'border-slate-700 bg-slate-950/60 text-slate-500' : 'border-slate-300 bg-slate-100 text-slate-400'} text-[10px] uppercase tracking-[0.2em] font-mono`}>
          {variant === 'flowchart' ? 'No algorithm nodes' : variant === 'electric' ? 'No electrical nodes' : 'No schematic nodes'}
        </div>
      );
    }

    const left = Math.min(...nodes.map((node) => node.x));
    const top = Math.min(...nodes.map((node) => node.y));
    const right = Math.max(...nodes.map((node) => node.x + node.width));
    const bottom = Math.max(...nodes.map((node) => node.y + node.height));
    const width = Math.max(right - left, 80);
    const height = Math.max(bottom - top, 60);
    const padding = 14;
    const scale = Math.min((220 - padding * 2) / width, (110 - padding * 2) / height, 1.05);

    const mapX = (value: number) => (value - left) * scale + padding;
    const mapY = (value: number) => (value - top) * scale + padding;

    return (
      <div className={`mt-3 overflow-hidden rounded-xl border ${isDark ? 'border-slate-800 bg-[#070d18]' : 'border-slate-200 bg-[#f8fafc]'} relative shadow-inner`}>
        <svg viewBox="0 0 220 110" className="h-24 w-full" role="img" aria-label={`${project.name} schematic preview`}>
          <defs>
            <pattern id={`grid-dots-${project.id}`} width="11" height="11" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.6" fill={isDark ? "rgba(148, 163, 184, 0.18)" : "rgba(100, 116, 139, 0.25)"} />
            </pattern>
          </defs>

          {/* Blueprint Canvas */}
          <rect x="0" y="0" width="220" height="110" fill={isDark ? "#070d18" : "#f8fafc"} />
          <rect x="0" y="0" width="220" height="110" fill={`url(#grid-dots-${project.id})`} />

          {/* Altium-style Engineering Sheet Border */}
          <rect x="2" y="2" width="216" height="106" fill="none" stroke={isDark ? "rgba(56, 189, 248, 0.2)" : "rgba(2, 132, 199, 0.25)"} strokeWidth="0.8" rx="2" />
          <rect x="4" y="4" width="212" height="102" fill="none" stroke={isDark ? "rgba(56, 189, 248, 0.1)" : "rgba(2, 132, 199, 0.15)"} strokeWidth="0.5" />

          {/* Connected Wires with Solder Junction Dots */}
          {wires.map((wire) => {
            const fromNode = nodes.find((node) => node.id === wire.fromNodeId);
            const toNode = nodes.find((node) => node.id === wire.toNodeId);

            if (!fromNode || !toNode) return null;

            const fromX = mapX(fromNode.x + fromNode.width);
            const fromY = mapY(fromNode.y + fromNode.height / 2);
            const toX = mapX(toNode.x);
            const toY = mapY(toNode.y + toNode.height / 2);
            const midX = (fromX + toX) / 2;
            const wireColor = variant === 'circuit' ? '#38bdf8' : variant === 'electric' ? '#10b981' : '#fbbf24';
            const shadowColor = variant === 'circuit' ? '#0284c7' : variant === 'electric' ? '#059669' : '#d97706';

            return (
              <g key={wire.id}>
                {/* Wire Shadow/Halo */}
                <path
                  d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
                  fill="none"
                  stroke={shadowColor}
                  strokeWidth="2.5"
                  opacity="0.3"
                />
                {/* Main Signal Wire */}
                <path
                  d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
                  fill="none"
                  stroke={wireColor}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                {/* Solder Terminals */}
                <circle cx={fromX} cy={fromY} r="1.5" fill={wireColor} />
                <circle cx={toX} cy={toY} r="1.5" fill={wireColor} />
              </g>
            );
          })}

          {/* Genuine Logic Gates, Electric Components & Flowchart Symbols */}
          {nodes.map((node) => {
            const x = mapX(node.x);
            const y = mapY(node.y);
            const widthPx = Math.max(node.width * scale, 16);
            const heightPx = Math.max(node.height * scale, 12);
            return renderSchematicSymbol(node, x, y, widthPx, heightPx, variant === 'flowchart' ? 'flowchart' : 'circuit');
          })}

          {/* Title Block Watermark (Altium Style) */}
          <text x="212" y="101" textAnchor="end" fontSize="3.6" fill={isDark ? "#475569" : "#94a3b8"} fontFamily="monospace" fontWeight="bold">
            {variant === 'electric' ? 'ELEC SCHEMATIC' : variant === 'flowchart' ? 'FLOW CHART' : 'LOGIC SCHEMATIC'}
          </text>
          <text x="212" y="105" textAnchor="end" fontSize="3" fill={isDark ? "#334155" : "#cbd5e1"} fontFamily="monospace">
            {nodes.length} PARTS &bull; {wires.length} NETS
          </text>
        </svg>
      </div>
    );
  };

  const renderProjectCard = (project: Project, variant: 'circuit' | 'electric' | 'flowchart') => {
    const isEditing = editingId === project.id;
    const accent = variant === 'circuit' ? {
      ring: 'border-sky-500/80 ring-1 ring-sky-500/30',
      hover: 'border-sky-500/40',
      button: 'text-sky-500 hover:text-sky-400',
      input: 'border-sky-500',
      icon: 'text-sky-400',
      panel: isDark ? 'bg-slate-900/70 hover:bg-slate-900' : 'bg-white hover:bg-slate-50/90 shadow-xs',
      save: 'bg-sky-600 hover:bg-sky-500',
    } : variant === 'electric' ? {
      ring: 'border-emerald-500/80 ring-1 ring-emerald-500/30',
      hover: 'border-emerald-500/40',
      button: 'text-emerald-500 hover:text-emerald-400',
      input: 'border-emerald-500',
      icon: 'text-emerald-400',
      panel: isDark ? 'bg-slate-900/70 hover:bg-slate-900' : 'bg-white hover:bg-slate-50/90 shadow-xs',
      save: 'bg-emerald-600 hover:bg-emerald-500',
    } : {
      ring: 'border-amber-500/80 ring-1 ring-amber-500/30',
      hover: 'border-amber-500/40',
      button: 'text-amber-500 hover:text-amber-400',
      input: 'border-amber-500',
      icon: 'text-amber-400',
      panel: isDark ? 'bg-slate-900/70 hover:bg-slate-900' : 'bg-white hover:bg-slate-50/90 shadow-xs',
      save: 'bg-amber-600 hover:bg-amber-500',
    };

    if (variant === 'circuit') {
      const stats = getProjectStats(project);

      return (
        <div
          key={project.id}
          onClick={(e) => {
            e.stopPropagation();
            toggleSelectedProject(project.id);
          }}
          onContextMenu={(e) => handleProjectContextMenu(project, e)}
          className={`group flex flex-col justify-between p-4 rounded-xl border ${selectedProjectId === project.id ? accent.ring : `${isDark ? 'border-slate-800' : 'border-slate-200'} hover:${accent.hover}`} ${accent.panel} cursor-pointer transition-all duration-150 relative`}
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              {isEditing ? (
                <form onSubmit={(e) => handleSaveRename(project.id, e)} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 flex-1">
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus className={`flex-1 ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900 border-slate-300'} border rounded px-2 py-0.5 text-xs focus:outline-none ${accent.input}`} />
                  <button type="submit" className={`p-1 rounded text-white ${accent.save}`} title="Save">
                    <Check size={12} />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-1.5 truncate group/title">
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} truncate font-mono`}>{project.name}</h4>
                  <button type="button" onClick={(e) => handleStartRename(project, e)} className={`opacity-0 group-hover/title:opacity-100 p-1 text-slate-400 transition-opacity hover:${accent.icon}`} title="Rename circuit">
                    <Edit2 size={11} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => onDuplicateProject(project.id)} className="btn btn-sm btn-icon btn-outline-secondary" title="Duplicate circuit">
                  <Copy size={13} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProjectToDelete(project);
                  }}
                  className="btn btn-sm btn-icon btn-outline-danger"
                  title="Delete circuit"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {getProjectPreview(project, 'circuit')}

            <div className="flex flex-wrap items-center gap-1.5 mt-3 mb-3">
              {stats.totalNodes === 0 ? (
                <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500 bg-slate-950 border-slate-800' : 'text-slate-500 bg-slate-100 border-slate-200'} px-2 py-0.5 rounded border`}>Empty circuit</span>
              ) : (
                <>
                  {stats.gateCount > 0 && (
                    <span className="text-[10px] font-mono text-sky-500 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/30">
                      {stats.gateCount} {stats.gateCount === 1 ? 'gate' : 'gates'}
                    </span>
                  )}
                  {stats.inputCount > 0 && (
                    <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      {stats.inputCount} in
                    </span>
                  )}
                  {stats.outputCount > 0 && (
                    <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                      {stats.outputCount} out
                    </span>
                  )}
                  <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400 bg-slate-950 border-slate-800' : 'text-slate-600 bg-slate-100 border-slate-200'} px-1.5 py-0.5 rounded border`}>
                    {stats.wireCount} {stats.wireCount === 1 ? 'wire' : 'wires'}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className={`pt-3 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'} flex items-center justify-between text-xs`}>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
              <Clock size={11} />
              <span>{formatTimeAgo(project.updatedAt)}</span>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); onOpenProject(project.id); }} className={`flex items-center gap-1 text-xs font-semibold ${accent.button}`}>
              <span>Open</span><ArrowRight size={13} />
            </button>
          </div>
        </div>
      );
    }

    if (variant === 'electric') {
      const stats = getElectricStats(project);

      return (
        <div
          key={project.id}
          onClick={(e) => {
            e.stopPropagation();
            toggleSelectedProject(project.id);
          }}
          onContextMenu={(e) => handleProjectContextMenu(project, e)}
          className={`group flex flex-col justify-between p-4 rounded-xl border ${selectedProjectId === project.id ? accent.ring : `${isDark ? 'border-slate-800' : 'border-slate-200'} hover:${accent.hover}`} ${accent.panel} cursor-pointer transition-all duration-150 relative`}
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              {isEditing ? (
                <form onSubmit={(e) => handleSaveRename(project.id, e)} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 flex-1">
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus className={`flex-1 ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900 border-slate-300'} border rounded px-2 py-0.5 text-xs focus:outline-none ${accent.input}`} />
                  <button type="submit" className={`p-1 rounded text-white ${accent.save}`} title="Save">
                    <Check size={12} />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-1.5 truncate group/title">
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} truncate font-mono`}>{project.name}</h4>
                  <button type="button" onClick={(e) => handleStartRename(project, e)} className={`opacity-0 group-hover/title:opacity-100 p-1 text-slate-400 transition-opacity hover:${accent.icon}`} title="Rename electric circuit">
                    <Edit2 size={11} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => onDuplicateProject(project.id)} className="btn btn-sm btn-icon btn-outline-secondary" title="Duplicate electric circuit">
                  <Copy size={13} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProjectToDelete(project);
                  }}
                  className="btn btn-sm btn-icon btn-outline-danger"
                  title="Delete electric circuit"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {getProjectPreview(project, 'electric')}

            <div className="flex flex-wrap items-center gap-1.5 mt-3 mb-3">
              {stats.totalNodes === 0 ? (
                <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500 bg-slate-950 border-slate-800' : 'text-slate-500 bg-slate-100 border-slate-200'} px-2 py-0.5 rounded border`}>Empty circuit</span>
              ) : (
                <>
                  {stats.passiveCount > 0 && (
                    <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      {stats.passiveCount} {stats.passiveCount === 1 ? 'passive' : 'passives'}
                    </span>
                  )}
                  {stats.sourceCount > 0 && (
                    <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                      {stats.sourceCount} src
                    </span>
                  )}
                  {stats.meterCount > 0 && (
                    <span className="text-[10px] font-mono text-sky-500 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/30">
                      {stats.meterCount} meter
                    </span>
                  )}
                  <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400 bg-slate-950 border-slate-800' : 'text-slate-600 bg-slate-100 border-slate-200'} px-1.5 py-0.5 rounded border`}>
                    {stats.wireCount} {stats.wireCount === 1 ? 'wire' : 'wires'}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className={`pt-3 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'} flex items-center justify-between text-xs`}>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
              <Clock size={11} />
              <span>{formatTimeAgo(project.updatedAt)}</span>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); onOpenProject(project.id); }} className={`flex items-center gap-1 text-xs font-semibold ${accent.button}`}>
              <span>Open</span><ArrowRight size={13} />
            </button>
          </div>
        </div>
      );
    }

    const stats = getFlowchartStats(project);

    return (
      <div
        key={project.id}
        onClick={(e) => {
          e.stopPropagation();
          toggleSelectedProject(project.id);
        }}
        onContextMenu={(e) => handleProjectContextMenu(project, e)}
        className={`group flex flex-col justify-between p-4 rounded-xl border ${selectedProjectId === project.id ? accent.ring : `${isDark ? 'border-slate-800' : 'border-slate-200'} hover:${accent.hover}`} ${accent.panel} cursor-pointer transition-all duration-150 relative`}
      >
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            {isEditing ? (
              <form onSubmit={(e) => handleSaveRename(project.id, e)} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 flex-1">
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus className={`flex-1 ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900 border-slate-300'} border rounded px-2 py-0.5 text-xs focus:outline-none ${accent.input}`} />
                <button type="submit" className={`p-1 rounded text-white ${accent.save}`} title="Save">
                  <Check size={12} />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1.5 truncate group/title">
                <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} truncate font-mono`}>{project.name}</h4>
                <button type="button" onClick={(e) => handleStartRename(project, e)} className={`opacity-0 group-hover/title:opacity-100 p-1 text-slate-400 transition-opacity hover:${accent.icon}`} title="Rename flowchart">
                  <Edit2 size={11} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => onDuplicateProject(project.id)} className="btn btn-sm btn-icon btn-outline-secondary" title="Duplicate flowchart">
                <Copy size={13} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setProjectToDelete(project);
                }}
                className="btn btn-sm btn-icon btn-outline-danger"
                title="Delete flowchart"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {getProjectPreview(project, 'flowchart')}

          <div className="flex flex-wrap items-center gap-1.5 mt-3 mb-3">
            {stats.totalBlocks === 0 ? (
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500 bg-slate-950 border-slate-800' : 'text-slate-500 bg-slate-100 border-slate-200'} px-2 py-0.5 rounded border`}>Empty algorithm</span>
            ) : (
              <>
                {stats.blockCount > 0 && (
                  <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                    {stats.blockCount} {stats.blockCount === 1 ? 'step' : 'steps'}
                  </span>
                )}
                {stats.decisionCount > 0 && (
                  <span className="text-[10px] font-mono text-purple-500 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/30">
                    {stats.decisionCount} {stats.decisionCount === 1 ? 'branch' : 'branches'}
                  </span>
                )}
                {stats.ioCount > 0 && (
                  <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    {stats.ioCount} IO
                  </span>
                )}
                <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400 bg-slate-950 border-slate-800' : 'text-slate-600 bg-slate-100 border-slate-200'} px-1.5 py-0.5 rounded border`}>
                  {stats.flowPaths} {stats.flowPaths === 1 ? 'path' : 'paths'}
                </span>
              </>
            )}
          </div>
        </div>

        <div className={`pt-3 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'} flex items-center justify-between text-xs`}>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
            <Clock size={11} />
            <span>{formatTimeAgo(project.updatedAt)}</span>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); onOpenProject(project.id); }} className={`flex items-center gap-1 text-xs font-semibold ${accent.button}`}>
            <span>Open</span><ArrowRight size={13} />
          </button>
        </div>
      </div>
    );
  };

  const renderSettingsPanel = () => (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Settings Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} pb-4`}>
        <div>
          <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>Workspace</span>
            <ChevronRight size={12} />
            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Settings</span>
          </div>
          <h2 className={`mt-1 text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Studio Settings & Simulation Engine
          </h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            Manage workspace appearance, Boolean logic solver, SPICE MNA parameters, visual wire routing, and complete data backups.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveNav('projects')}
          className="btn btn-outline-secondary btn-sm flex items-center gap-1.5"
        >
          <LayoutDashboard size={14} />
          <span>Back to Projects</span>
        </button>
      </div>

      {/* 1. Appearance & Theme */}
      <section className={`rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xs'} p-6 space-y-4`}>
        <div className="flex items-center gap-2">
          <Sun size={18} className="text-amber-400" />
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Workspace Theme & Canvas Appearance
          </h3>
        </div>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Select an aesthetic optimized for extended circuit schematics modeling or presentation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Dark Mode Card */}
          <div
            onClick={() => onThemeChange?.('dark')}
            className={`cursor-pointer rounded-xl border p-4 transition-all duration-150 flex items-center justify-between ${
              isDark
                ? 'border-sky-500 bg-sky-950/20 ring-1 ring-sky-500/50 shadow-md'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-sky-400">
                <Moon size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Dark Studio</span>
                  {isDark && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/40">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Slate-950 deep canvas with glowing wire signal traces
                </div>
              </div>
            </div>
            {isDark && <CheckCircle2 size={20} className="text-sky-500 shrink-0" />}
          </div>

          {/* Light Mode Card */}
          <div
            onClick={() => onThemeChange?.('light')}
            className={`cursor-pointer rounded-xl border p-4 transition-all duration-150 flex items-center justify-between ${
              !isDark
                ? 'border-sky-500 bg-sky-50/50 ring-1 ring-sky-500/50 shadow-md'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-amber-500">
                <Sun size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Light Blueprint</span>
                  {!isDark && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-600 border border-sky-500/40">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Clean engineering grid with high contrast components
                </div>
              </div>
            </div>
            {!isDark && <CheckCircle2 size={20} className="text-sky-500 shrink-0" />}
          </div>
        </div>
      </section>

      {/* 2. Simulation & Engine Controls */}
      <section className={`rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xs'} p-6 space-y-5`}>
        <div className="flex items-center gap-2">
          <Cpu size={18} className="text-sky-400" />
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Simulation Engine & Clock Timing
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Clock Frequency */}
          <div className="space-y-2">
            <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Default Clock Pulse Frequency
            </label>
            <div className="flex flex-wrap gap-2">
              {[0.5, 1, 2, 4, 10].map((hz) => (
                <button
                  key={hz}
                  type="button"
                  onClick={() => onUpdateSettings?.({ clockHz: hz })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                    (settings?.clockHz ?? 1) === hz
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {hz} Hz
                </button>
              ))}
            </div>
            <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Sets the oscillation cycle period for all generator clock components.
            </p>
          </div>

          {/* Simulation Tick Speed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Engine Step Tick Interval
              </label>
              <span className="text-xs font-mono text-sky-400 font-bold">
                {settings?.speedMs ?? 100} ms
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="500"
              step="10"
              value={settings?.speedMs ?? 100}
              onChange={(e) => onUpdateSettings?.({ speedMs: Number(e.target.value) })}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Fast (20ms)</span>
              <span>Smooth (100ms)</span>
              <span>Slow Step (500ms)</span>
            </div>
          </div>
        </div>

        <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} grid grid-cols-1 sm:grid-cols-2 gap-4`}>
          {/* Sound Toggle + Test Audio Chime */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center gap-2.5">
              {settings?.soundEnabled !== false ? (
                <Volume2 size={16} className="text-emerald-400" />
              ) : (
                <VolumeX size={16} className="text-slate-500" />
              )}
              <div>
                <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Audio Sound FX & Buzzers
                </div>
                <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Plays click feedback and circuit buzzer alerts
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium transition-colors"
                title="Test audio chime"
              >
                Test Chime
              </button>
              <input
                type="checkbox"
                checked={settings?.soundEnabled !== false}
                onChange={(e) => onUpdateSettings?.({ soundEnabled: e.target.checked })}
                className="toggle-checkbox accent-emerald-500 h-4 w-4 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* SPICE Engine Info */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-950/20">
            <Zap size={16} className="text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-emerald-400 font-mono">
                SPICE Modified Nodal Analysis (MNA)
              </div>
              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Matrix nodal solver with Gauss-Jordan elimination for Ohm's and Kirchhoff's Laws.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Schematic, Wire & Canvas Styling */}
      <section className={`rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xs'} p-6 space-y-4`}>
        <div className="flex items-center gap-2">
          <Sliders size={18} className="text-purple-400" />
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Schematic Display & Wire Routing
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Wire Routing Style */}
          <div className="space-y-2">
            <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Wire Routing Geometry
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings?.({ wireStyle: 'curved' })}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-colors ${
                  (settings?.wireStyle ?? 'curved') === 'curved'
                    ? 'border-sky-500 bg-sky-500/20 text-sky-400'
                    : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                }`}
              >
                Curved Bezier
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings?.({ wireStyle: 'orthogonal' })}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-colors ${
                  settings?.wireStyle === 'orthogonal'
                    ? 'border-sky-500 bg-sky-500/20 text-sky-400'
                    : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                }`}
              >
                Orthogonal (90°)
              </button>
            </div>
          </div>

          {/* Live Wire Expressions */}
          <div className="space-y-2">
            <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Live Wire Logic Expressions
            </label>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={settings?.showWireExpressions || false}
                onChange={(e) => onUpdateSettings?.({ showWireExpressions: e.target.checked })}
                className="accent-sky-500 h-4 w-4 rounded cursor-pointer"
              />
              <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Display Boolean equations
              </span>
            </label>
            <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Renders algebraic equations above active connections.
            </p>
          </div>

          {/* Component Variables */}
          <div className="space-y-2">
            <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Component Variable Names
            </label>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={settings?.showComponentVariables !== false}
                onChange={(e) => onUpdateSettings?.({ showComponentVariables: e.target.checked })}
                className="accent-sky-500 h-4 w-4 rounded cursor-pointer"
              />
              <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Show variable labels
              </span>
            </label>
            <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Displays assigned variable letters (A, B, Cin, Q) above pins.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Workspace Data Management & Backups */}
      <section className={`rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xs'} p-6 space-y-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive size={18} className="text-emerald-400" />
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Storage Analytics & Workspace Backups
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            LocalStorage Active
          </span>
        </div>

        {/* Analytics Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`p-3 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
            <div className="text-[10px] uppercase font-mono text-slate-500">Total Projects</div>
            <div className="text-xl font-bold font-mono text-sky-400">{projects.length}</div>
          </div>
          <div className={`p-3 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
            <div className="text-[10px] uppercase font-mono text-slate-500">Electric Nets</div>
            <div className="text-xl font-bold font-mono text-emerald-400">{workspaceMetrics.electricCount}</div>
          </div>
          <div className={`p-3 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
            <div className="text-[10px] uppercase font-mono text-slate-500">Total Components</div>
            <div className="text-xl font-bold font-mono text-purple-400">{workspaceMetrics.totalNodes}</div>
          </div>
          <div className={`p-3 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
            <div className="text-[10px] uppercase font-mono text-slate-500">Folders</div>
            <div className="text-xl font-bold font-mono text-amber-400">{folders.length}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportAllWorkspace}
            className="btn btn-primary btn-sm flex items-center gap-2"
          >
            <Download size={14} />
            <span>Export Complete Workspace Backup (.lgkx)</span>
          </button>

          <label className="btn btn-outline-secondary btn-sm flex items-center gap-2 cursor-pointer">
            <Upload size={14} />
            <span>Restore / Import File (.lgkx)</span>
            <input
              type="file"
              accept=".lgkx,.lgf,.json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>

          {onResetWorkspace && (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="btn btn-outline-danger btn-sm ml-auto flex items-center gap-1.5"
            >
              <ShieldAlert size={14} />
              <span>Clear Workspace & Reset Defaults</span>
            </button>
          )}
        </div>
      </section>

      {/* 5. Complete Keyboard Shortcuts Reference */}
      <section className={`rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xs'} p-6 space-y-4`}>
        <div className="flex items-center gap-2">
          <Key size={18} className="text-amber-400" />
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Keyboard Shortcuts & Gestures
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {[
            { key: 'Right Click', action: 'Context Menu (Any Component / Canvas)' },
            { key: 'Space', action: 'Play / Pause Simulation' },
            { key: 'Shift + S', action: 'Single-Step Simulation Tick' },
            { key: 'Ctrl + Z / Y', action: 'Undo / Redo Circuit Edits' },
            { key: 'Ctrl + C / V', action: 'Copy & Paste Components' },
            { key: 'Ctrl + D', action: 'Duplicate Selected Items' },
            { key: 'Del / Backspace', action: 'Delete Selected Items' },
            { key: 'G', action: 'Toggle Visual Grid' },
            { key: 'S', action: 'Toggle Grid Snap' },
          ].map(({ key, action }) => (
            <div
              key={key}
              className={`p-2.5 rounded-xl border ${isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200 bg-slate-50'} flex items-center justify-between text-xs`}
            >
              <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{action}</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-400 font-mono text-[10px] font-semibold">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <div
      className={`home-dashboard-${theme} h-dvh min-h-full overflow-hidden overscroll-contain ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} flex flex-row selection:bg-sky-500 selection:text-white`}
      style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
      onContextMenu={handleDashboardContextMenu}
    >
      {/* Toggleable Sidebar */}
      {isSidebarVisible && (
        <aside className={`hidden md:flex w-64 shrink-0 flex-col border-r ${isDark ? 'border-slate-800 bg-slate-950/95' : 'border-slate-200 bg-white shadow-xs'} px-3 py-4`}>
          <div className="flex items-center gap-2 px-2 pb-5">
            <img
              src="/logo.png"
              alt="LogixFlow Logo"
              className={`h-9 w-9 object-contain rounded-lg ring-1 ${isDark ? 'ring-slate-700/60' : 'ring-slate-200'} shadow-sm`}
            />
            <div className="min-w-0">
              <div className={`truncate text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} font-mono`}>
                LOGIXFLOW
              </div>
              <div className={`text-[10px] uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Design workspace</div>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarVisible(false)}
              className={`ml-auto p-1.5 rounded-md ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'} transition-colors`}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <Menu size={15} />
            </button>
          </div>

        <nav className={`space-y-1 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} pb-4`} aria-label="Workspace navigation">
          <button type="button" onClick={() => setActiveNav('projects')} className={`w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-semibold transition-colors ${activeNav === 'projects' ? (isDark ? 'bg-sky-500/15 text-sky-300' : 'bg-sky-50 text-sky-700 font-semibold') : (isDark ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}`}>
            <LayoutDashboard size={15} /> Projects
            <ChevronRight size={13} className="ml-auto opacity-60" />
          </button>
          <button type="button" onClick={() => setActiveNav('settings')} className={`w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-semibold transition-colors ${activeNav === 'settings' ? (isDark ? 'bg-sky-500/15 text-sky-300' : 'bg-sky-50 text-sky-700 font-semibold') : (isDark ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}`}>
            <Settings2 size={15} /> Settings
            <ChevronRight size={13} className="ml-auto opacity-60" />
          </button>
        </nav>

        <div className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} py-4`}>
          <div className={`mb-2 flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>Project folders</span>
            <button type="button" onClick={() => setFolderModalState({ mode: 'create', name: '' })} className="text-sky-500 hover:text-sky-400" title="Create project folder" aria-label="Create project folder"><FolderPlus size={14} /></button>
          </div>
          <div className="space-y-0.5">
            <button type="button" onClick={() => setSelectedFolderId(null)} className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ${selectedFolderId === null ? (isDark ? 'bg-sky-500/15 text-sky-300' : 'bg-sky-50 text-sky-700 font-semibold') : (isDark ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}`}>
              <FolderKanban size={14} className="text-sky-500" /><span className="min-w-0 flex-1 truncate">All Projects</span><span className={`font-mono text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{projects.length}</span>
            </button>
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="group flex items-center gap-1"
                onContextMenu={(e) => handleFolderContextMenu(folder, e)}
              >
                <button type="button" onClick={() => setSelectedFolderId(folder.id)} className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ${selectedFolderId === folder.id ? (isDark ? 'bg-sky-500/15 text-sky-300' : 'bg-sky-50 text-sky-700 font-semibold') : (isDark ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}`}>
                  <FolderOpen size={14} className="text-amber-500" /><span className="min-w-0 flex-1 truncate">{folder.name}</span><span className={`font-mono text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{projects.filter((project) => project.folderId === folder.id).length}</span>
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); setFolderModalState({ mode: 'rename', folderId: folder.id, name: folder.name }); }} className="hidden p-1 text-slate-400 hover:text-sky-500 group-hover:block" title="Rename folder" aria-label={`Rename ${folder.name}`}><Edit2 size={11} /></button>
                <button type="button" onClick={(e) => { e.stopPropagation(); setFolderToDelete(folder); }} className="hidden p-1 text-slate-400 hover:text-rose-500 group-hover:block" title="Delete folder" aria-label={`Delete ${folder.name}`}><Trash2 size={11} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 pt-4">
          <div className={`mb-2 flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>Projects</span><span>{projects.length}</span>
          </div>
          <label className={`mb-2 flex items-center gap-2 rounded-md border ${isDark ? 'border-slate-800 bg-slate-900/80 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'} px-2 py-1.5`}>
            <Search size={13} />
            <input value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)} placeholder="Filter projects" className={`min-w-0 flex-1 bg-transparent text-xs ${isDark ? 'text-slate-200 placeholder:text-slate-600' : 'text-slate-800 placeholder:text-slate-400'} outline-none`} />
          </label>
          <div className="max-h-64 space-y-0.5 overflow-y-auto">
            {recentProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => onOpenProject(project.id)}
                onContextMenu={(e) => handleProjectContextMenu(project, e)}
                className={`group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs ${isDark ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-100' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <FolderKanban size={14} className={isProjectElectric(project) ? 'text-emerald-500' : isProjectFlowchart(project) ? 'text-amber-500' : 'text-sky-500'} />
                <span className="min-w-0 flex-1 truncate">{project.name}</span>
                <ChevronRight size={12} className="opacity-0 group-hover:opacity-70" />
              </button>
            ))}
            {recentProjects.length === 0 && <div className={`px-2 py-3 text-[11px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>No matching projects</div>}
          </div>
        </div>

        {activeNav === 'settings' && (
          <div className={`mt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} pt-4`}>
            <div className={`mb-2 px-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Appearance</div>
            <button type="button" onClick={() => onThemeChange?.(theme === 'dark' ? 'light' : 'dark')} className={`flex w-full items-center gap-2 rounded-md border ${isDark ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-sky-700' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-400'} px-2.5 py-2 text-xs`}>
              {theme === 'dark' ? <Moon size={14} className="text-sky-400" /> : <Sun size={14} className="text-amber-500" />}
              <span>{theme === 'dark' ? 'Dark workspace' : 'Light workspace'}</span>
              <span className={`ml-auto text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Toggle</span>
            </button>
            <div className={`mt-2 px-2 text-[10px] leading-relaxed ${isDark ? 'text-slate-600' : 'text-slate-500'}`}>Theme, simulation, and canvas controls remain available inside the editor workspace.</div>
          </div>
        )}
      </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* Top Banner & Navigation */}
      <header className={`border-b ${isDark ? 'border-slate-800 bg-slate-900/95' : 'border-slate-200 bg-white/95'} backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 shadow-xs`}>
        <div className="flex items-center gap-3 min-w-0">
          {!isSidebarVisible && (
            <button
              type="button"
              onClick={() => setIsSidebarVisible(true)}
              className="btn btn-outline-secondary btn-sm hidden md:flex items-center gap-1.5"
              title="Expand workspace sidebar"
              aria-label="Expand workspace sidebar"
            >
              <Menu size={14} className="text-sky-500" />
            </button>
          )}

          <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-slate-900 border-slate-700/80 ring-white/10' : 'bg-slate-100 border-slate-200 ring-slate-900/5'} border flex items-center justify-center shadow-md overflow-hidden p-1 ring-1`}>
            <img src="/logo.png" alt="LogixFlow Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} font-mono`}>
                LOGIXFLOW <span className="text-sky-500">STUDIO</span>
              </h1>
            </div>
            <p className={`hidden sm:block text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Digital Logic & Electric Circuit Design EDA Lab</p>
          </div>
        </div>

        <label className={`order-3 flex min-w-0 flex-1 items-center gap-2 rounded-md border ${isDark ? 'border-slate-700 bg-slate-950/70 text-slate-400' : 'border-slate-300 bg-slate-50 text-slate-500'} px-3 py-2 sm:order-0 sm:max-w-xl`}>
          <Search size={15} />
          <input
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            placeholder="Search projects, circuits, and flowcharts"
            className={`min-w-0 flex-1 bg-transparent text-xs ${isDark ? 'text-slate-200 placeholder:text-slate-600' : 'text-slate-800 placeholder:text-slate-400'} outline-none`}
          />
          <kbd className={`hidden rounded border ${isDark ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-400'} px-1.5 py-0.5 text-[10px] lg:inline`}>/</kbd>
        </label>

        <div className="flex items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto">
          <a
            href="https://github.com/ktesla39/LogixFlow"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-secondary btn-sm min-h-10 flex items-center justify-center gap-1.5"
            title="View on GitHub"
          >
            <Github size={14} />
            <span className="hidden sm:inline">GitHub</span>
          </a>

          <label className="btn btn-outline-secondary btn-sm min-h-10 flex items-center justify-center gap-1.5 cursor-pointer" title="Import workspace or circuit (.lgkx, .lgf, .json)">
            <Upload size={14} />
            <span>Import (.lgkx)</span>
            <input type="file" accept=".lgkx,.lgf,.json" onChange={handleFileImport} className="hidden" />
          </label>

          <div
            className="relative"
            onMouseEnter={() => setIsNewProjectMenuOpen(true)}
            onMouseLeave={() => setIsNewProjectMenuOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsNewProjectMenuOpen((open) => !open)}
              aria-expanded={isNewProjectMenuOpen}
              aria-haspopup="menu"
              className="btn btn-primary btn-sm min-h-10 font-semibold shadow-md flex items-center justify-center gap-1.5"
              title="Create a new project"
            >
              <Plus size={15} />
              <span>+ New</span>
              <ChevronDown size={13} className={`transition-transform ${isNewProjectMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isNewProjectMenuOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-60 overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950/95 shadow-2xl backdrop-blur-sm" role="menu" aria-label="New project menu">
                {newProjectOptions.map(({ key, label, description, icon: Icon, accent, create }) => (
                  <button
                    key={key}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      create();
                      setIsNewProjectMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 border-b border-slate-800/80 px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-slate-800/80"
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${accent}`}>
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white">{label}</div>
                      <div className="text-[11px] text-slate-400">{description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
      {/* Main Home Content */}
      <main
        className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8"
        onContextMenu={handleDashboardContextMenu}
      >
        {activeNav === 'settings' ? (
          renderSettingsPanel()
        ) : (
          <>
            <div className={`flex flex-wrap items-center justify-between gap-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} pb-3`}>
              <div>
                <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span>Workspace</span><ChevronRight size={12} /><span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Projects</span>
                </div>
                <h2 className={`mt-1 text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Project browser</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="btn-group" role="group" aria-label="Project layout">
                  <button type="button" onClick={() => setProjectLayout('list')} className={`btn btn-sm btn-icon ${projectLayout === 'list' ? 'btn-secondary' : 'btn-outline-secondary'}`} title="List view" aria-label="List view"><List size={14} /></button>
                  <button type="button" onClick={() => setProjectLayout('grid')} className={`btn btn-sm btn-icon ${projectLayout === 'grid' ? 'btn-secondary' : 'btn-outline-secondary'}`} title="Grid view" aria-label="Grid view"><Grid2X2 size={14} /></button>
                </div>
                <button type="button" onClick={() => setSortNewestFirst((current) => !current)} className="btn btn-outline-secondary btn-sm flex items-center gap-1.5" title="Toggle project sort order">
                  <ArrowUpDown size={13} /><span className="hidden sm:inline">{sortNewestFirst ? 'Recently updated' : 'Oldest updated'}</span>
                </button>
              </div>
            </div>
            

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Projects', value: workspaceMetrics.totalProjects, accent: 'sky', helper: 'Total workspaces' },
                { label: 'Logic Circuits', value: workspaceMetrics.circuits, accent: 'sky', helper: 'Digital logic sheets' },
                { label: 'Electric Circuits', value: workspaceMetrics.electricCount, accent: 'emerald', helper: 'Analog & power nets' },
                { label: 'Flowcharts', value: workspaceMetrics.flowcharts, accent: 'amber', helper: 'Algorithm maps' },
              ].map((metric) => (
                <div key={metric.label} className={`rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white shadow-xs'} p-4`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-[10px] uppercase tracking-[0.25em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{metric.label}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${metric.accent === 'sky' ? 'bg-sky-500' : metric.accent === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-2">
                    <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} font-mono`}>{metric.value}</span>
                    <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{metric.helper}</span>
                  </div>
                </div>
              ))}
            </section>

            

        {/* Optional Starter Templates / Presets (Collapsible) */}
        {showPresets && (
          <section className="space-y-3">
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} pb-2`}>
              <div className="btn-group" role="group" aria-label="Preset categories">
                <button
                  type="button"
                  onClick={() => setPresetCategory('circuits')}
                  className={`btn btn-sm ${
                    presetCategory === 'circuits'
                      ? 'btn-primary'
                      : 'btn-outline-secondary'
                  }`}
                >
                  Digital Logic (6)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetCategory('electric')}
                  className={`btn btn-sm ${
                    presetCategory === 'electric'
                      ? 'btn-success'
                      : 'btn-outline-secondary'
                  }`}
                >
                  <Zap size={13} className="mr-1 inline" />
                  Electric Circuits (5)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetCategory('flowcharts')}
                  className={`btn btn-sm ${
                    presetCategory === 'flowcharts'
                      ? 'btn-warning'
                      : 'btn-outline-secondary'
                  }`}
                >
                  Flowcharts & Algorithms (4)
                </button>
              </div>
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Click any card to launch interactive workspace</span>
            </div>

            {presetCategory === 'electric' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div
                  onClick={() => onLoadElectricPresetAsProject?.('electric_sheet_divider')}
                  className={`group p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900' : 'border-slate-200 bg-white hover:bg-slate-50 shadow-xs'} hover:border-emerald-500/50 cursor-pointer transition-all hover:-translate-y-0.5`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      Passive Divider
                    </span>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>Voltage Divider & Potentiometer</h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Precision resistor attenuation dividing 9V DC into regulated voltages with voltmeter, ammeter, and ground reference.
                  </p>
                </div>

                <div
                  onClick={() => onLoadElectricPresetAsProject?.('electric_sheet_rc_filter')}
                  className={`group p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900' : 'border-slate-200 bg-white hover:bg-slate-50 shadow-xs'} hover:border-emerald-500/50 cursor-pointer transition-all hover:-translate-y-0.5`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      Filter & Transient
                    </span>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>RC Low-Pass Filter & Integrator</h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    AC generator coupled to an RC network demonstrating cutoff frequency attenuation, phase shift, and smoothing.
                  </p>
                </div>

                <div
                  onClick={() => onLoadElectricPresetAsProject?.('electric_sheet_rectifier')}
                  className={`group p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900' : 'border-slate-200 bg-white hover:bg-slate-50 shadow-xs'} hover:border-emerald-500/50 cursor-pointer transition-all hover:-translate-y-0.5`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      Power & Rectification
                    </span>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>Diode Half-Wave Rectifier & Filter</h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Silicon PN junction diode converting alternating AC signal into unidirectional DC pulses with capacitor ripple reservoir.
                  </p>
                </div>

                <div
                  onClick={() => onLoadElectricPresetAsProject?.('electric_sheet_bjt')}
                  className={`group p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900' : 'border-slate-200 bg-white hover:bg-slate-50 shadow-xs'} hover:border-emerald-500/50 cursor-pointer transition-all hover:-translate-y-0.5`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      Active Transistor
                    </span>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>BJT NPN Common-Emitter Amplifier</h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Bipolar junction transistor with base bias resistor and collector load driving high-gain inverted voltage amplification.
                  </p>
                </div>

                <div
                  onClick={() => onLoadElectricPresetAsProject?.('electric_sheet_555')}
                  className={`group p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900' : 'border-slate-200 bg-white hover:bg-slate-50 shadow-xs'} hover:border-emerald-500/50 cursor-pointer transition-all hover:-translate-y-0.5`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      Oscillator
                    </span>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>555 Relaxation Multivibrator</h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Feedback multivibrator cycling RC charge-discharge thresholds to generate continuous clock square waves.
                  </p>
                </div>
              </div>
            ) : presetCategory === 'flowcharts' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div
                  onClick={() => onLoadFlowchartPresetAsProject?.('flowchart_sheet_sum')}
                  className={`group p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900' : 'border-slate-200 bg-white hover:bg-slate-50 shadow-xs'} hover:border-amber-500/50 cursor-pointer transition-all hover:-translate-y-0.5`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      Loop & Accumulator
                    </span>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>Sum of 1 to N</h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Iterative accumulator loop with index increment, condition checking, and final output display.
                  </p>
                </div>

                <div
                  onClick={() => onLoadFlowchartPresetAsProject?.('flowchart_sheet_even_odd')}
                  className={`group p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900' : 'border-slate-200 bg-white hover:bg-slate-50 shadow-xs'} hover:border-emerald-500/50 cursor-pointer transition-all hover:-translate-y-0.5`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      Branching (IF/ELSE)
                    </span>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>Check Odd or Even</h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Decision diamond branching on N % 2 == 0 condition into YES and NO output pathways.
                  </p>
                </div>

                <div
                  onClick={() => onLoadFlowchartPresetAsProject?.('flowchart_sheet_factorial')}
                  className={`group p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900' : 'border-slate-200 bg-white hover:bg-slate-50 shadow-xs'} hover:border-purple-500/50 cursor-pointer transition-all hover:-translate-y-0.5`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                      Factorial
                    </span>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-purple-500 transition-colors" />
                  </div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>Calculate Factorial N!</h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Multiplication loop multiplying fact = fact * i until i &gt; n, printing the mathematical factorial.
                  </p>
                </div>

                <div
                  onClick={() => onLoadFlowchartPresetAsProject?.('flowchart_sheet_max')}
                  className={`group p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900' : 'border-slate-200 bg-white hover:bg-slate-50 shadow-xs'} hover:border-cyan-500/50 cursor-pointer transition-all hover:-translate-y-0.5`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-800/50">
                      Comparison
                    </span>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-cyan-500 transition-colors" />
                  </div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>Find Maximum (A or B)</h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Dual variable initialization comparing A &gt; B to select and output the highest numerical value.
                  </p>
                </div>
              </div>
            ) : (

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div
                onClick={() => onLoadPresetAsProject('all_gates')}
                className={`group p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900' : 'border-slate-200 bg-white hover:bg-slate-50 shadow-xs'} hover:border-sky-500/50 cursor-pointer transition-all hover:-translate-y-0.5`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
                    Showcase
                  </span>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-sky-500 transition-colors" />
                </div>
                <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>All Logic Gates Interactive</h4>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Interactive reference featuring AND, OR, NOT, NAND, NOR, XOR, XNOR and Buffer with live switches and probes.
                </p>
              </div>

              <div
                onClick={() => onLoadPresetAsProject('half_adder')}
                className={`group p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900' : 'border-slate-200 bg-white hover:bg-slate-50 shadow-xs'} hover:border-emerald-500/50 cursor-pointer transition-all hover:-translate-y-0.5`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Arithmetic
                  </span>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>Half Adder Circuit</h4>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Binary addition using XOR gate for Sum (A ⊕ B) and AND gate for Carry Out (A · B).
                </p>
              </div>

              <div
                onClick={() => onLoadPresetAsProject('sr_latch')}
                className={`group p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900' : 'border-slate-200 bg-white hover:bg-slate-50 shadow-xs'} hover:border-amber-500/50 cursor-pointer transition-all hover:-translate-y-0.5`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    Sequential
                  </span>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                </div>
                <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>SR Latch (Cross-Coupled NOR)</h4>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Bistable 1-bit memory element demonstrating Set, Reset, Memory retention, and feedback loops.
                </p>
              </div>

              <div
                onClick={() => onLoadPresetAsProject('d_flipflop')}
                className={`group p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900' : 'border-slate-200 bg-white hover:bg-slate-50 shadow-xs'} hover:border-purple-500/50 cursor-pointer transition-all hover:-translate-y-0.5`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                    Flip-Flop
                  </span>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-purple-500 transition-colors" />
                </div>
                <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>D Flip-Flop Register</h4>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Edge-triggered clock storage capturing Data pin state on clock pulse transitions into Q and ~Q.
                </p>
              </div>

              <div
                onClick={() => onLoadPresetAsProject('mux_routing')}
                className={`group p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900' : 'border-slate-200 bg-white hover:bg-slate-50 shadow-xs'} hover:border-cyan-500/50 cursor-pointer transition-all hover:-translate-y-0.5`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-800/50">
                    Routing
                  </span>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-cyan-500 transition-colors" />
                </div>
                <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>2:1 Multiplexer Router</h4>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Data selector channeling either Input 0 or Input 1 directly to output Y based on Select control line.
                </p>
              </div>

              <div
                onClick={() => onLoadPresetAsProject('clock_7seg')}
                className={`group p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900' : 'border-slate-200 bg-white hover:bg-slate-50 shadow-xs'} hover:border-rose-500/50 cursor-pointer transition-all hover:-translate-y-0.5`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-800/50">
                    Display & Audio
                  </span>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
                </div>
                <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>Clock & 7-Segment Display</h4>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Pulse oscillator driving buzzer sound together with 4-bit hexadecimal 7-segment numeric decoder.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

        {/* User Saved Projects Divided into Circuits and Flowcharts */}
        <section className="space-y-6">
          {/* Category Switcher & Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="btn-group" role="group" aria-label="Project tabs">
              <button
                type="button"
                onClick={() => setProjectTab('all')}
                className={`btn btn-sm ${
                  projectTab === 'all'
                    ? 'btn-secondary'
                    : 'btn-outline-secondary'
                }`}
              >
                All Projects ({projects.length})
              </button>
              <button
                type="button"
                onClick={() => setProjectTab('circuits')}
                className={`btn btn-sm ${
                  projectTab === 'circuits'
                    ? 'btn-primary'
                    : 'btn-outline-secondary'
                }`}
              >
                <Layers size={13} />
                <span>Circuits ({visibleCircuitProjects.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setProjectTab('flowcharts')}
                className={`btn btn-sm ${
                  projectTab === 'flowcharts'
                    ? 'btn-warning'
                    : 'btn-outline-secondary'
                }`}
              >
                <GitFork size={13} />
                <span>Flowcharts ({visibleFlowchartProjects.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setProjectTab('electric')}
                className={`btn btn-sm ${
                  projectTab === 'electric'
                    ? 'btn-success'
                    : 'btn-outline-secondary'
                }`}
              >
                <Zap size={13} />
                <span>Electric ({visibleElectricProjects.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onCreateBlankProject(undefined, 'logic')}
                className="btn btn-outline-primary btn-sm"
                title="Create a new digital logic circuit"
              >
                <Plus size={13} />
                <span>New Circuit</span>
              </button>
              <button
                type="button"
                onClick={() => onCreateBlankProject('Untitled Electric Circuit', 'electric')}
                className="btn btn-outline-success btn-sm"
                title="Create a new electric circuit"
              >
                <Zap size={13} />
                <span>New Electric</span>
              </button>
              <button
                type="button"
                onClick={() => onCreateBlankProject('Untitled Algorithm', 'flowchart')}
                className="btn btn-outline-warning btn-sm"
                title="Create a new flowchart algorithm"
              >
                <Plus size={13} />
                <span>New Flowchart</span>
              </button>
            </div>
          </div>

          {/* SECTION 1: DIGITAL LOGIC CIRCUITS */}
          {(projectTab === 'all' || projectTab === 'circuits') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-950 border border-sky-800/60 flex items-center justify-center text-sky-400">
                    <Layers size={14} />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Digital Logic Circuits</h3>
                  <span className="text-[11px] font-mono text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-800/60">
                    {visibleCircuitProjects.length} {visibleCircuitProjects.length === 1 ? 'circuit' : 'circuits'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onCreateBlankProject(undefined, 'logic')}
                  className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>Add Circuit</span>
                </button>
              </div>

              {visibleCircuitProjects.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center p-2">
                    <img src="/logo.png" className="w-6 h-6 object-contain opacity-50 grayscale" alt="" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200">No Circuits Saved Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Design combinational gates, inverters, memory flip-flops, adders, and timing signals.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => onCreateBlankProject(undefined, 'logic')}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
                    >
                      Create Blank Circuit
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`grid gap-3.5 ${projectLayout === 'list' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                  {visibleCircuitProjects.map((project) => renderProjectCard(project, 'circuit'))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: ELECTRIC & ANALOG CIRCUITS */}
          {(projectTab === 'all' || projectTab === 'electric') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                    <Zap size={14} />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Electric & Analog Circuits</h3>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                    {visibleElectricProjects.length} {visibleElectricProjects.length === 1 ? 'project' : 'projects'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onCreateBlankProject('Untitled Electric Circuit', 'electric')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>Add Electric Circuit</span>
                </button>
              </div>

              {visibleElectricProjects.length === 0 ? (
                <div className={`p-8 text-center rounded-2xl border border-dashed ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-slate-50'} space-y-2`}>
                  <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-slate-800/80 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} mx-auto flex items-center justify-center`}>
                    <Zap size={20} />
                  </div>
                  <h4 className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>No Electric Projects Saved Yet</h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} max-w-sm mx-auto`}>
                    Simulate real electrical schematics with DC/AC voltage sources, resistors, capacitors, inductors, diodes, and live multimeters with Modified Nodal Analysis (MNA).
                  </p>
                  <div className="pt-1 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onCreateBlankProject('Untitled Electric Circuit', 'electric')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                    >
                      Create Blank Electric Circuit
                    </button>
                    {onLoadElectricPresetAsProject && (
                      <button
                        type="button"
                        onClick={() => onLoadElectricPresetAsProject('elec_voltage_divider')}
                        className={`px-3.5 py-1.5 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'} text-xs font-semibold`}
                      >
                        Load Voltage Divider Preset
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`grid gap-3.5 ${projectLayout === 'list' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                  {visibleElectricProjects.map((project) => renderProjectCard(project, 'electric'))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: FLOWCHART ALGORITHMS */}
          {(projectTab === 'all' || projectTab === 'flowcharts') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-950 border border-amber-800/60 flex items-center justify-center text-amber-400">
                    <GitFork size={14} />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Flowchart Algorithms</h3>
                  <span className="text-[11px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800/60">
                    {visibleFlowchartProjects.length} {visibleFlowchartProjects.length === 1 ? 'flowchart' : 'flowcharts'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onCreateBlankProject('Untitled Algorithm', 'flowchart')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>Add Flowchart</span>
                </button>
              </div>

              {visibleFlowchartProjects.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400">
                    <GitFork size={20} />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200">No Flowcharts Saved Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Create algorithmic flowcharts with Start/End terminals, Action statements, Decision diamonds, and interactive execution.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => onCreateBlankProject('Untitled Algorithm', 'flowchart')}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                    >
                      Create Blank Flowchart
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`grid gap-3.5 ${projectLayout === 'list' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                  {visibleFlowchartProjects.map((project) => renderProjectCard(project, 'flowchart'))}
                </div>
              )}
            </div>
          )}
        </section>
        </>
        )}
      </main>

      {selectedProject && (
        <>
          <button type="button" aria-label="Close project inspector" onClick={closeSelectedProject} className="fixed inset-0 z-40 cursor-default bg-black/35 backdrop-blur-[1px]" />
      <aside className="fixed right-0 top-0 z-50 flex h-dvh w-80 max-w-[calc(100vw-1rem)] flex-col border-l border-slate-800 bg-slate-950 p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500"><Info size={13} /> Selected project</div>
                <h3 className="truncate text-sm font-bold text-white">{selectedProject.name}</h3>
                <p className="mt-1 text-[11px] text-slate-500">Updated {formatTimeAgo(selectedProject.updatedAt)}</p>
              </div>
              <button type="button" onClick={closeSelectedProject} className="btn btn-sm btn-icon btn-outline-secondary" title="Close project inspector" aria-label="Close project inspector"><MoreHorizontal size={14} /></button>
            </div>
            <div className="border-b border-slate-800 py-4">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Project preview</div>
              {getProjectPreview(selectedProject, isProjectFlowchart(selectedProject) ? 'flowchart' : 'circuit')}
            </div>
            <div className="grid grid-cols-2 gap-2 border-b border-slate-800 py-4">
              <div className="rounded-md border border-slate-800 bg-slate-900/70 p-2.5"><div className="text-[10px] uppercase tracking-wider text-slate-500">Type</div><div className="mt-1 text-xs font-semibold text-slate-200">{isProjectFlowchart(selectedProject) ? 'Flowchart' : 'Circuit'}</div></div>
              <div className="rounded-md border border-slate-800 bg-slate-900/70 p-2.5"><div className="text-[10px] uppercase tracking-wider text-slate-500">Sheets</div><div className="mt-1 text-xs font-semibold text-slate-200">{selectedProject.sheets.length}</div></div>
            </div>
            <label className="block border-b border-slate-800 py-4">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Project folder</span>
              <select value={selectedProject.folderId || ''} onChange={(e) => onAssignProjectFolder(selectedProject.id, e.target.value || undefined)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-sky-500">
                <option value="">Uncategorized</option>
                {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
              </select>
            </label>
            <div className="py-4">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Design summary</div>
              {isProjectFlowchart(selectedProject) ? (
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between"><span>Blocks</span><span className="font-mono text-amber-300">{getFlowchartStats(selectedProject).totalBlocks}</span></div>
                  <div className="flex justify-between"><span>Branches</span><span className="font-mono text-purple-300">{getFlowchartStats(selectedProject).decisionCount}</span></div>
                  <div className="flex justify-between"><span>Paths</span><span className="font-mono text-emerald-300">{getFlowchartStats(selectedProject).flowPaths}</span></div>
                </div>
              ) : (
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between"><span>Components</span><span className="font-mono text-sky-300">{getProjectStats(selectedProject).totalNodes}</span></div>
                  <div className="flex justify-between"><span>Gates</span><span className="font-mono text-sky-300">{getProjectStats(selectedProject).gateCount}</span></div>
                  <div className="flex justify-between"><span>Wires</span><span className="font-mono text-emerald-300">{getProjectStats(selectedProject).wireCount}</span></div>
                </div>
              )}
            </div>
            <div className="mt-auto space-y-2 border-t border-slate-800 pt-4">
              <button type="button" onClick={() => onOpenProject(selectedProject.id)} className="btn btn-primary btn-sm w-full justify-center gap-2"><ExternalLink size={14} /> Open workspace</button>
              <button type="button" onClick={() => onDuplicateProject(selectedProject.id)} className="btn btn-outline-secondary btn-sm w-full justify-center gap-2"><Copy size={13} /> Duplicate project</button>
              <button type="button" onClick={() => setProjectToDelete(selectedProject)} className="btn btn-outline-danger btn-sm w-full justify-center gap-2"><Trash2 size={13} /> Delete project</button>
            </div>
      </aside>
        </>
      )}
      </div>

      {/* Clean Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-5 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-300">LogixFlow Studio</span>
            <span>•</span>
            <span>Open Source Digital Logic Circuit Simulator</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
              MIT License
            </span>
            <a
              href="https://github.com/ktesla39/LogixFlow"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-400 hover:text-sky-400 transition-colors font-mono"
            >
              <Github size={13} />
              <span>github.com/ktesla39/LogixFlow</span>
            </a>
          </div>
        </div>
      </footer>
      </div>

      {/* Delete Project Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold">Delete Project?</h3>
                <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Are you sure you want to delete <span className="font-semibold text-rose-400 font-mono">"{projectToDelete.name}"</span>? All circuit sheets and simulation state in this project will be removed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="btn btn-outline-secondary btn-sm px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = projectToDelete.id;
                  setProjectToDelete(null);
                  if (selectedProjectId === id) setSelectedProjectId(null);
                  onDeleteProject(id);
                }}
                className="btn btn-danger btn-sm px-4 flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Delete Project</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Confirmation Modal */}
      {folderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold">Delete Folder?</h3>
                <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Delete folder <span className="font-semibold text-rose-400">"{folderToDelete.name}"</span>? Circuits inside this folder will remain safe in "All Projects".
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setFolderToDelete(null)}
                className="btn btn-outline-secondary btn-sm px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = folderToDelete.id;
                  setFolderToDelete(null);
                  if (selectedFolderId === id) setSelectedFolderId(null);
                  onDeleteFolder(id);
                }}
                className="btn btn-danger btn-sm px-4 flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Delete Folder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Rename Folder Modal */}
      {folderModalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <FolderPlus size={16} className="text-sky-400" />
                <h3 className="text-sm font-bold">
                  {folderModalState.mode === 'create' ? 'Create Project Folder' : 'Rename Folder'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFolderModalState(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={15} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const name = folderModalState.name.trim();
                if (!name) return;
                if (folderModalState.mode === 'create') {
                  onCreateFolder(name);
                } else if (folderModalState.folderId) {
                  onRenameFolder(folderModalState.folderId, name);
                }
                setFolderModalState(null);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={folderModalState.name}
                  onChange={(e) =>
                    setFolderModalState((prev) => (prev ? { ...prev, name: e.target.value } : null))
                  }
                  autoFocus
                  placeholder="e.g. Lab Assignments, Arithmetic Units..."
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-sans outline-none transition-colors ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-sky-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFolderModalState(null)}
                  className="btn btn-outline-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!folderModalState.name.trim()}
                  className="btn btn-primary btn-sm"
                >
                  {folderModalState.mode === 'create' ? 'Create Folder' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Workspace Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold">Reset Workspace?</h3>
                <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  This will clear custom projects and restore all factory preset circuit examples. Any unsaved custom work will be removed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="btn btn-outline-secondary btn-sm px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetWorkspace?.();
                }}
                className="btn btn-danger btn-sm px-4 flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                <span>Confirm Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Error Toast */}
      {importErrorMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-rose-950 border border-rose-800 text-rose-200 px-4 py-3 rounded-xl shadow-xl max-w-md animate-in slide-in-from-bottom-3 duration-200">
          <AlertTriangle size={18} className="shrink-0 text-rose-400" />
          <p className="text-xs flex-1">{importErrorMessage}</p>
          <button
            type="button"
            onClick={() => setImportErrorMessage(null)}
            className="text-rose-400 hover:text-rose-100 p-0.5"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Global Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          title={contextMenu.title}
          onClose={() => setContextMenu(null)}
          theme={isDark ? 'dark' : 'light'}
        />
      )}
    </div>
  );
};
