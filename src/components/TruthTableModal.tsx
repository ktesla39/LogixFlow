import React, { useState } from 'react';
import { CircuitNode, Wire } from '../types';
import { generateTruthTable } from '../utils/circuitSolver';
import { X, Copy, Check, Table } from 'lucide-react';

interface TruthTableModalProps {
  theme?: 'dark' | 'light';
  nodes: CircuitNode[];
  wires: Wire[];
  isOpen: boolean;
  onClose: () => void;
  onApplyRowInputs?: (inputs: Record<string, boolean>) => void;
}

export const TruthTableModal: React.FC<TruthTableModalProps> = ({
  theme = 'light',
  nodes,
  wires,
  isOpen,
  onClose,
  onApplyRowInputs,
}) => {
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const { inputNames, outputNames, entries } = generateTruthTable(nodes, wires);

  const copyToClipboard = async () => {
    if (entries.length === 0) return;

    // Build markdown table
    const headers = [...inputNames, ...outputNames].join(' | ');
    const divider = [...inputNames, ...outputNames].map(() => '---').join(' | ');
    const rows = entries.map((e) => {
      const inVals = inputNames.map((n) => (e.inputs[n] ? '1' : '0')).join(' | ');
      const outVals = outputNames.map((n) => (e.outputs[n] ? '1' : '0')).join(' | ');
      return `${inVals} | ${outVals}`;
    });

    const markdown = `| ${headers} |\n| ${divider} |\n${rows.map((r) => `| ${r} |`).join('\n')}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(markdown);
      } else {
        const fallback = document.createElement('textarea');
        fallback.value = markdown;
        fallback.style.position = 'fixed';
        fallback.style.opacity = '0';
        document.body.appendChild(fallback);
        fallback.select();
        document.execCommand('copy');
        fallback.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={`truth-table-modal-${theme} fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150`}>
      <div className={`${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-sky-950/80 text-sky-400 border border-sky-800/60' : 'bg-sky-100 text-sky-600 border border-sky-200'}`}>
              <Table size={18} />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Circuit Truth Table</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Automated combinatorial analysis of active inputs and outputs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-icon btn-outline-secondary"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 scrollbar-thin">
          {entries.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                No interactive inputs or outputs found on this sheet.
              </p>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-600'} mt-1 max-w-md mx-auto`}>
                Add at least one Toggle Switch or Push Button, and at least one LED, Probe, or Buzzer connected through gates to view the truth table.
              </p>
            </div>
          ) : (
            <div>
              <div className={`flex items-center justify-between mb-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span>
                  Showing {entries.length} states ({inputNames.length} inputs, {outputNames.length} outputs)
                </span>
                <span className={`text-[11px] ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                  Tip: Click any row to test that state on the live canvas
                </span>
              </div>

              <div className={`border ${isDark ? 'border-slate-800' : 'border-slate-200'} rounded-xl overflow-hidden shadow-inner`}>
                <table className="w-full text-center text-xs">
                  <thead className={`${isDark ? 'bg-slate-950/80 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'} font-mono text-[11px] border-b`}>
                    <tr>
                      <th className={`py-2.5 px-3 border-r ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-500'}`}>#</th>
                      {inputNames.map((name, i) => (
                        <th key={`th_in_${name}_${i}`} className={`py-2.5 px-3 border-r ${isDark ? 'border-slate-800 text-sky-400' : 'border-slate-200 text-sky-600'} font-semibold`}>
                          {name}
                        </th>
                      ))}
                      {outputNames.map((name, i) => (
                        <th key={`th_out_${name}_${i}`} className={`py-2.5 px-3 border-r last:border-r-0 ${isDark ? 'border-slate-800 text-emerald-400' : 'border-slate-200 text-emerald-600'} font-semibold`}>
                          {name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'} font-mono`}>
                    {entries.map((row, idx) => (
                      <tr
                        key={`row_${idx}`}
                        onClick={() => onApplyRowInputs?.(row.inputs)}
                        className={`${isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'} cursor-pointer transition-colors`}
                      >
                        <td className={`py-2 px-3 border-r ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-500'} text-[10px]`}>
                          {idx}
                        </td>
                        {inputNames.map((name, inIdx) => {
                          const val = row.inputs[name];
                          return (
                            <td
                              key={`td_in_${idx}_${inIdx}`}
                              className={`py-2 px-3 border-r ${isDark ? 'border-slate-800' : 'border-slate-200'} font-bold ${
                                val
                                  ? isDark ? 'text-sky-400 bg-sky-950/20' : 'text-sky-600 bg-sky-50'
                                  : isDark ? 'text-slate-500' : 'text-slate-400'
                              }`}
                            >
                              {val ? '1' : '0'}
                            </td>
                          );
                        })}
                        {outputNames.map((name, outIdx) => {
                          const val = row.outputs[name];
                          return (
                            <td
                              key={`td_out_${idx}_${outIdx}`}
                              className={`py-2 px-3 border-r last:border-r-0 ${isDark ? 'border-slate-800' : 'border-slate-200'} font-bold ${
                                val
                                  ? isDark ? 'text-emerald-400 bg-emerald-950/25' : 'text-emerald-600 bg-emerald-50'
                                  : isDark ? 'text-slate-500' : 'text-slate-400'
                              }`}
                            >
                              {val ? '1' : '0'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-5 py-3 border-t ${isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
          <button
            type="button"
            onClick={copyToClipboard}
            disabled={entries.length === 0}
            className="btn btn-outline-secondary btn-sm flex items-center gap-1.5"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Copied Markdown' : 'Copy Table'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary btn-sm px-4"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
