import React, { useState } from 'react';
import { Sheet } from '../types';
import { Plus, Copy, Trash2, Edit2, Layers, Check, X, Search, PanelTop, GitFork, Zap } from 'lucide-react';
import { ContextMenu, ContextMenuItem } from './ContextMenu';

interface SheetTabsProps {
  sheets: Sheet[];
  activeSheetId: string;
  onSelectSheet: (id: string) => void;
  onCreateSheet: (type?: 'logic' | 'flowchart' | 'electric') => void;
  onRenameSheet: (id: string, newName: string) => void;
  onDuplicateSheet: (id: string) => void;
  onDeleteSheet: (id: string) => void;
  theme?: 'dark' | 'light';
}

export const SheetTabs: React.FC<SheetTabsProps> = ({
  sheets,
  activeSheetId,
  onSelectSheet,
  onCreateSheet,
  onRenameSheet,
  onDuplicateSheet,
  onDeleteSheet,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    sheet: Sheet;
  } | null>(null);

  const startRename = (sheet: Sheet) => {
    setEditingId(sheet.id);
    setEditName(sheet.name);
  };

  const saveRename = () => {
    if (editingId && editName.trim()) {
      onRenameSheet(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const cancelRename = () => {
    setEditingId(null);
  };

  const filteredSheets = sheets.filter((sheet) =>
    sheet.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div
      id="sheet-tabs-bar"
      className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs overflow-x-auto select-none scrollbar-thin z-20 border-t transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200/90 border-slate-300'
      }`}
    >
      {isManagerOpen && (
        <div
          className={`absolute bottom-full left-2 right-2 sm:left-auto sm:w-[min(28rem,calc(100vw-1rem))] mb-2 z-50 rounded-xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
          }`}
        >
          <div className={`flex items-center justify-between px-3 py-2.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <PanelTop size={15} className={isDark ? 'text-sky-400' : 'text-sky-600'} />
              <div>
                <div className="text-xs font-semibold">Sheet manager</div>
                <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  {sheets.length} {sheets.length === 1 ? 'sheet' : 'sheets'} in this project
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsManagerOpen(false)}
              className={`p-1.5 rounded-md transition-colors ${
                isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Close sheet manager"
              aria-label="Close sheet manager"
            >
              <X size={14} />
            </button>
          </div>

          <div className={`p-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <label className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <Search size={13} className="text-slate-500 shrink-0" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Find a sheet..."
                className={`w-full bg-transparent text-xs outline-none ${isDark ? 'text-slate-100 placeholder:text-slate-600' : 'text-slate-900 placeholder:text-slate-400'}`}
                aria-label="Find a sheet"
              />
            </label>
          </div>

          <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
            {filteredSheets.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-slate-500">No matching sheets</div>
            ) : (
              filteredSheets.map((sheet) => {
                const isActive = sheet.id === activeSheetId;
                return (
                  <div
                    key={`manager-${sheet.id}`}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors ${
                      isActive
                        ? isDark
                          ? 'bg-sky-950/50 border-sky-800/80'
                          : 'bg-sky-50 border-sky-200'
                        : isDark
                        ? 'border-transparent hover:bg-slate-900'
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSheet(sheet.id);
                        setIsManagerOpen(false);
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className={`truncate text-xs font-semibold ${isActive ? 'text-sky-500' : ''}`}>
                        {sheet.name}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-500 font-mono">
                        {sheet.nodes.length} nodes · {sheet.wires.length} wires
                      </div>
                    </button>
                    <button type="button" onClick={() => startRename(sheet)} className="p-1.5 rounded text-slate-500 hover:text-sky-500 hover:bg-slate-800/60" title={`Rename ${sheet.name}`} aria-label={`Rename ${sheet.name}`}>
                      <Edit2 size={12} />
                    </button>
                    <button type="button" onClick={() => onDuplicateSheet(sheet.id)} className="p-1.5 rounded text-slate-500 hover:text-sky-500 hover:bg-slate-800/60" title={`Duplicate ${sheet.name}`} aria-label={`Duplicate ${sheet.name}`}>
                      <Copy size={12} />
                    </button>
                    {sheets.length > 1 && (
                      <button type="button" onClick={() => onDeleteSheet(sheet.id)} className="p-1.5 rounded text-slate-500 hover:text-rose-500 hover:bg-slate-800/60" title={`Delete ${sheet.name}`} aria-label={`Delete ${sheet.name}`}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className={`flex items-center justify-between gap-2 px-2.5 py-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <span className="text-[10px] text-slate-500">Double-click a tab to rename</span>
            <button
              type="button"
              onClick={() => {
                onCreateSheet();
                setIsManagerOpen(false);
              }}
              className="btn btn-primary btn-sm font-semibold"
            >
              <Plus size={12} />
              New sheet
            </button>
          </div>
        </div>
      )}

      {/* Sheets Icon / Label */}
      <button
        type="button"
        onClick={() => setIsManagerOpen((open) => !open)}
        className="btn btn-outline-secondary btn-sm mr-2 font-semibold shrink-0"
        title="Open sheet manager"
        aria-label="Open sheet manager"
        aria-expanded={isManagerOpen}
      >
        <Layers size={14} className={isDark ? 'text-sky-400' : 'text-sky-600'} />
        <span className="hidden sm:inline text-[11px] uppercase tracking-wider">
          Sheets
        </span>
      </button>

      {/* Tabs Container */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
        {sheets.map((sheet) => {
          const isActive = sheet.id === activeSheetId;
          const isEditing = editingId === sheet.id;

          if (isEditing) {
            return (
              <div
                key={sheet.id}
                className={`flex items-center gap-1 px-2 py-1 rounded-md border shadow-sm shrink-0 ${
                  isDark ? 'bg-slate-800 border-sky-500' : 'bg-white border-sky-500'
                }`}
              >
                <input
                  type="text"
                  value={editName}
                  autoFocus
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveRename();
                    if (e.key === 'Escape') cancelRename();
                  }}
                  className={`px-1.5 py-0.5 text-xs rounded outline-none w-28 border ${
                    isDark
                      ? 'bg-slate-950 text-slate-100 border-slate-700'
                      : 'bg-slate-50 text-slate-900 border-slate-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={saveRename}
                  className="p-1 text-emerald-500 hover:text-emerald-400"
                >
                  <Check size={12} />
                </button>
                <button
                  type="button"
                  onClick={cancelRename}
                  className="p-1 text-rose-500 hover:text-rose-400"
                >
                  <X size={12} />
                </button>
              </div>
            );
          }

          return (
            <div
              key={sheet.id}
              onClick={() => onSelectSheet(sheet.id)}
              onDoubleClick={() => startRename(sheet)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectSheet(sheet.id);
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  sheet,
                });
              }}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-t border-x cursor-pointer transition-all shrink-0 ${
                isActive
                  ? isDark
                    ? 'bg-slate-950 border-slate-700 text-sky-400 font-semibold shadow-sm'
                    : 'bg-white border-slate-300 text-sky-600 font-semibold shadow-xs'
                  : isDark
                  ? 'bg-slate-900/70 border-transparent hover:bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  : 'bg-slate-200/50 border-transparent hover:bg-slate-300/80 text-slate-600 hover:text-slate-900'
              }`}
            >
              {sheet.circuitType === 'flowchart' ? (
                <GitFork size={12} className={isActive ? 'text-amber-400' : 'text-slate-500'} />
              ) : sheet.circuitType === 'electric' ? (
                <Zap size={12} className={isActive ? 'text-emerald-400' : 'text-slate-500'} />
              ) : (
                <img src="/logo.png" alt="" className={`w-3.5 h-3.5 object-contain ${isActive ? 'opacity-100' : 'opacity-60'}`} />
              )}
              <span className="truncate max-w-32.5">{sheet.name}</span>

              {/* Node count pill */}
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? isDark
                      ? 'bg-sky-950 text-sky-300 border border-sky-800'
                      : 'bg-sky-100 text-sky-700 border border-sky-300'
                    : isDark
                    ? 'bg-slate-800 text-slate-500'
                    : 'bg-slate-300/80 text-slate-600'
                }`}
              >
                {sheet.nodes.length}
              </span>

              {/* Action tools on active sheet */}
              {isActive && (
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(sheet);
                    }}
                    className={`p-0.5 rounded transition-colors ${
                      isDark
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                    title="Rename sheet"
                  >
                    <Edit2 size={11} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSheet(sheet.id);
                    }}
                    className={`p-0.5 rounded transition-colors ${
                      isDark
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                    title="Duplicate sheet"
                  >
                    <Copy size={11} />
                  </button>

                  {sheets.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSheet(sheet.id);
                      }}
                      className={`p-0.5 rounded transition-colors ${
                        isDark
                          ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                          : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                      }`}
                      title="Delete sheet"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Sheet Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          id="btn-create-sheet"
          onClick={() => onCreateSheet('logic')}
          className="btn btn-outline-primary btn-sm font-medium"
          title="Add new digital logic circuit sheet"
        >
          <img src="/logo.png" alt="" className="w-3.5 h-3.5 object-contain" />
          <span className="hidden sm:inline text-[11px]">+ Circuit</span>
        </button>

        <button
          type="button"
          id="btn-create-electric-sheet"
          onClick={() => onCreateSheet('electric')}
          className="btn btn-outline-success btn-sm font-medium"
          title="Add new electric / analog circuit sheet"
        >
          <Zap size={12} className="text-emerald-500" />
          <span className="hidden sm:inline text-[11px]">+ Electric</span>
        </button>

        <button
          type="button"
          id="btn-create-flowchart-sheet"
          onClick={() => onCreateSheet('flowchart')}
          className="btn btn-outline-warning btn-sm font-medium"
          title="Add new algorithm flowchart sheet"
        >
          <GitFork size={12} />
          <span className="hidden sm:inline text-[11px]">+ Flowchart</span>
        </button>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          theme={theme}
          title={`Sheet: ${contextMenu.sheet.name}`}
          onClose={() => setContextMenu(null)}
          items={[
            {
              id: 'rename',
              label: 'Rename Sheet',
              icon: Edit2,
              shortcut: 'Double-click',
              onClick: () => startRename(contextMenu.sheet),
            },
            {
              id: 'duplicate',
              label: 'Duplicate Sheet',
              icon: Copy,
              onClick: () => onDuplicateSheet(contextMenu.sheet.id),
            },
            {
              id: 'div-add',
              label: '',
              divider: true,
            },
            {
              id: 'new-logic',
              label: 'New Logic Sheet',
              icon: Layers,
              onClick: () => onCreateSheet('logic'),
            },
            {
              id: 'new-electric',
              label: 'New Electric Sheet',
              icon: Zap,
              onClick: () => onCreateSheet('electric'),
            },
            {
              id: 'new-flowchart',
              label: 'New Flowchart Sheet',
              icon: GitFork,
              onClick: () => onCreateSheet('flowchart'),
            },
            {
              id: 'div-del',
              label: '',
              divider: true,
            },
            {
              id: 'delete',
              label: 'Delete Sheet',
              icon: Trash2,
              danger: true,
              disabled: sheets.length <= 1,
              onClick: () => onDeleteSheet(contextMenu.sheet.id),
            },
          ]}
        />
      )}
    </div>
  );
};
