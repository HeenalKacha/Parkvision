import React, { useState } from 'react';
import { Download, FileText, Image as ImageIcon, Code, X, Check } from 'lucide-react';
import { DetectionResult } from '../types/parking';
import { exportToJson, exportToCsv, exportAnnotatedImage } from '../utils/export';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: DetectionResult;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJson = () => {
    setExportError(null);
    exportToJson(result, `parking-occupancy-${result.id}.json`);
    triggerSuccess('JSON Report downloaded');
  };

  const handleExportCsv = () => {
    setExportError(null);
    exportToCsv(result, `parking-occupancy-${result.id}.csv`);
    triggerSuccess('CSV Spreadsheet downloaded');
  };

  const handleExportImage = async () => {
    setExportError(null);
    try {
      setIsExportingImage(true);
      await exportAnnotatedImage(
        result.imageUrl,
        result.spaces,
        `parking-annotated-${result.id}.png`
      );
      triggerSuccess('Annotated image downloaded');
    } catch (err) {
      console.error('Image export failed:', err);
      setExportError('Failed to generate annotated image. Cross-origin images may be restricted.');
    } finally {
      setIsExportingImage(false);
    }
  };

  const triggerSuccess = (msg: string) => {
    setDownloadSuccess(msg);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold text-white">Export Occupancy Data</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-400">
            Export detection metrics, slot coordinates, and annotated overlays for reports, dispatch systems, or record-keeping.
          </p>

          {/* Option 1: Annotated Image */}
          <button
            onClick={handleExportImage}
            disabled={isExportingImage}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-emerald-500/50 hover:bg-slate-900 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  Annotated Image (.PNG)
                </h4>
                <p className="text-[11px] text-slate-400">
                  High-res image with all bounding boxes and slot status badges drawn
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-emerald-400">
              {isExportingImage ? 'Rendering...' : 'Download'}
            </span>
          </button>

          {/* Option 2: CSV Spreadsheet */}
          <button
            onClick={handleExportCsv}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-emerald-500/50 hover:bg-slate-900 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white group-hover:text-teal-400 transition-colors">
                  CSV Spreadsheet (.CSV)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Tabular data with slot IDs, occupied status, vehicle details & coords
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-teal-400">Download</span>
          </button>

          {/* Option 3: JSON Report */}
          <button
            onClick={handleExportJson}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-emerald-500/50 hover:bg-slate-900 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Code className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  JSON Raw Payload (.JSON)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Full programmatic schema for integration with smart city / parking APIs
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-cyan-400">Download</span>
          </button>

          {downloadSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 p-2.5 text-xs text-emerald-300">
              <Check className="h-4 w-4" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {exportError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/20 border border-rose-500/30 p-2.5 text-xs text-rose-300">
              <span>{exportError}</span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
