import React, { useEffect, useRef, useState } from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';

export interface ContextMenuItem {
  id?: string;
  label: string;
  icon?: LucideIcon;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  header?: string;
  onClick?: () => void;
  submenu?: ContextMenuItem[];
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  theme?: 'dark' | 'light';
  title?: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  items,
  onClose,
  theme = 'dark',
  title,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenuIndex, setActiveSubmenuIndex] = useState<number | null>(null);
  const [pos, setPos] = useState({ x, y });
  const isDark = theme === 'dark';

  // Adjust position to stay within viewport bounds
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const margin = 8;
    let adjustedX = x;
    let adjustedY = y;

    if (x + rect.width > window.innerWidth - margin) {
      adjustedX = Math.max(margin, window.innerWidth - rect.width - margin);
    }
    if (y + rect.height > window.innerHeight - margin) {
      adjustedY = Math.max(margin, window.innerHeight - rect.height - margin);
    }

    setPos({ x: adjustedX, y: adjustedY });
  }, [x, y, items]);

  // Click outside and Escape listeners
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={title || 'Context Menu'}
      className={`fixed z-[9999] min-w-[200px] max-w-[280px] select-none rounded-xl border p-1.5 shadow-2xl backdrop-blur-md transition-all duration-100 ease-out animate-in fade-in zoom-in-95 ${
        isDark
          ? 'border-slate-800 bg-slate-950/95 text-slate-200'
          : 'border-slate-300 bg-white/95 text-slate-800 shadow-slate-400/20'
      }`}
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {title && (
        <div
          className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
            isDark ? 'text-slate-400 border-b border-slate-800/80' : 'text-slate-500 border-b border-slate-200'
          } mb-1 flex items-center justify-between`}
        >
          <span className="truncate">{title}</span>
        </div>
      )}

      <div className="space-y-0.5">
        {items.map((item, index) => {
          if (item.header) {
            return (
              <div
                key={`header-${index}`}
                className={`px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-widest ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {item.header}
              </div>
            );
          }

          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isSubmenuActive = activeSubmenuIndex === index;

          return (
            <React.Fragment key={`item-${index}-${item.label}`}>
              {item.divider && (
                <div
                  className={`my-1 border-t ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}
                />
              )}

              <div
                className="relative"
                onMouseEnter={() => hasSubmenu && setActiveSubmenuIndex(index)}
                onMouseLeave={() => hasSubmenu && setActiveSubmenuIndex(null)}
              >
                <button
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.disabled) return;
                    if (item.onClick) {
                      item.onClick();
                      onClose();
                    }
                  }}
                  className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                    item.disabled
                      ? 'cursor-not-allowed opacity-40'
                      : item.danger
                      ? isDark
                        ? 'text-rose-400 hover:bg-rose-950/40 hover:text-rose-300'
                        : 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                      : isDark
                      ? 'hover:bg-slate-800/80 hover:text-white'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.icon && (
                    <item.icon
                      size={14}
                      className={`shrink-0 transition-colors ${
                        item.danger
                          ? isDark
                            ? 'text-rose-400'
                            : 'text-rose-600'
                          : isDark
                          ? 'text-slate-400 group-hover:text-sky-400'
                          : 'text-slate-500 group-hover:text-sky-600'
                      }`}
                    />
                  )}
                  <span className="flex-1 truncate font-medium">{item.label}</span>
                  {item.shortcut && (
                    <kbd
                      className={`ml-auto font-mono text-[10px] px-1 py-0.5 rounded ${
                        isDark
                          ? 'bg-slate-900 border border-slate-800 text-slate-400'
                          : 'bg-slate-100 border border-slate-200 text-slate-500'
                      }`}
                    >
                      {item.shortcut}
                    </kbd>
                  )}
                  {hasSubmenu && (
                    <ChevronRight
                      size={13}
                      className={`ml-1 shrink-0 ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    />
                  )}
                </button>

                {/* Submenu flyout */}
                {hasSubmenu && isSubmenuActive && (
                  <div
                    className={`absolute left-full top-0 ml-1 min-w-[180px] rounded-xl border p-1.5 shadow-2xl backdrop-blur-md z-[10000] ${
                      isDark
                        ? 'border-slate-800 bg-slate-950/95 text-slate-200'
                        : 'border-slate-300 bg-white/95 text-slate-800 shadow-slate-400/20'
                    }`}
                  >
                    {item.submenu!.map((subItem, subIndex) => (
                      <button
                        key={`sub-${subIndex}-${subItem.label}`}
                        type="button"
                        role="menuitem"
                        disabled={subItem.disabled}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (subItem.disabled) return;
                          if (subItem.onClick) {
                            subItem.onClick();
                            onClose();
                          }
                        }}
                        className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                          subItem.disabled
                            ? 'cursor-not-allowed opacity-40'
                            : isDark
                            ? 'hover:bg-slate-800/80 hover:text-white'
                            : 'hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {subItem.icon && (
                          <subItem.icon
                            size={14}
                            className={`shrink-0 ${
                              isDark
                                ? 'text-slate-400 group-hover:text-sky-400'
                                : 'text-slate-500 group-hover:text-sky-600'
                            }`}
                          />
                        )}
                        <span className="flex-1 truncate">{subItem.label}</span>
                        {subItem.shortcut && (
                          <kbd
                            className={`ml-auto font-mono text-[10px] px-1 py-0.5 rounded ${
                              isDark
                                ? 'bg-slate-900 border border-slate-800 text-slate-400'
                                : 'bg-slate-100 border border-slate-200 text-slate-500'
                            }`}
                          >
                            {subItem.shortcut}
                          </kbd>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
