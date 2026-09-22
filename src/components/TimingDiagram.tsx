import React from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';

export interface SignalHistory {
  id?: string;
  name: string;
  color: string;
  history: boolean[]; // Array of boolean states (up to 36 samples)
}

interface TimingDiagramProps {
  signals: SignalHistory[];
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
  theme?: 'dark' | 'light';
}

export const TimingDiagram: React.FC<TimingDiagramProps> = ({
  signals,
  isOpen,
  onToggle,
  onClear,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const SAMPLES_COUNT = 32;

  return (
    <div
      className={`border-t backdrop-blur-md transition-all select-none z-20 ${
        isDark
          ? 'border-slate-800 bg-slate-950/95 text-slate-100'
          : 'border-slate-300 bg-white/95 text-slate-800 shadow-lg'
      }`}
    >
      {/* Header Bar */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 border-b ${
          isDark ? 'border-slate-800/80 bg-slate-950/50' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div
          className={`flex items-center gap-2 cursor-pointer transition-colors ${
            isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
          }`}
          onClick={onToggle}
        >
          <Activity size={15} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
          <span className="text-xs font-semibold">Signal Waveforms</span>
          <span className="text-[10px] font-mono text-slate-500">
            ({signals.length} monitored signals)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isOpen && signals.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="btn btn-outline-danger btn-sm py-0.5 px-2 text-[10px]"
            >
              Clear Buffer
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="btn btn-sm btn-icon btn-outline-secondary"
            title={isOpen ? "Collapse Waveforms" : "Expand Waveforms"}
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Waveform Tracks */}
      {isOpen && (
        <div className="p-3 max-h-48 overflow-y-auto space-y-2.5 font-mono text-xs">
          {signals.length === 0 ? (
            <div className="text-center py-3 text-slate-500 text-xs">
              Connect components to see live logic waveforms as the circuit runs.
            </div>
          ) : (
            signals.map((sig, idx) => {
              // Ensure we display up to SAMPLES_COUNT samples
              const padded = sig.history.slice(-SAMPLES_COUNT);
              while (padded.length < SAMPLES_COUNT) {
                padded.unshift(false);
              }

              // Compute SVG path for digital square wave
              const stepWidth = 14;
              const highY = 4;
              const lowY = 22;
              let pathD = '';

              padded.forEach((val, pIdx) => {
                const x1 = pIdx * stepWidth;
                const x2 = (pIdx + 1) * stepWidth;
                const y = val ? highY : lowY;

                if (pIdx === 0) {
                  pathD += `M ${x1} ${y} L ${x2} ${y}`;
                } else {
                  const prevVal = padded[pIdx - 1];
                  if (prevVal !== val) {
                    // Vertical transition edge
                    pathD += ` L ${x1} ${y} L ${x2} ${y}`;
                  } else {
                    pathD += ` L ${x2} ${y}`;
                  }
                }
              });

              const currentVal = padded[padded.length - 1];

              return (
                <div key={sig.id || `sig_${sig.name}_${idx}`} className="flex items-center gap-3">
                  <div className="w-28 truncate shrink-0 flex items-center justify-between">
                    <span
                      className={`text-[11px] font-semibold truncate ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                      title={sig.name}
                    >
                      {sig.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1 rounded ${
                        currentVal
                          ? isDark
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isDark
                          ? 'bg-slate-900 text-slate-500 border border-slate-800'
                          : 'bg-slate-100 text-slate-600 border border-slate-300'
                      }`}
                    >
                      {currentVal ? '1' : '0'}
                    </span>
                  </div>

                  {/* SVG Waveform track */}
                  <div
                    className={`flex-1 overflow-x-hidden rounded border p-1 ${
                      isDark
                        ? 'bg-slate-900/60 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <svg
                      width={SAMPLES_COUNT * stepWidth}
                      height="26"
                      className="overflow-visible"
                    >
                      {/* Grid guideline for low */}
                      <line
                        x1="0"
                        y1={lowY}
                        x2={SAMPLES_COUNT * stepWidth}
                        y2={lowY}
                        stroke={isDark ? '#334155' : '#cbd5e1'}
                        strokeDasharray="2 2"
                        strokeWidth="1"
                      />
                      {/* Waveform line */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={sig.color || (currentVal ? '#10b981' : isDark ? '#38bdf8' : '#0284c7')}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
