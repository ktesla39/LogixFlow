import React, { useState, useMemo } from 'react';
import { Sheet } from '../types';
import {
  Download,
  Upload,
  Copy,
  Check,
  X,
  RefreshCw,
  Image as ImageIcon,
  FileCode,
  Loader2,
  Sparkles,
  Crop,
  Maximize2,
  Layers,
  Palette,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';

interface ExportImportModalProps {
  theme?: 'dark' | 'light';
  isOpen: boolean;
  sheets: Sheet[];
  activeSheetId: string;
  onClose: () => void;
  onImportSheets: (imported: Sheet[]) => void;
  onResetToDefaults: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  theme = 'light',
  isOpen,
  sheets,
  activeSheetId,
  onClose,
  onImportSheets,
  onResetToDefaults,
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'png' | 'json'>('png');
  const [pixelRatio, setPixelRatio] = useState<number>(2); // 2x Retina default
  const [framingMode, setFramingMode] = useState<'crop' | 'visible'>('crop'); // Auto-crop to content vs visible canvas
  const [includeGrid, setIncludeGrid] = useState<boolean>(true);
  const [bgChoice, setBgChoice] = useState<'canvas' | 'white' | 'dark' | 'transparent'>('canvas');
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
  const [pngPreviewUrl, setPngPreviewUrl] = useState<string | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState<{ width: number; height: number } | null>(null);

  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmResetExamples, setConfirmResetExamples] = useState(false);

  const currentSheet = sheets.find((s) => s.id === activeSheetId) || sheets[0] || {
    id: 'sheet_fallback',
    name: 'Main Circuit',
    nodes: [],
    wires: [],
    pan: { x: 0, y: 0 },
    zoom: 1,
    updatedAt: Date.now(),
  };

  // Detect whether the current diagram is a digital logic circuit or an algorithm flowchart
  const isFlowchart =
    currentSheet.circuitType === 'flowchart' ||
    currentSheet.nodes.some((n) =>
      ['FLOW_START', 'FLOW_PROCESS', 'FLOW_DECISION', 'FLOW_IO', 'FLOW_END'].includes(n.type)
    );

  const diagramTypeName = isFlowchart ? 'Algorithm Flowchart' : 'Digital Circuit';

  // Calculate bounding box and estimated dimensions
  const contentBounds = useMemo(() => {
    if (!currentSheet.nodes || currentSheet.nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    currentSheet.nodes.forEach((n) => {
      const nodeW = n.width || 90;
      const nodeH = n.height || 60;
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + nodeW);
      maxY = Math.max(maxY, n.y + nodeH);
    });

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(120, maxX - minX),
      height: Math.max(80, maxY - minY),
    };
  }, [currentSheet.nodes]);

  if (!isOpen) return null;

  const handleExportPng = async (mode: 'download' | 'copy') => {
    setIsExportingPng(true);
    setStatusMsg(null);

    try {
      const canvasEl = document.getElementById('logicflow-canvas');
      if (!canvasEl) {
        throw new Error('Circuit/flowchart canvas element not found on page.');
      }
      const canvasRect = canvasEl.getBoundingClientRect();
      const canvasWidth = Math.max(1, Math.round(canvasEl.clientWidth || canvasRect.width || 1200));
      const canvasHeight = Math.max(1, Math.round(canvasEl.clientHeight || canvasRect.height || 800));

      // Filter out UI control overlays, floating panels, minimap, inspector, and selection boxes
      const filter = (node: HTMLElement) => {
        if (!node) return true;
        if (
          node.getAttribute &&
          (node.getAttribute('data-export-ignore') === 'true' ||
            node.getAttribute('data-export-ignore') === '')
        ) {
          return false;
        }
        if (
          node.classList &&
          (node.classList.contains('logicflow-export-ignore') ||
            node.classList.contains('canvas-controls-overlay') ||
            node.classList.contains('canvas-zoom-control') ||
            node.classList.contains('canvas-tool-switcher'))
        ) {
          return false;
        }
        if (node.id === 'component-inspector' || node.id === 'flowchart-panel') {
          return false;
        }
        if (!includeGrid && node.id === 'logicflow-grid-svg') {
          return false;
        }
        return true;
      };

      let resolvedBg: string | undefined = undefined;
      if (bgChoice === 'white') resolvedBg = '#ffffff';
      else if (bgChoice === 'dark') resolvedBg = '#0b0f19';
      else if (bgChoice === 'transparent') resolvedBg = 'transparent';

      // Capture canvas with high resolution scale. html-to-image can stall on
      // unsupported browser CSS, so bound the operation and keep the modal usable.
      let dataUrl: string;
      try {
        let timeoutId: number | undefined;
        dataUrl = await Promise.race([
          toPng(canvasEl, {
            pixelRatio,
            backgroundColor: resolvedBg,
            filter: filter as any,
            cacheBust: true,
            skipFonts: true,
          }),
          new Promise<string>((_, reject) => {
            timeoutId = window.setTimeout(
              () => reject(new Error('Image capture timed out')),
              8000
            );
          }),
        ]);
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      } catch (captureError) {
        if (currentSheet.nodes.length > 0) throw captureError;

        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = canvasWidth * pixelRatio;
        fallbackCanvas.height = canvasHeight * pixelRatio;
        const fallbackContext = fallbackCanvas.getContext('2d');
        if (!fallbackContext) throw captureError;
        if (resolvedBg && resolvedBg !== 'transparent') {
          fallbackContext.fillStyle = resolvedBg;
          fallbackContext.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
        }
        dataUrl = fallbackCanvas.toDataURL('image/png');
        setStatusMsg({
          type: 'success',
          text: 'Exported an empty canvas image. Add components for a diagram capture.',
        });
      }

      // Auto-crop to diagram bounding box if requested and nodes exist
      if (framingMode === 'crop' && currentSheet.nodes.length > 0) {
        const zoom = currentSheet.zoom || 1;
        const pan = currentSheet.pan || { x: 0, y: 0 };
        const padding = 50; // generous padding in world units

        const worldMinX = contentBounds.minX - padding;
        const worldMinY = contentBounds.minY - padding;
        const worldMaxX = contentBounds.maxX + padding;
        const worldMaxY = contentBounds.maxY + padding;

        const screenX1 = Math.max(0, Math.floor(worldMinX * zoom + pan.x));
        const screenY1 = Math.max(0, Math.floor(worldMinY * zoom + pan.y));
        const screenX2 = Math.min(canvasWidth, Math.ceil(worldMaxX * zoom + pan.x));
        const screenY2 = Math.min(canvasHeight, Math.ceil(worldMaxY * zoom + pan.y));

        const cropW = Math.max(100, screenX2 - screenX1);
        const cropH = Math.max(80, screenY2 - screenY1);

        // Load into offscreen canvas for cropping
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to process image buffer'));
          img.src = dataUrl;
        });

        const offscreen = document.createElement('canvas');
        offscreen.width = cropW * pixelRatio;
        offscreen.height = cropH * pixelRatio;
        const ctx = offscreen.getContext('2d');
        if (ctx) {
          if (resolvedBg && resolvedBg !== 'transparent') {
            ctx.fillStyle = resolvedBg;
            ctx.fillRect(0, 0, offscreen.width, offscreen.height);
          }
          ctx.drawImage(
            img,
            screenX1 * pixelRatio,
            screenY1 * pixelRatio,
            cropW * pixelRatio,
            cropH * pixelRatio,
            0,
            0,
            cropW * pixelRatio,
            cropH * pixelRatio
          );
          dataUrl = offscreen.toDataURL('image/png');
          setPreviewDimensions({ width: offscreen.width, height: offscreen.height });
        }
      } else {
        setPreviewDimensions({
          width: canvasWidth * pixelRatio,
          height: canvasHeight * pixelRatio,
        });
      }

      setPngPreviewUrl(dataUrl);

      const typeSlug = isFlowchart ? 'flowchart' : 'circuit';
      const sheetSlug = (currentSheet.name || typeSlug)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

      if (mode === 'download') {
        const link = document.createElement('a');
        link.download = `${sheetSlug}_${typeSlug}_${pixelRatio}x.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setStatusMsg({
          type: 'success',
          text: `High-resolution PNG saved successfully (${pixelRatio}x scale · ${currentSheet.name})!`,
        });
      } else {
        // Copy to clipboard
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          if (navigator.clipboard?.write && window.ClipboardItem) {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            setStatusMsg({ type: 'success', text: 'High-resolution PNG copied to clipboard!' });
          } else {
            throw new Error('ClipboardItem API not supported in this browser.');
          }
        } catch {
          // Fallback download if direct clipboard write fails
          const link = document.createElement('a');
          link.download = `${sheetSlug}_${typeSlug}_${pixelRatio}x.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setStatusMsg({
            type: 'success',
            text: 'Direct clipboard image paste unavailable; downloaded PNG file instead.',
          });
        }
      }
    } catch (err: any) {
      console.error('Export PNG failed:', err);
      setStatusMsg({
        type: 'error',
        text: `Export failed: ${err.message || 'Error capturing diagram'}. Try adjusting framing or zooming closer.`,
      });
    } finally {
      setIsExportingPng(false);
    }
  };

  const exportCurrentSheet = () => {
    const data = JSON.stringify([currentSheet], null, 2);
    setJsonText(data);
    setStatusMsg({ type: 'success', text: `Loaded "${currentSheet.name}" JSON below` });
  };

  const exportAllSheets = () => {
    const data = JSON.stringify(sheets, null, 2);
    setJsonText(data);
    setStatusMsg({ type: 'success', text: `Loaded all ${sheets.length} sheets JSON below` });
  };

  const copyJson = async () => {
    if (!jsonText) exportAllSheets();
    const textToCopy = jsonText || JSON.stringify(sheets, null, 2);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const fallback = document.createElement('textarea');
        fallback.value = textToCopy;
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
      setStatusMsg({ type: 'error', text: 'Unable to copy JSON on this device.' });
    }
  };

  const downloadFile = (format: 'lgkx' | 'json' = 'lgkx') => {
    const textToSave = jsonText || JSON.stringify({
      version: '2.0.0',
      exportedAt: Date.now(),
      format: 'lgkx',
      activeSheetId,
      sheets,
    }, null, 2);
    const blob = new Blob([textToSave], { type: format === 'lgkx' ? 'application/octet-stream' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const baseName = (currentSheet.name || 'logixflow_project').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `${baseName}-${Date.now()}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setJsonText(content);
      tryImport(content);
    };
    reader.readAsText(file);
  };

  const tryImport = (rawText?: string) => {
    const toParse = rawText || jsonText;
    try {
      const parsed = JSON.parse(toParse);
      let importedSheets: Sheet[] = [];

      if (Array.isArray(parsed)) {
        importedSheets = parsed;
      } else if (parsed && typeof parsed === 'object' && parsed.sheets && Array.isArray(parsed.sheets)) {
        importedSheets = parsed.sheets;
      } else if (parsed && typeof parsed === 'object' && parsed.nodes) {
        importedSheets = [parsed];
      } else {
        throw new Error('Invalid format: expected .lgkx project or sheet object');
      }

      if (importedSheets.length === 0) {
        throw new Error('At least one sheet is required');
      }

      onImportSheets(importedSheets);
      setStatusMsg({ type: 'success', text: `Successfully imported ${importedSheets.length} sheet(s) from .lgkx workspace!` });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Failed to import file: ${err.message || 'Syntax error'}` });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className={`export-modal-${theme} ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b ${isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-sky-950/80 text-sky-400 border border-sky-800/60' : 'bg-sky-100 text-sky-600 border border-sky-200'}`}>
              <Download size={18} />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Export & Download Center</h2>
              <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span>Current diagram:</span>
                <span className={`${isDark ? 'text-sky-400' : 'text-sky-600'} font-semibold`}>{currentSheet.name}</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded font-medium ${isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-300'}`}>
                  {diagramTypeName}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-icon btn-outline-secondary"
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher: PNG Image vs JSON Project */}
        <div className={`flex border-b ${isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-100/60'} px-5 pt-2`}>
          <button
            type="button"
            id="tab-download-png"
            onClick={() => setActiveTab('png')}
            className={`pb-2.5 px-3 flex items-center gap-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'png'
                ? isDark ? 'border-sky-500 text-sky-400' : 'border-sky-600 text-sky-600'
                : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ImageIcon size={14} />
            <span>Download as PNG</span>
            <span className="badge bg-primary text-white text-[10px] font-bold">
              High-Res
            </span>
          </button>
          <button
            type="button"
            id="tab-json-backup"
            onClick={() => setActiveTab('json')}
            className={`pb-2.5 px-3 flex items-center gap-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'json'
                ? isDark ? 'border-sky-500 text-sky-400' : 'border-sky-600 text-sky-600'
                : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileCode size={14} />
            <span>Workspace (.lgkx) / JSON</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {statusMsg && (
            <div
              className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-700 text-rose-300'
              }`}
            >
              <Sparkles size={14} className="shrink-0" />
              <span>{statusMsg.text}</span>
            </div>
          )}

          {activeTab === 'png' ? (
            /* PNG Export Panel */
            <div className="space-y-4">
              {/* Diagram Summary Banner */}
              <div className={`${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} border rounded-xl p-3.5 space-y-2.5`}>
                <div className="flex items-center justify-between">
                  <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'} text-xs flex items-center gap-1.5`}>
                    <ImageIcon size={14} className="text-sky-500" />
                    <span>Save {diagramTypeName} as High-Resolution Image</span>
                  </div>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono`}>
                    {currentSheet.nodes.length} items · {currentSheet.wires.length} wires
                  </span>
                </div>
                <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-[11px] leading-relaxed`}>
                  Export publication-quality diagrams for lab reports, research papers, assignment submissions, slides, or portfolio graphics with crystal-clear vector rasterization.
                </p>
              </div>

              {/* Settings Configuration Grid */}
              <div className={`${isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'} border rounded-xl p-3.5 space-y-3`}>
                <div className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wider flex items-center gap-1.5`}>
                  <Palette size={13} className="text-sky-500" />
                  <span>Image Export Options</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Resolution / Scale Preset */}
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium flex items-center justify-between`}>
                      <span>Resolution (DPI / Scale):</span>
                      <span className={`text-[10px] ${isDark ? 'text-sky-400' : 'text-sky-600'} font-mono`}>
                        {pixelRatio === 1
                          ? '1080p Standard'
                          : pixelRatio === 2
                          ? '2K Retina (Crisp)'
                          : pixelRatio === 3
                          ? '4K Ultra HD (Print)'
                          : '8K Super High-Res'}
                      </span>
                    </label>
                    <select
                      id="export-pixel-ratio-select"
                      value={pixelRatio}
                      onChange={(e) => setPixelRatio(Number(e.target.value))}
                      className={`${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-sky-500 cursor-pointer`}
                    >
                      <option value={1}>Standard 1x (1080p / 96 DPI)</option>
                      <option value={2}>Retina 2x (Recommended · 192 DPI)</option>
                      <option value={3}>Ultra 3x (Print Quality · 300 DPI)</option>
                      <option value={4}>Super 4x (Maximum Definition · 400+ DPI)</option>
                    </select>
                  </div>

                  {/* Framing / Crop Mode */}
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium flex items-center justify-between`}>
                      <span>Framing / Area:</span>
                      <span className={`text-[10px] ${isDark ? 'text-sky-400' : 'text-sky-600'} font-mono`}>
                        {framingMode === 'crop' ? 'Auto-Framed' : 'Full Canvas'}
                      </span>
                    </label>
                    <div className="btn-group w-full" role="group" aria-label="Framing area">
                      <button
                        type="button"
                        onClick={() => setFramingMode('crop')}
                        className={`btn btn-sm ${
                          framingMode === 'crop'
                            ? 'btn-primary'
                            : 'btn-outline-secondary'
                        }`}
                        title="Tightly crop around diagram components with clean margins"
                      >
                        <Crop size={12} />
                        <span>Auto-Crop</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFramingMode('visible')}
                        className={`btn btn-sm ${
                          framingMode === 'visible'
                            ? 'btn-primary'
                            : 'btn-outline-secondary'
                        }`}
                        title="Export the entire visible viewport as currently panned/zoomed"
                      >
                        <Maximize2 size={12} />
                        <span>Visible View</span>
                      </button>
                    </div>
                  </div>

                  {/* Background Tone */}
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>Background:</label>
                    <select
                      id="export-background-select"
                      value={bgChoice}
                      onChange={(e) => setBgChoice(e.target.value as any)}
                      className={`form-select form-select-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-sky-500 cursor-pointer`}
                    >
                      <option value="canvas">Current Canvas Theme</option>
                      <option value="white">Clean White (#FFFFFF) - For Reports</option>
                      <option value="dark">Dark Blueprint (#0B0F19) - For Slides</option>
                      <option value="transparent">Transparent (PNG Alpha)</option>
                    </select>
                  </div>

                  {/* Grid Lines Toggle */}
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>Grid Overlay:</label>
                    <button
                      type="button"
                      onClick={() => setIncludeGrid(!includeGrid)}
                      className={`btn btn-sm ${
                        includeGrid
                          ? 'btn-info'
                          : 'btn-outline-secondary'
                      }`}
                    >
                      <Layers size={13} />
                      <span>{includeGrid ? 'Grid Lines Included' : 'Clean (No Grid)'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  id="btn-download-as-png"
                  disabled={isExportingPng}
                  onClick={() => handleExportPng('download')}
                  className="btn btn-primary btn-lg flex-1 font-bold text-xs shadow-md"
                  title="Generate and download high-resolution PNG image"
                >
                  {isExportingPng ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Rendering High-Res PNG Image...</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>Download as PNG</span>
                      <span className="text-[10px] opacity-80 font-normal">
                        ({pixelRatio}x Resolution)
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isExportingPng}
                  onClick={() => handleExportPng('copy')}
                  className="btn btn-outline-secondary btn-lg font-semibold text-xs"
                  title="Copy high-res image directly to system clipboard"
                >
                  <Copy size={15} />
                  <span>Copy Image</span>
                </button>
              </div>

              {/* Generated Preview Card */}
              {pngPreviewUrl && (
                <div className="mt-3 border border-slate-800 rounded-xl p-3 bg-slate-950/70 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle2 size={13} />
                      <span>Export Generated Successfully</span>
                    </div>
                    {previewDimensions && (
                      <span className="font-mono text-slate-400">
                        {previewDimensions.width} × {previewDimensions.height} px
                      </span>
                    )}
                  </div>
                  <div className="max-h-52 overflow-hidden rounded-lg border border-slate-800/90 bg-slate-900/90 flex items-center justify-center p-2 relative group">
                    <img
                      src={pngPreviewUrl}
                      alt={`${currentSheet.name} circuit export`}
                      className="max-h-48 object-contain rounded shadow-sm"
                    />
                    <a
                      href={pngPreviewUrl}
                      download={`${currentSheet.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${pixelRatio}x.png`}
                      className="btn btn-primary btn-sm absolute bottom-3 right-3 shadow-md flex items-center gap-1"
                    >
                      <Download size={12} />
                      <span>Re-download</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* JSON Backup & Restore Panel */
            <div className="space-y-4">
              {/* Quick PNG download shortcut banner inside JSON tab */}
              <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon size={15} className="text-sky-400" />
                  <div>
                    <span className="font-semibold text-slate-200">Looking for an image?</span>
                    <p className="text-[11px] text-slate-400">Save current diagram as a high-res PNG file</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('png')}
                  className="btn btn-primary btn-sm font-bold"
                >
                  <Download size={13} />
                  <span>Download as PNG</span>
                </button>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={exportCurrentSheet}
                  className="btn btn-outline-secondary btn-sm font-medium"
                >
                  Current Sheet
                </button>
                <button
                  type="button"
                  onClick={exportAllSheets}
                  className="btn btn-outline-secondary btn-sm font-medium"
                >
                  All Sheets
                </button>
                <button
                  type="button"
                  onClick={() => downloadFile('lgkx')}
                  className="btn btn-primary btn-sm font-medium"
                  title="Export complete workspace in LogixFlow (.lgkx) format"
                >
                  <Download size={13} />
                  Save .lgkx
                </button>
                <button
                  type="button"
                  onClick={() => downloadFile('json')}
                  className="btn btn-outline-secondary btn-sm font-medium"
                  title="Export raw JSON"
                >
                  <Download size={13} />
                  Save JSON
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="btn btn-outline-secondary btn-sm font-medium cursor-pointer">
                  <Upload size={13} />
                  Import File (.lgkx / .lgf / .json)
                  <input type="file" accept=".lgkx,.lgf,.json" onChange={handleFileUpload} className="hidden" />
                </label>
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'} font-mono`}>
                  Format: <strong>.lgkx</strong> (Workspace)
                </span>
              </div>

              {/* JSON Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`${isDark ? 'text-slate-400' : 'text-slate-600'} font-medium`}>Workspace .lgkx / JSON Data:</span>
                  <button
                    type="button"
                    onClick={copyJson}
                    className="btn btn-sm btn-outline-info py-0.5 px-2 text-[11px]"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder="Paste LogixFlow .lgkx or JSON data here to import, or click 'All Sheets' to export..."
                  className={`w-full ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl p-3 font-mono text-[11px] focus:outline-none focus:border-sky-500 scrollbar-thin`}
                />
              </div>

              {/* Reset to Default Presets */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400 text-xs">Restore factory circuit examples?</span>
                {confirmResetExamples ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onResetToDefaults();
                        setConfirmResetExamples(false);
                        onClose();
                      }}
                      className="btn btn-danger btn-sm text-xs font-bold"
                    >
                      Confirm Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmResetExamples(false)}
                      className="btn btn-outline-secondary btn-sm text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmResetExamples(true)}
                    className="btn btn-outline-danger btn-sm"
                  >
                    <RefreshCw size={13} />
                    Reset Examples
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/50">
          <span className="text-[11px] text-slate-500">
            {activeTab === 'png'
              ? `High-resolution PNG (${pixelRatio}x scale · ${framingMode === 'crop' ? 'Auto-Crop' : 'Full View'})`
              : 'Compatible with LogixFlow v2.0+'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline-secondary btn-sm"
            >
              Close
            </button>
            {activeTab === 'json' && (
              <button
                type="button"
                onClick={() => tryImport()}
                disabled={!jsonText.trim()}
                className="btn btn-primary btn-sm font-semibold shadow"
              >
                Import JSON
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
