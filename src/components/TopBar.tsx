import React, { useState } from 'react';
import { SimulationSettings } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ShieldCheck, PanelLeft } from 'lucide-react';
import {
  faPlay,
  faPause,
  faForwardStep,
  faTable,
  faWaveSquare,
  faBookOpen,
  faCodeBranch,
  faBorderAll,
  faMagnet,
  faVolumeHigh,
  faVolumeXmark,
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
  faExpand,
  faDownload,
  faFileCode,
  faCircleQuestion,
  faHouse,
  faPlus,
  faPen,
  faCheck,
  faSun,
  faMoon,
  faSquarePlus,
  faBolt,
  faTag,
  faRotateLeft,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';

interface TopBarProps {
  settings: SimulationSettings;
  projectName?: string;
  onNavigateHome?: () => void;
  onRenameProject?: (newName: string) => void;
  onNewCircuit?: () => void;
  onUpdateSettings: (settings: Partial<SimulationSettings>) => void;
  onStepSimulation: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onOpenTruthTable: () => void;
  onOpenExportModal: () => void;
  onExportSvg: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenHelpModal: () => void;
  onLoadPreset: (presetIndex: number) => void;
  onToggleMobileDrawer: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenEdaTools?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  settings,
  projectName = 'Untitled Circuit',
  onNavigateHome,
  onRenameProject,
  onNewCircuit,
  onUpdateSettings,
  onStepSimulation,
  onZoomIn,
  onZoomOut,
  onResetView,
  onOpenTruthTable,
  onOpenExportModal,
  onExportSvg,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenHelpModal,
  onLoadPreset,
  onToggleMobileDrawer,
  isSidebarOpen = true,
  onToggleSidebar,
  onOpenEdaTools,
}) => {
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(projectName);

  const isDark = settings.theme === 'dark';

  const handleSaveTitle = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (titleInput.trim()) {
      onRenameProject?.(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const toggleTheme = () => {
    onUpdateSettings({ theme: isDark ? 'light' : 'dark' });
  };

  return (
    <header
      id="logicflow-topbar"
      className={`flex items-center justify-between px-3 sm:px-4 py-2 border-b z-30 select-none gap-2 overflow-x-auto scrollbar-none transition-colors duration-200 ${
        isDark
          ? 'bg-slate-900/95 backdrop-blur-md border-slate-800 text-slate-100'
          : 'bg-white/95 backdrop-blur-md border-slate-200 text-slate-800 shadow-2xs'
      }`}
    >
      {/* Brand, Home Navigation & Project Title */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* App Logo */}
        <div
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
          title="LogixFlow EDA Studio - Home"
        >
          <img
            src="/logo.png"
            alt="LogixFlow Logo"
            className="w-7 h-7 object-contain rounded-md shadow-xs ring-1 ring-slate-700/50"
          />
          <span className="hidden xl:inline font-mono font-bold text-xs tracking-tight text-sky-400">
            LOGIXFLOW
          </span>
        </div>

        {/* Mobile Add Component Button */}
        <button
          type="button"
          onClick={onToggleMobileDrawer}
          className="btn btn-primary btn-sm btn-icon md:hidden shadow-sm"
          title="Add Component"
        >
          <FontAwesomeIcon icon={faSquarePlus} className="w-3.5 h-3.5" />
        </button>

        {/* Desktop Sidebar Toggle Button */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`btn btn-sm ${
              isSidebarOpen ? 'btn-primary' : 'btn-outline-secondary'
            } hidden md:inline-flex items-center gap-1.5`}
            title={isSidebarOpen ? 'Collapse Components Sidebar (Ctrl+B)' : 'Expand Components Sidebar (Ctrl+B)'}
          >
            <PanelLeft size={13} />
            <span className="text-xs">Palette</span>
          </button>
        )}

        {/* Home / Projects Dashboard Button */}
        {onNavigateHome && (
          <button
            type="button"
            onClick={onNavigateHome}
            className="btn btn-outline-secondary btn-sm font-semibold"
            title="Return to Main Menu / Projects"
          >
            <FontAwesomeIcon icon={faHouse} className="w-3 h-3 text-sky-400" />
            <span className="hidden sm:inline">Projects</span>
          </button>
        )}

        {/* Project Title (Inline Editable) */}
        <div className="flex items-center gap-1.5 border-l border-slate-700/80 pl-2 sm:pl-3">
          {isEditingTitle ? (
            <form onSubmit={handleSaveTitle} className="flex items-center gap-1">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                autoFocus
                className={`form-control form-control-sm border rounded px-2 py-0.5 text-xs font-mono focus:outline-none w-36 ${
                  isDark
                    ? 'bg-slate-950 border-sky-400 text-white'
                    : 'bg-white border-sky-500 text-slate-900 shadow-xs'
                }`}
              />
              <button type="submit" className="btn btn-sm btn-outline-success btn-icon p-1" title="Save title">
                <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <div
              onClick={() => {
                setTitleInput(projectName);
                setIsEditingTitle(true);
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer group/title transition-colors ${
                isDark ? 'hover:bg-slate-800/70' : 'hover:bg-slate-200/60'
              }`}
              title="Click to rename project"
            >
              <span className={`text-xs sm:text-sm font-bold font-mono max-w-32.5 sm:max-w-50 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {projectName}
              </span>
              <FontAwesomeIcon
                icon={faPen}
                className="w-2.5 h-2.5 text-slate-500 group-hover/title:text-sky-400 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Quick New Circuit Button */}
        {onNewCircuit && (
          <button
            type="button"
            onClick={onNewCircuit}
            className="btn btn-outline-success btn-sm hidden lg:inline-flex"
            title="Create a new blank circuit"
          >
            <FontAwesomeIcon icon={faPlus} className="w-2.5 h-2.5" />
            <span>New</span>
          </button>
        )}
      </div>

      {/* Primary Simulation Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Run / Pause Toggle */}
        <button
          type="button"
          id="btn-toggle-run"
          onClick={() => onUpdateSettings({ running: !settings.running })}
          className={`btn btn-sm font-bold shadow-sm ${
            settings.running
              ? 'btn-warning'
              : 'btn-success'
          }`}
          title={settings.running ? 'Pause simulation' : 'Run simulation'}
        >
          <FontAwesomeIcon icon={settings.running ? faPause : faPlay} className="w-3 h-3" />
          <span className="hidden sm:inline">{settings.running ? 'Running' : 'Run'}</span>
        </button>

        {/* Step Button */}
        <button
          type="button"
          id="btn-step"
          onClick={onStepSimulation}
          className="btn btn-outline-secondary btn-sm"
          title="Step one clock pulse forward"
        >
          <FontAwesomeIcon icon={faForwardStep} className="w-3 h-3" />
          <span className="hidden md:inline">Step</span>
        </button>

        {/* Truth Table Generator Button */}
        <button
          type="button"
          id="btn-truth-table"
          onClick={onOpenTruthTable}
          className="btn btn-outline-info btn-sm"
          title="Generate Truth Table"
        >
          <FontAwesomeIcon icon={faTable} className="w-3 h-3" />
          <span className="hidden lg:inline">Table</span>
        </button>

        {/* Oscilloscope / Waveforms Button */}
        <button
          type="button"
          id="btn-waveform"
          onClick={() =>
            onUpdateSettings({ showTimingDiagram: !settings.showTimingDiagram })
          }
          className={`btn btn-sm hidden sm:inline-flex ${
            settings.showTimingDiagram
              ? 'btn-success'
              : 'btn-outline-secondary'
          }`}
          title="Toggle Waveform Scope"
        >
          <FontAwesomeIcon icon={faWaveSquare} className="w-3 h-3" />
          <span className="hidden xl:inline">Scope</span>
        </button>
      </div>

      {/* Secondary Controls & View Tools */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Undo / Redo Group */}
        <div className="btn-group btn-group-sm" role="group" aria-label="Undo and Redo">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="btn btn-outline-secondary btn-sm btn-icon"
            title="Undo last circuit edit (Ctrl+Z)"
            aria-label="Undo last circuit edit"
          >
            <FontAwesomeIcon icon={faRotateLeft} className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="btn btn-outline-secondary btn-sm btn-icon"
            title="Redo last circuit edit (Ctrl+Y)"
            aria-label="Redo last circuit edit"
          >
            <FontAwesomeIcon icon={faRotateRight} className="w-3 h-3" />
          </button>
        </div>

        {/* Wire Style: Curved vs Orthogonal */}
        <button
          type="button"
          onClick={() =>
            onUpdateSettings({
              wireStyle: settings.wireStyle === 'curved' ? 'orthogonal' : 'curved',
            })
          }
          className="btn btn-outline-secondary btn-sm btn-icon hidden sm:inline-flex"
          title={`Wire Style: ${settings.wireStyle === 'curved' ? 'Curved Bezier' : 'Orthogonal Manhattan'}`}
        >
          <FontAwesomeIcon icon={faCodeBranch} className="w-3.5 h-3.5" />
        </button>

        {/* Canvas Grid Lines Toggle */}
        <button
          type="button"
          onClick={() => onUpdateSettings({ showGrid: !settings.showGrid })}
          className={`btn btn-sm btn-icon hidden sm:inline-flex ${
            settings.showGrid
              ? 'btn-info'
              : 'btn-outline-secondary'
          }`}
          title={settings.showGrid ? 'Grid: Visible' : 'Grid: Hidden'}
        >
          <FontAwesomeIcon icon={faBorderAll} className="w-3.5 h-3.5" />
        </button>

        {/* Circuit Flow Notation Toggle */}
        <button
          type="button"
          id="btn-toggle-notation"
          onClick={() =>
            onUpdateSettings({
              showWireExpressions: !settings.showWireExpressions,
            })
          }
          className={`btn btn-sm hidden sm:inline-flex ${
            settings.showWireExpressions
              ? 'btn-warning'
              : 'btn-outline-secondary'
          }`}
          title={
            settings.showWireExpressions
              ? 'Circuit Flow Notation: ON (Showing 1/0 & Boolean Logic)'
              : 'Circuit Flow Notation: OFF (Click to display flow state & Boolean expressions)'
          }
        >
          <FontAwesomeIcon icon={faBolt} className="w-3 h-3" />
          <span className="hidden xl:inline">Notation</span>
        </button>

        {/* Component Variables Toggle */}
        <button
          type="button"
          id="btn-toggle-variables"
          onClick={() =>
            onUpdateSettings({
              showComponentVariables: !settings.showComponentVariables,
            })
          }
          className={`btn btn-sm hidden sm:inline-flex ${
            settings.showComponentVariables !== false
              ? 'btn-primary'
              : 'btn-outline-secondary'
          }`}
          title={
            settings.showComponentVariables !== false
              ? 'Component Variables: Visible above all components (Click to toggle)'
              : 'Component Variables: Hidden (Click to show variables above all components)'
          }
        >
          <FontAwesomeIcon icon={faTag} className="w-3 h-3" />
          <span className="hidden xl:inline">Variables</span>
        </button>

        {/* Altium-inspired EDA Tools Workstation (DRC, BOM, Netlist) */}
        {onOpenEdaTools && (
          <button
            type="button"
            id="btn-eda-tools"
            onClick={onOpenEdaTools}
            className="btn btn-outline-secondary btn-sm flex items-center gap-1.5 border-sky-500/50 text-sky-400 hover:bg-sky-500/15"
            title="Altium EDA Workstation: Electrical Rules Check (DRC/ERC), Bill of Materials (BOM), Netlist Inspector"
          >
            <ShieldCheck size={14} className="text-sky-400" />
            <span className="hidden sm:inline font-mono font-bold text-xs">EDA Tools</span>
          </button>
        )}

        {/* Dark / Light Theme Toggle */}
        <button
          type="button"
          id="btn-toggle-theme"
          onClick={toggleTheme}
          className="btn btn-outline-secondary btn-sm btn-icon"
          title={isDark ? 'Switch to Light Blueprint Theme' : 'Switch to Dark Mode Theme'}
        >
          <FontAwesomeIcon icon={isDark ? faSun : faMoon} className="w-3.5 h-3.5 text-amber-400" />
        </button>

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
          className="btn btn-outline-secondary btn-sm btn-icon"
          title={settings.soundEnabled ? 'Audio: Enabled' : 'Audio: Muted'}
        >
          <FontAwesomeIcon icon={settings.soundEnabled ? faVolumeHigh : faVolumeXmark} className="w-3.5 h-3.5" />
        </button>

        {/* Zoom Controls Button Group */}
        <div className="btn-group btn-group-sm hidden lg:inline-flex" role="group" aria-label="Zoom controls">
          <button
            type="button"
            onClick={onZoomOut}
            className="btn btn-outline-secondary btn-sm btn-icon"
            title="Zoom out (-)"
          >
            <FontAwesomeIcon icon={faMagnifyingGlassMinus} className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onResetView}
            className="btn btn-outline-secondary btn-sm btn-icon"
            title="Reset zoom & pan"
          >
            <FontAwesomeIcon icon={faExpand} className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            className="btn btn-outline-secondary btn-sm btn-icon"
            title="Zoom in (+)"
          >
            <FontAwesomeIcon icon={faMagnifyingGlassPlus} className="w-3 h-3" />
          </button>
        </div>

        {/* Export / Download Button */}
        <button
          type="button"
          id="btn-export-import"
          onClick={onOpenExportModal}
          className="btn btn-primary btn-sm shadow-sm"
          title="Download as PNG (High-Res) / Export JSON Project"
        >
          <FontAwesomeIcon icon={faDownload} className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Export</span>
        </button>

        <button
          type="button"
          onClick={onExportSvg}
          className="btn btn-outline-secondary btn-sm btn-icon"
          title="Export circuit as SVG"
        >
          <FontAwesomeIcon icon={faFileCode} className="w-3.5 h-3.5" />
        </button>

        {/* Help / Guide Button */}
        <button
          type="button"
          id="btn-guide-shortcuts"
          onClick={onOpenHelpModal}
          className="btn btn-outline-info btn-sm"
          title="User Guide & Keyboard Shortcuts (? or H)"
        >
          <FontAwesomeIcon icon={faCircleQuestion} className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Guide</span>
        </button>

        {/* Official GitHub Repository Link */}
        <a
          href="https://github.com/ktesla39/LogixFlow"
          target="_blank"
          rel="noopener noreferrer"
          id="btn-github-link"
          className="btn btn-outline-secondary btn-sm btn-icon"
          title="LogixFlow on GitHub (https://github.com/ktesla39/LogixFlow)"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
      </div>
    </header>
  );
};
