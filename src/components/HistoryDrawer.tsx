import React from 'react';
import { History, X, Trash2, ArrowRight, Car, CheckCircle2 } from 'lucide-react';
import { DetectionResult } from '../types/parking';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: DetectionResult[];
  onSelectResult: (result: DetectionResult) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectResult,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-emerald-400" />
              <h3 className="font-semibold text-white">Detection History</h3>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                  title="Clear all history"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* List of past results */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {history.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <History className="mx-auto h-8 w-8 text-slate-700 mb-2" />
                <p>No recent parking lot scans saved yet.</p>
                <p className="mt-1">Scans you run are saved locally for easy recall.</p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectResult(item);
                    onClose();
                  }}
                  className="group relative flex gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 hover:border-emerald-500/40 hover:bg-slate-850 cursor-pointer transition-all"
                >
                  {/* Thumbnail */}
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt="Scan"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Car className="h-6 w-6 text-slate-700" />
                    )}
                    <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[9px] font-mono text-emerald-400">
                      {item.summary.occupancyRate}%
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white group-hover:text-emerald-400 truncate">
                        {item.overview.lotType || 'Parking Area'}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-emerald-400 shrink-0" />
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="text-emerald-400 font-mono">
                        {item.summary.vacantSpaces} free
                      </span>
                      <span>·</span>
                      <span className="text-slate-300 font-mono">
                        {item.summary.totalSpaces} total
                      </span>
                    </div>

                    <div className="mt-1 text-[10px] text-slate-500">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
