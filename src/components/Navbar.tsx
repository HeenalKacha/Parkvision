import React from 'react';
import {
  Car,
  Camera,
  Upload,
  Download,
  History,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { DetectionResult } from '../types/parking';

interface NavbarProps {
  onNewUpload: () => void;
  onOpenCamera: () => void;
  onOpenHistory: () => void;
  onOpenExport: () => void;
  onReset: () => void;
  hasResult: boolean;
  result: DetectionResult | null;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewUpload,
  onOpenCamera,
  onOpenHistory,
  onOpenExport,
  onReset,
  hasResult,
  result,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand logo & title */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <Car className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border border-slate-950"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl font-display">
                ParkVision
              </h1>
              <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AI Vision
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block">
              Intelligent Parking Space Occupancy & Guidance
            </p>
          </div>
        </div>

        {/* Live status badge if result is active */}
        {hasResult && result && (
          <div className="hidden lg:flex items-center gap-4 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-400">Vacant:</span>
              <span className="font-mono font-semibold text-emerald-400">
                {result.summary.vacantSpaces}
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-rose-400"></span>
              <span className="text-slate-400">Occupied:</span>
              <span className="font-mono font-semibold text-rose-400">
                {result.summary.occupiedSpaces}
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Occupancy:</span>
              <span className="font-mono font-semibold text-white">
                {result.summary.occupancyRate}%
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenCamera}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title="Capture photo with webcam/camera"
          >
            <Camera className="h-4 w-4 text-emerald-400" />
            <span className="hidden sm:inline">Camera</span>
          </button>

          <button
            onClick={onNewUpload}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title="Upload new image"
          >
            <Upload className="h-4 w-4 text-teal-400" />
            <span className="hidden sm:inline">Upload Image</span>
          </button>

          {hasResult && (
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title="Export report and annotated photo"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}

          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title="Recent scans history"
          >
            <History className="h-4 w-4 text-slate-400" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950">
                {historyCount}
              </span>
            )}
          </button>

          {hasResult && (
            <button
              onClick={onReset}
              className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title="Reset analysis"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
