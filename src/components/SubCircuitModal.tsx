import React, { useState } from 'react';
import { SubCircuitDefinition } from '../types';
import { X, Layers, Eye, Trash2, Plus, Sparkles } from 'lucide-react';

interface SubCircuitModalProps {
  isOpen: boolean;
  onClose: () => void;
  subCircuits: SubCircuitDefinition[];
  onInstantiate: (def: SubCircuitDefinition) => void;
  onDeleteDefinition?: (defId: string) => void;
  theme?: 'dark' | 'light';
}

export const SubCircuitModal: React.FC<SubCircuitModalProps> = ({
  isOpen,
  onClose,
  subCircuits,
  onInstantiate,
  onDeleteDefinition,
  theme = 'light',
}) => {
  const [selectedDefId, setSelectedDefId] = useState<string | null>(
    subCircuits[0]?.id || null
  );

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const selectedDef =
    subCircuits.find((s) => s.id === selectedDefId) || subCircuits[0] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors max-h-[85vh] ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Custom Sub-Circuits Library</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Reuse and instantiate custom integrated modular blocks
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
          {/* Sub-circuits List */}
          <div
            className={`w-full sm:w-64 border-b sm:border-b-0 sm:border-r overflow-y-auto p-3 flex flex-col gap-1.5 ${
              isDark ? 'border-slate-800 bg-slate-950/30' : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 py-1">
              Custom ICs ({subCircuits.length})
            </span>

            {subCircuits.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 italic">
                No custom sub-circuits created yet. Select components on the canvas and click "Create Sub-circuit" to group them!
              </div>
            ) : (
              subCircuits.map((def) => {
                const isSelected = def.id === (selectedDef?.id || '');
                return (
                  <button
                    key={def.id}
                    type="button"
                    onClick={() => setSelectedDefId(def.id)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-500 text-sky-600 dark:text-sky-300 font-bold shadow-xs'
                        : isDark
                        ? 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                        : 'bg-white border-slate-200 hover:bg-slate-100/80 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <img src="/logo.png" alt="" className="w-3.5 h-3.5 object-contain" />
                      <span className="truncate">{def.name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400">
                      {def.internalNodes.length}g
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Details & Action Panel */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col justify-between">
            {selectedDef ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-sky-500 font-mono flex items-center gap-2">
                      <Sparkles size={16} />
                      {selectedDef.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedDef.description || 'Custom modular logic component'}
                    </p>
                  </div>
                  {onDeleteDefinition && (
                    <button
                      type="button"
                      onClick={() => onDeleteDefinition(selectedDef.id)}
                      className="text-xs text-rose-500 hover:text-rose-600 p-1.5 rounded hover:bg-rose-500/10 flex items-center gap-1 transition-colors"
                      title="Delete this sub-circuit definition"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {/* Pins Specification Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Inputs */}
                  <div
                    className={`p-3 rounded-xl border ${
                      isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="font-bold text-[11px] text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Inputs</span>
                      <span className="font-mono text-sky-400">
                        {selectedDef.inputPins.length}
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {selectedDef.inputPins.map((pin: { pinName: string }, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs font-mono bg-slate-900/40 px-2 py-1 rounded border border-slate-700/50"
                        >
                          <span className="text-sky-300 font-bold">{pin.pinName}</span>
                          <span className="text-[10px] text-slate-400">Pin {i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outputs */}
                  <div
                    className={`p-3 rounded-xl border ${
                      isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="font-bold text-[11px] text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Outputs</span>
                      <span className="font-mono text-emerald-400">
                        {selectedDef.outputPins.length}
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {selectedDef.outputPins.map((pin: { pinName: string }, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs font-mono bg-slate-900/40 px-2 py-1 rounded border border-slate-700/50"
                        >
                          <span className="text-emerald-300 font-bold">{pin.pinName}</span>
                          <span className="text-[10px] text-slate-400">Pin {i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Internal composition preview */}
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-100/60 border-slate-200'
                  }`}
                >
                  <div className="font-bold text-[11px] text-slate-400 uppercase tracking-wider mb-1.5">
                    Internal Structure
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <div>
                      Nodes:{' '}
                      <span className="text-white font-bold">
                        {selectedDef.internalNodes.length}
                      </span>
                    </div>
                    <div>
                      Internal Wires:{' '}
                      <span className="text-white font-bold">
                        {selectedDef.internalWires.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Select a sub-circuit to view specifications
              </div>
            )}

            {/* Bottom button */}
            {selectedDef && (
              <div className="pt-4 border-t border-slate-800/60 mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onInstantiate(selectedDef);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  <Plus size={14} />
                  <span>Place on Canvas</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
