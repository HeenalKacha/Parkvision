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
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand logo & title */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <Car className="h-5 w-5 text-white stroke-[2.5]" />
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border border-white"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl font-display">
                ParkVision
              </h1>
              <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                AI Vision
              </span>
            </div>
            <p className="hidden text-xs text-gray-500 sm:block">
              Intelligent Parking Space Occupancy & Guidance
            </p>
          </div>
        </div>

        {/* Live status badge if result is active */}
        {hasResult && result && (
          <div className="hidden lg:flex items-center gap-4 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-gray-600">Vacant:</span>
              <span className="font-mono font-semibold text-emerald-600">
                {result.summary.vacantSpaces}
              </span>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-rose-500"></span>
              <span className="text-gray-600">Occupied:</span>
              <span className="font-mono font-semibold text-rose-600">
                {result.summary.occupiedSpaces}
              </span>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Occupancy:</span>
              <span className="font-mono font-semibold text-gray-900">
                {result.summary.occupancyRate}%
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenCamera}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-sm"
            title="Capture photo with webcam/camera"
          >
            <Camera className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Camera</span>
          </button>

          <button
            onClick={onNewUpload}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-sm"
            title="Upload new image"
          >
            <Upload className="h-4 w-4 text-teal-600" />
            <span className="hidden sm:inline">Upload Image</span>
          </button>

          {hasResult && (
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-sm"
              title="Export report and annotated photo"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}

          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white p-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-sm"
            title="Recent scans history"
          >
            <History className="h-4 w-4 text-gray-500" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                {historyCount}
              </span>
            )}
          </button>

          {hasResult && (
            <button
              onClick={onReset}
              className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-sm"
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
