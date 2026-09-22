import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Terminal,
  Variable,
  BookOpen,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Sparkles,
} from 'lucide-react';
import { FlowchartExecutionState } from '../utils/flowchartEngine';

interface FlowchartPanelProps {
  executionState: FlowchartExecutionState;
  onStep: (inputValue?: string | number) => void;
  onRunToggle: () => void;
  onReset: () => void;
  onSelectPreset: (presetId: string) => void;
  isRunning: boolean;
  speedMs: number;
  onSpeedChange: (speedMs: number) => void;
  onClearLogs: () => void;
  theme?: 'dark' | 'light';
}

export const FlowchartPanel: React.FC<FlowchartPanelProps> = ({
  executionState,
  onStep,
  onRunToggle,
  onReset,
  onSelectPreset,
  isRunning,
  speedMs,
  onSpeedChange,
  onClearLogs,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'variables' | 'console' | 'presets'>('console');
  const [userInputVal, setUserInputVal] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (activeTab === 'console') {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [executionState.logs.length, activeTab]);

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInputVal.trim()) return;
    onStep(userInputVal.trim());
    setUserInputVal('');
  };

  const varEntries = Object.entries(executionState.variables);

  return (
    <div
      id="flowchart-panel"
      className={`fixed bottom-4 right-4 z-40 rounded-xl shadow-2xl border transition-all flex flex-col ${
        isMinimized ? 'w-72' : 'w-88 sm:w-96 max-h-[80vh]'
      } ${
        isDark
          ? 'bg-slate-900/95 border-slate-700/80 text-slate-200 backdrop-blur-md'
          : 'bg-white/95 border-slate-300 text-slate-800 backdrop-blur-md'
      }`}
    >
      {/* Header & Controls Bar */}
      <div
        className={`px-3 py-2.5 rounded-t-xl border-b flex items-center justify-between ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100/90 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold tracking-wide flex items-center gap-1.5">
            Algorithm Studio
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                executionState.status === 'running'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : executionState.status === 'waiting_input'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                  : executionState.status === 'completed'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
              }`}
            >
              {executionState.status.toUpperCase()}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="btn btn-sm btn-icon btn-outline-secondary"
            title={isMinimized ? 'Expand Panel' : 'Minimize Panel'}
          >
            {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Execution Action Toolbar */}
      <div
        className={`px-3 py-2 flex items-center justify-between gap-2 border-b ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRunToggle}
            className={`btn btn-sm ${isRunning ? 'btn-warning' : 'btn-success'}`}
            title={isRunning ? 'Pause Execution' : 'Run Automatically'}
          >
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
            <span>{isRunning ? 'Pause' : 'Run'}</span>
          </button>

          <button
            type="button"
            onClick={() => onStep()}
            disabled={isRunning || executionState.status === 'waiting_input'}
            className="btn btn-sm btn-primary"
            title="Step forward one block (F10)"
          >
            <SkipForward size={13} />
            <span>Step</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="btn btn-sm btn-icon btn-outline-secondary"
            title="Reset algorithm to start"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400">Speed:</span>
          <select
            value={speedMs}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className={`text-xs px-1.5 py-0.5 rounded border font-mono focus:outline-none ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <option value={1000}>1.0s (Slow)</option>
            <option value={450}>0.4s (Normal)</option>
            <option value={150}>0.1s (Fast)</option>
          </select>
        </div>
      </div>

      {/* Input Prompt Alert Banner (When waiting for user input) */}
      {executionState.status === 'waiting_input' && executionState.waitingInput && (
        <div
          className={`p-3 border-b flex flex-col gap-2 ${
            isDark ? 'bg-purple-950/40 border-purple-800/50' : 'bg-purple-50 border-purple-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
            <Sparkles size={14} className="text-purple-400" />
            <span>Interactive Input Required</span>
          </div>
          <p className="text-xs text-slate-300">
            {executionState.waitingInput.prompt || `Enter value for ${executionState.waitingInput.varName}:`}
          </p>
          <form onSubmit={handleInputSubmit} className="flex gap-1.5">
            <input
              type="text"
              autoFocus
              value={userInputVal}
              onChange={(e) => setUserInputVal(e.target.value)}
              placeholder={`Value for ${executionState.waitingInput.varName}...`}
              className={`flex-1 px-2 py-1 rounded text-xs border font-mono focus:outline-none focus:border-purple-500 ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm flex items-center gap-1"
            >
              <Send size={12} />
              <span>Submit</span>
            </button>
          </form>
        </div>
      )}

      {/* Body content when not minimized */}
      {!isMinimized && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Sub-tabs: Console vs Variables vs Presets */}
          <div
            className={`flex border-b text-xs ${
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-100/50'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveTab('console')}
              className={`flex-1 py-1.5 px-3 flex items-center justify-center gap-1.5 font-medium border-b-2 transition-colors ${
                activeTab === 'console'
                  ? 'border-[#0284c7] text-[#0284c7] font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal size={13} />
              <span>Console</span>
              <span className="text-[10px] font-mono px-1 rounded-full bg-slate-800 text-slate-400">
                {executionState.logs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('variables')}
              className={`flex-1 py-1.5 px-3 flex items-center justify-center gap-1.5 font-medium border-b-2 transition-colors ${
                activeTab === 'variables'
                  ? 'border-[#0284c7] text-[#0284c7] font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Variable size={13} />
              <span>Watch Vars</span>
              <span className="text-[10px] font-mono px-1 rounded-full bg-slate-800 text-slate-400">
                {varEntries.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-1.5 px-3 flex items-center justify-center gap-1.5 font-medium border-b-2 transition-colors ${
                activeTab === 'presets'
                  ? 'border-[#0284c7] text-[#0284c7] font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen size={13} />
              <span>Study</span>
            </button>
          </div>

          {/* Console Tab */}
          {activeTab === 'console' && (
            <div className="flex flex-col h-56 min-h-[14rem]">
              <div className="flex-1 overflow-y-auto p-2.5 font-mono text-xs space-y-1.5 select-text">
                {executionState.logs.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    Console ready. Click Step or Run to execute algorithm.
                  </div>
                ) : (
                  executionState.logs.map((log) => (
                    <div
                      key={log.id}
                      className={`px-2 py-1 rounded text-xs leading-relaxed flex items-start gap-1.5 ${
                        log.type === 'error'
                          ? 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                          : log.type === 'output'
                          ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 font-bold'
                          : log.type === 'input'
                          ? 'bg-purple-950/40 text-purple-300 border border-purple-800/40'
                          : log.type === 'decision'
                          ? 'bg-amber-950/30 text-amber-300 border border-amber-800/30'
                          : log.type === 'success'
                          ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-semibold'
                          : isDark
                          ? 'text-slate-300'
                          : 'text-slate-700'
                      }`}
                    >
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono mt-0.5">
                        #{log.stepNumber}
                      </span>
                      <span className="break-words flex-1">{log.message}</span>
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
              <div
                className={`px-3 py-1.5 border-t flex justify-between items-center text-[10px] text-slate-400 ${
                  isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-100/50 border-slate-200'
                }`}
              >
                <span>Steps executed: {executionState.stepCount}</span>
                <button
                  type="button"
                  onClick={onClearLogs}
                  className="btn btn-outline-secondary btn-sm py-0 px-2 text-[10px]"
                >
                  Clear Console
                </button>
              </div>
            </div>
          )}

          {/* Variables Watch Tab */}
          {activeTab === 'variables' && (
            <div className="h-56 min-h-[14rem] overflow-y-auto p-2.5">
              {varEntries.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No variables in scope yet. Variables are defined dynamically during execution (e.g. sum = 0).
                </div>
              ) : (
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 bg-slate-800/60 px-2.5 py-1.5 text-[11px] font-bold text-slate-300">
                    <span>Variable</span>
                    <span>Current Value</span>
                  </div>
                  {varEntries.map(([name, val]) => (
                    <div
                      key={name}
                      className="grid grid-cols-2 px-2.5 py-1.5 text-xs font-mono items-center hover:bg-slate-800/30 transition-colors"
                    >
                      <span className="text-sky-400 font-bold">{name}</span>
                      <span className="text-emerald-400 font-semibold truncate">
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Presets Tab */}
          {activeTab === 'presets' && (
            <div className="h-56 min-h-[14rem] overflow-y-auto p-2.5 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Load Algorithm Example:
              </span>
              <button
                type="button"
                onClick={() => onSelectPreset('flowchart_sheet_sum')}
                className={`w-full text-left p-2 rounded-lg border transition-all ${
                  isDark
                    ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-200'
                    : 'bg-slate-50 hover:bg-sky-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="text-xs font-bold text-sky-400">Sum of 1 to N</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Accumulator pattern with counting loop and condition check
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSelectPreset('flowchart_sheet_even_odd')}
                className={`w-full text-left p-2 rounded-lg border transition-all ${
                  isDark
                    ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-200'
                    : 'bg-slate-50 hover:bg-sky-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="text-xs font-bold text-purple-400">Even or Odd Checker</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Modulus decision branch (num % 2 == 0) with interactive input
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSelectPreset('flowchart_sheet_factorial')}
                className={`w-full text-left p-2 rounded-lg border transition-all ${
                  isDark
                    ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-200'
                    : 'bg-slate-50 hover:bg-sky-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="text-xs font-bold text-amber-400">Factorial (N!)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Multiplicative accumulator loop computing N!
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSelectPreset('flowchart_sheet_max')}
                className={`w-full text-left p-2 rounded-lg border transition-all ${
                  isDark
                    ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-200'
                    : 'bg-slate-50 hover:bg-sky-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="text-xs font-bold text-emerald-400">Find Maximum (A or B)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Binary comparator decision with dual assignment paths
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
